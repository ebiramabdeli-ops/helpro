"""
Trust & Risk Scoring Module
Python-based scoring algorithms for user trust and transaction risk
NO ML models - pure algorithmic scoring
"""

import numpy as np
from typing import Dict, List, Optional
from datetime import datetime, timedelta

class TrustScorer:
    """
    Calculate user trust score (0-100)
    Based on behavior, history, and reputation
    """
    
    # Weights (must match backend config)
    WEIGHTS = {
        'identity_verified': 0.25,
        'completed_jobs': 0.30,
        'avg_rating': 0.25,
        'on_time_rate': 0.10,
        'dispute_penalty': 0.10
    }
    
    def calculate_trust_score(self, user_data: Dict) -> Dict[str, float]:
        """
        Calculate comprehensive trust score
        
        Args:
            user_data: {
                'identity_verified': bool,
                'completed_tasks': int,
                'avg_rating': float (1-5),
                'on_time_completions': int,
                'total_completions': int,
                'disputes': int
            }
        
        Returns:
            {
                'total': float (0-100),
                'identity': float (0-100),
                'experience': float (0-100),
                'reputation': float (0-100),
                'reliability': float (0-100),
                'penalty': float (0-100)
            }
        """
        # Component 1: Identity verification (0-100)
        identity_score = 100.0 if user_data.get('identity_verified', False) else 0.0
        
        # Component 2: Experience (completed jobs)
        completed = user_data.get('completed_tasks', 0)
        experience_score = min(completed * 5, 100)  # 20 jobs = 100 points
        
        # Component 3: Reputation (avg rating)
        avg_rating = user_data.get('avg_rating', 0.0)
        reputation_score = (avg_rating / 5.0) * 100 if avg_rating > 0 else 0.0
        
        # Component 4: Reliability (on-time completion rate)
        on_time = user_data.get('on_time_completions', 0)
        total_completions = user_data.get('total_completions', 0)
        
        if total_completions > 0:
            on_time_rate = on_time / total_completions
            reliability_score = on_time_rate * 100
        else:
            reliability_score = 50.0  # Neutral for new users
        
        # Component 5: Dispute penalty
        disputes = user_data.get('disputes', 0)
        total_tasks = max(completed, 1)
        dispute_rate = disputes / total_tasks
        penalty = min(dispute_rate * 100, 50)  # Cap at 50 points penalty
        
        # Weighted sum
        total_score = (
            identity_score * self.WEIGHTS['identity_verified'] +
            experience_score * self.WEIGHTS['completed_jobs'] +
            reputation_score * self.WEIGHTS['avg_rating'] +
            reliability_score * self.WEIGHTS['on_time_rate'] -
            penalty * self.WEIGHTS['dispute_penalty']
        )
        
        # Clamp to [0, 100]
        total_score = max(0, min(100, total_score))
        
        return {
            'total': round(total_score, 2),
            'identity': round(identity_score, 2),
            'experience': round(experience_score, 2),
            'reputation': round(reputation_score, 2),
            'reliability': round(reliability_score, 2),
            'penalty': round(penalty, 2)
        }
    
    def get_trust_level(self, score: float) -> str:
        """Convert numeric score to categorical level"""
        if score >= 80:
            return 'EXCELLENT'
        elif score >= 60:
            return 'GOOD'
        elif score >= 40:
            return 'FAIR'
        elif score >= 20:
            return 'LOW'
        else:
            return 'UNVERIFIED'


