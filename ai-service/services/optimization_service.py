"""
Optimization Service - Match helpers to tasks
Uses weighted scoring + constraint satisfaction (NO LLM)
"""
from typing import Dict, List, Any, Optional
import structlog

logger = structlog.get_logger()


class OptimizationService:
    """
    Optimization Engine - Smart matching without AI
    
    Algorithms:
    1. Helper-Task Matching (greedy weighted scoring)
    2. Schedule Optimization (constraint satisfaction)
    3. Route Optimization (simple distance-based)
    """
    
    def __init__(self):
        # Matching weights
        self.matching_weights = {
            "quality_score": 0.30,      # Helper quality
            "distance": 0.25,            # Proximity to task
            "availability": 0.20,        # Time availability
            "price_match": 0.15,         # Price range match
            "experience": 0.10,          # Experience in service type
        }
    
    def match(
        self,
        task_data: Dict[str, Any],
        available_helpers: List[Dict[str, Any]],
        preferences: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Match helpers to task using weighted scoring
        
        Args:
            task_data: {
                "service_category": "cleaning",
                "location": {"lat": 51.5, "lng": -0.1},
                "preferred_time": "2025-01-05T10:00:00",
                "budget": 50,
                "urgency": "high"
            }
            available_helpers: List of helper profiles
            preferences: Optional customer preferences
        
        Returns:
            Sorted list of helpers with match scores
        """
        preferences = preferences or {}
        
        # Score each helper
        scored_helpers = []
        
        for helper in available_helpers:
            # Calculate match score
            match_score = self._calculate_match_score(task_data, helper, preferences)
            
            # Check hard constraints
            if not self._meets_constraints(task_data, helper):
                continue  # Skip if doesn't meet requirements
            
            scored_helpers.append({
                **helper,
                "match_score": match_score["total"],
                "match_breakdown": match_score["breakdown"],
                "match_reasons": match_score["reasons"]
            })
        
        # Sort by match score (descending)
        scored_helpers.sort(key=lambda x: x["match_score"], reverse=True)
        
        # Return top 10
        return scored_helpers[:10]
    
    def _calculate_match_score(
        self,
        task_data: Dict[str, Any],
        helper: Dict[str, Any],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate match score between task and helper"""
        breakdown = {}
        reasons = []
        
        # 1. Quality Score (0-5 → 0-100)
        quality_score = helper.get("quality_score", 3.0)
        breakdown["quality"] = (quality_score / 5) * 100 * self.matching_weights["quality_score"]
        
        if quality_score >= 4.5:
            reasons.append("Top-rated helper")
        
        # 2. Distance Score (0-100, closer is better)
        task_location = task_data.get("location", {})
        helper_location = helper.get("location", {})
        
        if task_location and helper_location:
            distance_km = self._calculate_distance(task_location, helper_location)
            helper["distance_km"] = distance_km
            
            # Score: 100 if < 5km, decreases linearly, 0 if > 50km
            distance_score = max(0, 100 - (distance_km / 50 * 100))
            breakdown["distance"] = distance_score * self.matching_weights["distance"]
            
            if distance_km < 5:
                reasons.append(f"Very close ({distance_km:.1f}km)")
            elif distance_km < 10:
                reasons.append(f"Nearby ({distance_km:.1f}km)")
        else:
            breakdown["distance"] = 50 * self.matching_weights["distance"]  # Neutral
        
        # 3. Availability Score (0-100)
        preferred_time = task_data.get("preferred_time")
        helper_availability = helper.get("availability", [])
        
        availability_score = self._score_availability(preferred_time, helper_availability)
        breakdown["availability"] = availability_score * self.matching_weights["availability"]
        
        if availability_score >= 90:
            reasons.append("Available at your preferred time")
        
        # 4. Price Match Score (0-100)
        task_budget = task_data.get("budget", 0)
        helper_rate = helper.get("hourly_rate", 0)
        estimated_hours = task_data.get("estimated_hours", 3)
        
        estimated_cost = helper_rate * estimated_hours
        
        if task_budget > 0:
            # Score based on how well price matches budget
            if estimated_cost <= task_budget:
                price_match_score = 100  # Within budget = perfect
                reasons.append("Within your budget")
            elif estimated_cost <= task_budget * 1.2:
                price_match_score = 70  # Slightly over = acceptable
            else:
                price_match_score = 30  # Too expensive
        else:
            price_match_score = 50  # No budget specified = neutral
        
        breakdown["price_match"] = price_match_score * self.matching_weights["price_match"]
        
        # 5. Experience Score (0-100)
        service_category = task_data.get("service_category")
        helper_services = helper.get("services", [])
        
        if service_category in helper_services:
            # Count jobs in this category
            category_jobs = helper.get(f"{service_category}_jobs", 0)
            
            if category_jobs >= 50:
                experience_score = 100
                reasons.append(f"Expert in {service_category}")
            elif category_jobs >= 20:
                experience_score = 80
                reasons.append(f"Experienced in {service_category}")
            elif category_jobs >= 5:
                experience_score = 60
            else:
                experience_score = 40
        else:
            experience_score = 0  # Doesn't offer this service
        
        breakdown["experience"] = experience_score * self.matching_weights["experience"]
        
        # 6. Apply preference bonuses
        if preferences.get("prefer_verified") and helper.get("verification_level", 0) >= 2:
            breakdown["verification_bonus"] = 10
            reasons.append("Verified helper")
        
        if preferences.get("prefer_top_rated") and quality_score >= 4.5:
            breakdown["top_rated_bonus"] = 10
        
        # Calculate total
        total = sum(breakdown.values())
        total = min(100, total)  # Cap at 100
        
        return {
            "total": round(total, 2),
            "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "reasons": reasons
        }
    
    def _calculate_distance(
        self,
        location1: Dict[str, float],
        location2: Dict[str, float]
    ) -> float:
        """
        Calculate distance between two lat/lng points (haversine formula)
        Returns distance in kilometers
        """
        from math import radians, sin, cos, sqrt, atan2
        
        lat1 = radians(location1.get("lat", 0))
        lng1 = radians(location1.get("lng", 0))
        lat2 = radians(location2.get("lat", 0))
        lng2 = radians(location2.get("lng", 0))
        
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        # Earth radius in km
        radius = 6371
        
        distance = radius * c
        return round(distance, 2)
    
    def _score_availability(
        self,
        preferred_time: Optional[str],
        helper_availability: List[Dict[str, Any]]
    ) -> float:
        """
        Score how well helper's availability matches preferred time
        Returns 0-100
        """
        if not preferred_time or not helper_availability:
            return 50  # Neutral if no data
        
        # Simplified version - check if preferred time is in availability
        # In production, parse ISO timestamps and check overlaps
        
        # For now, return fixed scores based on availability status
        if len(helper_availability) > 0:
            # Check if any slot matches
            for slot in helper_availability:
                if slot.get("status") == "available":
                    return 90  # Available
        
        return 30  # Not available
    
    def _meets_constraints(
        self,
        task_data: Dict[str, Any],
        helper: Dict[str, Any]
    ) -> bool:
        """
        Check if helper meets hard constraints
        Returns False if helper should be excluded
        """
        # 1. Service type constraint
        service_category = task_data.get("service_category")
        helper_services = helper.get("services", [])
        
        if service_category and service_category not in helper_services:
            return False  # Helper doesn't offer this service
        
        # 2. Verification constraint
        min_verification = task_data.get("min_verification_level", 0)
        helper_verification = helper.get("verification_level", 0)
        
        if helper_verification < min_verification:
            return False  # Not verified enough
        
        # 3. Distance constraint
        max_distance = task_data.get("max_distance_km", 50)
        distance = helper.get("distance_km", 0)
        
        if distance > max_distance:
            return False  # Too far
        
        # 4. Budget constraint (hard limit)
        max_budget = task_data.get("max_budget", None)
        if max_budget:
            helper_rate = helper.get("hourly_rate", 0)
            estimated_hours = task_data.get("estimated_hours", 3)
            estimated_cost = helper_rate * estimated_hours
            
            if estimated_cost > max_budget * 1.5:
                return False  # Way over budget
        
        # 5. Status constraint
        helper_status = helper.get("status", "")
        if helper_status in ["BANNED", "SUSPENDED", "INACTIVE"]:
            return False  # Not eligible
        
        return True  # Meets all constraints
    
    def optimize_schedule(
        self,
        bookings: List[Dict[str, Any]],
        helper: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Optimize helper's schedule to minimize travel time
        Returns reordered bookings
        """
        if len(bookings) <= 1:
            return bookings
        
        # Simple greedy algorithm: nearest neighbor
        optimized = []
        remaining = bookings.copy()
        
        # Start with first booking
        current = remaining.pop(0)
        optimized.append(current)
        
        while remaining:
            current_location = current.get("location", {})
            
            # Find nearest remaining booking
            nearest = min(
                remaining,
                key=lambda b: self._calculate_distance(
                    current_location,
                    b.get("location", {})
                )
            )
            
            optimized.append(nearest)
            remaining.remove(nearest)
            current = nearest
        
        return optimized
    
    def suggest_price(
        self,
        task_data: Dict[str, Any],
        market_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Suggest optimal price for task
        Based on market rates, urgency, complexity
        """
        service_category = task_data.get("service_category", "general")
        urgency = task_data.get("urgency", "medium")
        estimated_hours = task_data.get("estimated_hours", 3)
        
        # Base rates (from market data or defaults)
        base_rates = market_data.get("base_rates", {
            "cleaning": 25,
            "moving": 40,
            "recycling": 20,
            "handyman": 35,
            "gardening": 30,
            "delivery": 15,
        })
        
        base_rate = base_rates.get(service_category, 25)
        
        # Apply urgency multiplier
        urgency_multipliers = {
            "high": 1.3,
            "medium": 1.0,
            "low": 0.85
        }
        multiplier = urgency_multipliers.get(urgency, 1.0)
        
        # Calculate suggested price
        suggested_rate = base_rate * multiplier
        total_price = suggested_rate * estimated_hours
        
        # Price range (±20%)
        price_min = total_price * 0.8
        price_max = total_price * 1.2
        
        return {
            "suggested_total": round(total_price, 2),
            "suggested_hourly": round(suggested_rate, 2),
            "price_range": {
                "min": round(price_min, 2),
                "max": round(price_max, 2)
            },
            "base_rate": base_rate,
            "urgency_multiplier": multiplier,
            "estimated_hours": estimated_hours
        }
