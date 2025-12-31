"""
Matching & Optimization Module
Python-based helper-task matching algorithm
Uses scipy for optimization, numpy for scoring
NO ML models - pure algorithmic matching
"""

import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import Dict, List, Tuple, Optional

class MatchingOptimizer:
    """
    Multi-criteria optimization for helper-task matching
    Uses Hungarian algorithm for optimal assignment
    """
    
    # Matching weights (must match backend config)
    WEIGHTS = {
        'trust': 0.40,
        'distance': 0.30,
        'availability': 0.20,
        'price': 0.10
    }
    
    # Constraints
    MAX_DISTANCE_KM = 50
    MIN_TRUST_SCORE = 20
    
    def __init__(self):
        self.R = 6371  # Earth radius in km (for haversine)
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate great-circle distance using Haversine formula
        
        Args:
            lat1, lon1: Origin coordinates
            lat2, lon2: Destination coordinates
        
        Returns:
            Distance in kilometers
        """
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return self.R * c
    
    def score_match(self, helper: Dict, task: Dict) -> Dict[str, float]:
        """
        Calculate match score for a single helper-task pair
        
        Args:
            helper: {
                'id': str,
                'trust_score': float (0-100),
                'latitude': float,
                'longitude': float,
                'is_available': bool,
                'hourly_rate': float
            }
            task: {
                'id': str,
                'latitude': float,
                'longitude': float,
                'max_budget': float
            }
        
        Returns:
            {
                'total': float (0-100),
                'trust': float (0-100),
                'distance': float (0-100),
                'availability': float (0-100),
                'price': float (0-100),
                'distance_km': float
            }
        """
        # 1. Trust score (0-100)
        trust_score = helper.get('trust_score', 0)
        
        # 2. Distance score (0-100, inverse relationship)
        distance_km = self.calculate_distance(
            task['latitude'], task['longitude'],
            helper['latitude'], helper['longitude']
        )
        
        # Linear decay: 0km = 100, MAX_DISTANCE_KM = 0
        distance_score = max(0, 100 * (1 - distance_km / self.MAX_DISTANCE_KM))
        
        # 3. Availability score (0-100)
        availability_score = 100.0 if helper.get('is_available', False) else 0.0
        
        # 4. Price score (0-100, how well helper's rate fits budget)
        helper_rate = helper.get('hourly_rate', 0)
        max_budget = task.get('max_budget', float('inf'))
        
        if helper_rate == 0:
            price_score = 50.0  # Neutral if no rate set
        elif helper_rate <= max_budget:
            # Perfect fit or below budget
            price_score = 100.0
        else:
            # Over budget - penalty
            overage = (helper_rate - max_budget) / max_budget
            price_score = max(0, 100 * (1 - overage))
        
        # Weighted total
        total_score = (
            trust_score * self.WEIGHTS['trust'] +
            distance_score * self.WEIGHTS['distance'] +
            availability_score * self.WEIGHTS['availability'] +
            price_score * self.WEIGHTS['price']
        )
        
        return {
            'total': round(total_score, 2),
            'trust': round(trust_score, 2),
            'distance': round(distance_score, 2),
            'availability': round(availability_score, 2),
            'price': round(price_score, 2),
            'distance_km': round(distance_km, 2)
        }
    
    def find_best_matches(
        self, 
        helpers: List[Dict], 
        task: Dict, 
        top_n: int = 3
    ) -> List[Dict]:
        """
        Find top N best matching helpers for a task
        
        Args:
            helpers: List of available helpers
            task: Task to match
            top_n: Number of top matches to return
        
        Returns:
            List of matched helpers with scores, sorted by total score (descending)
        """
        matches = []
        
        for helper in helpers:
            # Apply constraints
            if helper.get('trust_score', 0) < self.MIN_TRUST_SCORE:
                continue  # Skip low-trust helpers
            
            # Calculate score
            score = self.score_match(helper, task)
            
            # Skip if too far
            if score['distance_km'] > self.MAX_DISTANCE_KM:
                continue
            
            matches.append({
                'helper_id': helper['id'],
                'helper': helper,
                'scores': score
            })
        
        # Sort by total score (descending)
        matches.sort(key=lambda m: m['scores']['total'], reverse=True)
        
        # Return top N
        return matches[:top_n]
    
    def optimal_assignment(
        self, 
        helpers: List[Dict], 
        tasks: List[Dict]
    ) -> List[Tuple[str, str, float]]:
        """
        Optimal many-to-many assignment using Hungarian algorithm
        
        Args:
            helpers: List of available helpers
            tasks: List of pending tasks
        
        Returns:
            List of (helper_id, task_id, score) tuples
        """
        n_helpers = len(helpers)
        n_tasks = len(tasks)
        
        if n_helpers == 0 or n_tasks == 0:
            return []
        
        # Create cost matrix (we want to MAXIMIZE score, so negate it)
        cost_matrix = np.zeros((n_helpers, n_tasks))
        
        for i, helper in enumerate(helpers):
            for j, task in enumerate(tasks):
                score = self.score_match(helper, task)
                # Negate because Hungarian solves minimum cost assignment
                cost_matrix[i, j] = -score['total']
        
        # Solve assignment problem
        helper_indices, task_indices = linear_sum_assignment(cost_matrix)
        
        # Build result
        assignments = []
        for h_idx, t_idx in zip(helper_indices, task_indices):
            helper = helpers[h_idx]
            task = tasks[t_idx]
            score = -cost_matrix[h_idx, t_idx]  # Convert back to positive
            
            # Only include if score is reasonable (>50)
            if score >= 50:
                assignments.append((helper['id'], task['id'], score))
        
        return assignments
    
    def calculate_coverage(
        self, 
        helpers: List[Dict], 
        service_areas: List[Dict]
    ) -> Dict[str, float]:
        """
        Calculate geographic coverage for a set of helpers
        
        Args:
            helpers: List of helpers with coordinates
            service_areas: List of areas to cover (city centers, etc.)
        
        Returns:
            Coverage metrics
        """
        covered_areas = 0
        total_areas = len(service_areas)
        
        for area in service_areas:
            # Check if any helper is within service distance
            for helper in helpers:
                distance = self.calculate_distance(
                    area['latitude'], area['longitude'],
                    helper['latitude'], helper['longitude']
                )
                
                if distance <= self.MAX_DISTANCE_KM:
                    covered_areas += 1
                    break  # Area is covered
        
        coverage_rate = covered_areas / total_areas if total_areas > 0 else 0
        
        return {
            'coverage_rate': round(coverage_rate, 2),
            'covered_areas': covered_areas,
            'total_areas': total_areas
        }


class SkillMatcher:
    """
    Match helpers based on skills (simple keyword matching)
    Can be enhanced with embeddings later (optional)
    """
    
    SKILL_KEYWORDS = {
        'cleaning': ['cleaning', 'housekeeping', 'sanitizing', 'organization'],
        'moving': ['moving', 'lifting', 'packing', 'furniture'],
        'repair': ['repair', 'fixing', 'maintenance', 'handyman'],
        'gardening': ['gardening', 'landscaping', 'plants', 'lawn'],
        'painting': ['painting', 'decorating', 'wall', 'interior']
    }
    
    def match_skills(self, helper_skills: List[str], required_service: str) -> float:
        """
        Calculate skill match score (0-100)
        
        Args:
            helper_skills: List of helper's skills/keywords
            required_service: Required service type
        
        Returns:
            Match score (0-100)
        """
        if required_service not in self.SKILL_KEYWORDS:
            return 50.0  # Neutral
        
        required_keywords = set(self.SKILL_KEYWORDS[required_service])
        helper_keywords = set(keyword.lower() for keyword in helper_skills)
        
        # Calculate overlap
        overlap = required_keywords & helper_keywords
        
        if not required_keywords:
            return 50.0
        
        match_rate = len(overlap) / len(required_keywords)
        return match_rate * 100


# Singleton instances
_optimizer = None
_skill_matcher = None

def get_optimizer() -> MatchingOptimizer:
    """Get or create optimizer instance"""
    global _optimizer
    if _optimizer is None:
        _optimizer = MatchingOptimizer()
    return _optimizer

def get_skill_matcher() -> SkillMatcher:
    """Get or create skill matcher instance"""
    global _skill_matcher
    if _skill_matcher is None:
        _skill_matcher = SkillMatcher()
    return _skill_matcher