class RiskScorer:
    """
    Assess transaction risk
    Identifies fraud patterns and high-risk scenarios
    """
    
    # Risk thresholds
    THRESHOLDS = {
        'new_user_high_value': 1000,  # €
        'max_cancellations_7d': 3,
        'high_dispute_ratio': 0.2,
        'low_trust_threshold': 30,
        'high_risk_score': 70,
        'medium_risk_score': 40
    }
    
    def assess_risk(self, user_data: Dict, task_value: float) -> Dict:
        """
        Assess transaction risk
        
        Args:
            user_data: User history and stats
            task_value: Task value in €
        
        Returns:
            {
                'risk_score': int (0-100),
                'risk_level': str ('LOW', 'MEDIUM', 'HIGH'),
                'flags': List[str],
                'recommendations': List[str]
            }
        """
        risk_score = 0
        flags = []
        recommendations = []
        
        # Rule 1: New user + high value task
        if user_data.get('completed_tasks', 0) == 0 and task_value > self.THRESHOLDS['new_user_high_value']:
            risk_score += 30
            flags.append('NEW_USER_HIGH_VALUE')
            recommendations.append('Consider identity verification')
        
        # Rule 2: Recent cancellations
        recent_cancellations = user_data.get('cancellations_last_7d', 0)
        if recent_cancellations > self.THRESHOLDS['max_cancellations_7d']:
            risk_score += 20
            flags.append('FREQUENT_CANCELLATIONS')
            recommendations.append('Review cancellation history')
        
        # Rule 3: High dispute ratio
        disputes = user_data.get('disputes', 0)
        completed = max(user_data.get('completed_tasks', 0), 1)
        dispute_ratio = disputes / completed
        
        if dispute_ratio > self.THRESHOLDS['high_dispute_ratio']:
            risk_score += 50
            flags.append('HIGH_DISPUTE_RATIO')
            recommendations.append('Manual review required')
        
        # Rule 4: Low trust score
        trust_score = user_data.get('trust_score', 0)
        if trust_score < self.THRESHOLDS['low_trust_threshold']:
            risk_score += 15
            flags.append('LOW_TRUST_SCORE')
            recommendations.append('Require upfront payment or escrow')
        
        # Rule 5: Task value vs user history
        avg_task_value = user_data.get('avg_task_value', 0)
        if avg_task_value > 0 and task_value > avg_task_value * 3:
            risk_score += 10
            flags.append('UNUSUALLY_HIGH_VALUE')
            recommendations.append('Verify task details')
        
        # Determine risk level
        if risk_score >= self.THRESHOLDS['high_risk_score']:
            risk_level = 'HIGH'
        elif risk_score >= self.THRESHOLDS['medium_risk_score']:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        return {
            'risk_score': min(risk_score, 100),
            'risk_level': risk_level,
            'flags': flags,
            'recommendations': recommendations
        }
    
    def detect_fraud_patterns(self, user_data: Dict, recent_activity: List[Dict]) -> bool:
        """
        Detect fraud patterns in user behavior
        
        Args:
            user_data: User profile
            recent_activity: List of recent tasks/actions
        
        Returns:
            True if fraud suspected, False otherwise
        """
        fraud_indicators = 0
        
        # Pattern 1: Excessive task creation (>10 in 24h)
        recent_24h = [
            task for task in recent_activity 
            if self._is_within_hours(task.get('created_at'), 24)
        ]
        if len(recent_24h) > 10:
            fraud_indicators += 1
        
        # Pattern 2: Immediate cancellations (multiple tasks cancelled <5 min after creation)
        immediate_cancels = [
            task for task in recent_activity
            if task.get('status') == 'cancelled' and 
            self._minutes_between(task.get('created_at'), task.get('cancelled_at')) < 5
        ]
        if len(immediate_cancels) >= 3:
            fraud_indicators += 1
        
        # Pattern 3: Same description copy-paste (content similarity)
        descriptions = [task.get('description', '') for task in recent_activity]
        if len(descriptions) > 3 and len(set(descriptions)) == 1:
            fraud_indicators += 1
        
        # Pattern 4: Rapid account switching (multiple accounts from same IP - requires backend data)
        # This would require session/IP data from backend
        
        # Fraud threshold
        return fraud_indicators >= 2
    
    def _is_within_hours(self, timestamp: str, hours: int) -> bool:
        """Check if timestamp is within X hours from now"""
        if not timestamp:
            return False
        try:
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return (datetime.now() - dt) < timedelta(hours=hours)
        except:
            return False
    
    def _minutes_between(self, start: str, end: str) -> float:
        """Calculate minutes between two timestamps"""
        if not start or not end:
            return float('inf')
        try:
            start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
            return (end_dt - start_dt).total_seconds() / 60
        except:
            return float('inf')


# Singleton instances
_trust_scorer = None
_risk_scorer = None

def get_trust_scorer() -> TrustScorer:
    """Get or create trust scorer instance"""
    global _trust_scorer
    if _trust_scorer is None:
        _trust_scorer = TrustScorer()
    return _trust_scorer

def get_risk_scorer() -> RiskScorer:
    """Get or create risk scorer instance"""
    global _risk_scorer
    if _risk_scorer is None:
        _risk_scorer = RiskScorer()
    return _risk_scorer
