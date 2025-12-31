"""
Scoring Service - Calculate trust, quality, and priority scores
This makes decisions feel "AI-smart" without LLM
"""
from typing import Dict, Any, List
import structlog

logger = structlog.get_logger()


class ScoringService:
    """
    Scoring System - Core intelligence without LLM
    
    Scores:
    1. Trust Score (0-5) - User reliability
    2. Quality Score (0-5) - Helper performance
    3. Priority Score (0-100) - Task urgency/importance
    """
    
    def __init__(self):
        # Weight configurations
        self.trust_weights = {
            "completed_jobs": 0.25,
            "verification_level": 0.20,
            "reviews": 0.20,
            "complaints": -0.15,
            "cancellations": -0.10,
            "time_on_platform": 0.10,
        }
        
        self.quality_weights = {
            "average_rating": 0.30,
            "completion_rate": 0.25,
            "on_time_rate": 0.20,
            "response_time": 0.15,
            "disputes": -0.10,
        }
    
    def calculate(
        self,
        user_id: str,
        score_type: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate score based on type
        
        Args:
            user_id: User ID
            score_type: "trust" | "quality" | "priority"
            data: User/task data
        
        Returns:
            {
                "score": 4.2,
                "breakdown": {"completed_jobs": 1.25, "verification": 1.0, ...},
                "level": "high" | "medium" | "low",
                "recommendations": ["Complete verification to increase score"]
            }
        """
        if score_type == "trust":
            return self._calculate_trust_score(user_id, data)
        elif score_type == "quality":
            return self._calculate_quality_score(user_id, data)
        elif score_type == "priority":
            return self._calculate_priority_score(data)
        else:
            raise ValueError(f"Unknown score_type: {score_type}")
    
    def _calculate_trust_score(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Trust Score (0-5) - Customer reliability
        
        Formula:
        Trust = (completed_jobs × 0.25) +
                (verification_level × 0.20) +
                (avg_review × 0.20) -
                (complaints × 0.15) -
                (cancellations × 0.10) +
                (time_on_platform × 0.10)
        """
        breakdown = {}
        
        # Completed jobs (0-5 scale)
        completed = data.get("completed_jobs", 0)
        breakdown["completed_jobs"] = min(completed / 10, 5) * self.trust_weights["completed_jobs"]
        
        # Verification level (0-3 → 0-5 scale)
        verification = data.get("verification_level", 0)
        breakdown["verification_level"] = (verification / 3) * 5 * self.trust_weights["verification_level"]
        
        # Average review score (0-5)
        avg_review = data.get("average_review", 3.0)
        breakdown["reviews"] = avg_review * self.trust_weights["reviews"]
        
        # Complaints (penalty)
        complaints = data.get("complaints", 0)
        breakdown["complaints"] = -(min(complaints, 5)) * abs(self.trust_weights["complaints"])
        
        # Cancellations (penalty)
        cancellation_rate = data.get("cancellation_rate", 0)  # 0.0-1.0
        breakdown["cancellations"] = -(cancellation_rate * 5) * abs(self.trust_weights["cancellations"])
        
        # Time on platform (months → bonus)
        months = data.get("months_on_platform", 0)
        breakdown["time_on_platform"] = min(months / 12, 1) * 5 * self.trust_weights["time_on_platform"]
        
        # Calculate total (clamp to 0-5)
        total_score = sum(breakdown.values())
        total_score = max(0, min(5, total_score))
        
        # Determine level
        if total_score >= 4.0:
            level = "high"
        elif total_score >= 3.0:
            level = "medium"
        else:
            level = "low"
        
        # Generate recommendations
        recommendations = self._get_trust_recommendations(data, breakdown)
        
        return {
            "score": round(total_score, 2),
            "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "level": level,
            "recommendations": recommendations
        }
    
    def _calculate_quality_score(
        self,
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Quality Score (0-5) - Helper performance
        
        Formula:
        Quality = (avg_rating × 0.30) +
                  (completion_rate × 0.25) +
                  (on_time_rate × 0.20) +
                  (response_time × 0.15) -
                  (disputes × 0.10)
        """
        breakdown = {}
        
        # Average rating (0-5)
        avg_rating = data.get("average_rating", 0)
        breakdown["average_rating"] = avg_rating * self.quality_weights["average_rating"]
        
        # Completion rate (0.0-1.0 → 0-5)
        completion_rate = data.get("completion_rate", 0)
        breakdown["completion_rate"] = (completion_rate * 5) * self.quality_weights["completion_rate"]
        
        # On-time rate (0.0-1.0 → 0-5)
        on_time_rate = data.get("on_time_rate", 0)
        breakdown["on_time_rate"] = (on_time_rate * 5) * self.quality_weights["on_time_rate"]
        
        # Response time (lower is better, inverted score)
        avg_response_hours = data.get("avg_response_hours", 24)
        response_score = max(0, (24 - avg_response_hours) / 24)  # 0-1
        breakdown["response_time"] = (response_score * 5) * self.quality_weights["response_time"]
        
        # Disputes (penalty)
        disputes = data.get("disputes", 0)
        breakdown["disputes"] = -(min(disputes, 5)) * abs(self.quality_weights["disputes"])
        
        # Calculate total (clamp to 0-5)
        total_score = sum(breakdown.values())
        total_score = max(0, min(5, total_score))
        
        # Determine level
        if total_score >= 4.5:
            level = "high"
        elif total_score >= 3.5:
            level = "medium"
        else:
            level = "low"
        
        # Generate recommendations
        recommendations = self._get_quality_recommendations(data, breakdown)
        
        return {
            "score": round(total_score, 2),
            "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "level": level,
            "recommendations": recommendations
        }
    
    def _calculate_priority_score(
        self,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Priority Score (0-100) - Task urgency/importance
        
        Formula:
        Priority = urgency (40%) +
                   value (30%) +
                   customer_tier (20%) +
                   risk (10%)
        """
        breakdown = {}
        
        # Urgency (0-40 points)
        urgency = data.get("urgency", "medium")
        urgency_points = {
            "high": 40,
            "medium": 20,
            "low": 10
        }
        breakdown["urgency"] = urgency_points.get(urgency, 20)
        
        # Value (0-30 points based on booking value)
        booking_value = data.get("booking_value", 0)
        if booking_value >= 100:
            breakdown["value"] = 30
        elif booking_value >= 50:
            breakdown["value"] = 20
        else:
            breakdown["value"] = 10
        
        # Customer tier (0-20 points)
        subscription_tier = data.get("subscription_tier", "BASIC")
        tier_points = {
            "PREMIUM": 20,
            "PRO": 15,
            "BASIC": 10
        }
        breakdown["customer_tier"] = tier_points.get(subscription_tier, 10)
        
        # Risk (0-10 points - higher risk = higher priority)
        is_first_booking = data.get("is_first_booking", False)
        has_complaints = data.get("has_complaints", False)
        
        risk_score = 0
        if is_first_booking:
            risk_score += 5  # First bookings need attention
        if has_complaints:
            risk_score += 5  # Previous complaints need care
        
        breakdown["risk"] = risk_score
        
        # Calculate total (0-100)
        total_score = sum(breakdown.values())
        
        # Determine level
        if total_score >= 70:
            level = "critical"
        elif total_score >= 50:
            level = "high"
        elif total_score >= 30:
            level = "medium"
        else:
            level = "low"
        
        recommendations = []
        if level == "critical":
            recommendations.append("Assign immediately")
            recommendations.append("Notify top-rated helpers")
        elif level == "high":
            recommendations.append("Process within 2 hours")
        
        return {
            "score": total_score,
            "breakdown": breakdown,
            "level": level,
            "recommendations": recommendations
        }
    
    def _get_trust_recommendations(
        self,
        data: Dict[str, Any],
        breakdown: Dict[str, float]
    ) -> List[str]:
        """Generate recommendations to improve trust score"""
        recommendations = []
        
        # Check verification
        verification = data.get("verification_level", 0)
        if verification < 2:
            recommendations.append(f"Complete Level {verification + 1} verification (+{0.33:.2f} points)")
        
        # Check completed jobs
        completed = data.get("completed_jobs", 0)
        if completed < 10:
            recommendations.append(f"Complete more bookings ({completed}/10 so far)")
        
        # Check complaints
        complaints = data.get("complaints", 0)
        if complaints > 0:
            recommendations.append("Resolve outstanding complaints to improve score")
        
        # Check cancellations
        cancellation_rate = data.get("cancellation_rate", 0)
        if cancellation_rate > 0.2:
            recommendations.append("Reduce cancellation rate (currently {:.0%})".format(cancellation_rate))
        
        return recommendations
    
    def _get_quality_recommendations(
        self,
        data: Dict[str, Any],
        breakdown: Dict[str, float]
    ) -> List[str]:
        """Generate recommendations to improve quality score"""
        recommendations = []
        
        # Check completion rate
        completion_rate = data.get("completion_rate", 0)
        if completion_rate < 0.95:
            recommendations.append(f"Improve completion rate (currently {completion_rate:.0%})")
        
        # Check on-time rate
        on_time_rate = data.get("on_time_rate", 0)
        if on_time_rate < 0.90:
            recommendations.append(f"Arrive on time more often (currently {on_time_rate:.0%})")
        
        # Check response time
        avg_response_hours = data.get("avg_response_hours", 24)
        if avg_response_hours > 4:
            recommendations.append(f"Respond faster to messages (currently {avg_response_hours:.1f}h average)")
        
        # Check disputes
        disputes = data.get("disputes", 0)
        if disputes > 0:
            recommendations.append("Avoid disputes by communicating clearly with customers")
        
        return recommendations
    
    def compare_candidates(
        self,
        candidates: List[Dict[str, Any]],
        task_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Score and rank multiple candidates for a task
        Used by optimization engine
        
        Returns sorted list with scores
        """
        scored_candidates = []
        
        for candidate in candidates:
            # Calculate quality score
            quality_result = self._calculate_quality_score(
                candidate.get("id", ""),
                candidate
            )
            
            # Calculate distance penalty (simple version)
            distance = candidate.get("distance_km", 0)
            distance_score = max(0, 5 - (distance / 10))  # Penalty for distance > 50km
            
            # Calculate availability bonus
            availability = candidate.get("availability", "medium")
            availability_bonus = {
                "immediate": 2.0,
                "today": 1.5,
                "tomorrow": 1.0,
                "this_week": 0.5,
                "next_week": 0.0
            }.get(availability, 0)
            
            # Total score
            total_score = quality_result["score"] + distance_score + availability_bonus
            
            scored_candidates.append({
                **candidate,
                "quality_score": quality_result["score"],
                "distance_score": round(distance_score, 2),
                "availability_bonus": availability_bonus,
                "total_score": round(total_score, 2)
            })
        
        # Sort by total score (descending)
        scored_candidates.sort(key=lambda x: x["total_score"], reverse=True)
        
        return scored_candidates
