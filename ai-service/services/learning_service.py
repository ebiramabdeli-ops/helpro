"""
Learning Service - Statistics-based learning (NO LLM)
Tracks feedback and improves decisions over time
"""
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime, timedelta
import structlog

logger = structlog.get_logger()


class LearningService:
    """
    Learning System - Learn from outcomes without LLM
    
    What we learn:
    1. Which suggestions get accepted/rejected
    2. Which helpers perform well
    3. Which rules work best
    4. Where to adjust weights
    """
    
    def __init__(self):
        self.feedback_store = []
        self.statistics = {
            "suggestions": {},    # Acceptance rates per suggestion type
            "helpers": {},        # Performance metrics per helper
            "rules": {},          # Rule effectiveness
            "weights": {},        # Current weight adjustments
        }
        
        # Load historical data
        self._load_statistics()
    
    def _load_statistics(self):
        """Load statistics from disk"""
        try:
            stats_path = Path(__file__).parent.parent / "data" / "learning_stats.json"
            
            if stats_path.exists():
                with open(stats_path, "r") as f:
                    self.statistics = json.load(f)
                logger.info("✅ Learning statistics loaded")
        
        except Exception as e:
            logger.warning("statistics_load_failed", error=str(e))
    
    def _save_statistics(self):
        """Save statistics to disk"""
        try:
            stats_path = Path(__file__).parent.parent / "data" / "learning_stats.json"
            stats_path.parent.mkdir(exist_ok=True)
            
            with open(stats_path, "w") as f:
                json.dump(self.statistics, f, indent=2)
        
        except Exception as e:
            logger.error("statistics_save_failed", error=str(e))
    
    def record_feedback(
        self,
        action_id: str,
        action_type: str,
        outcome: str,
        data: Dict[str, Any]
    ):
        """
        Record feedback for an action
        
        Args:
            action_id: Unique action identifier
            action_type: "suggestion" | "match" | "price_estimate" | "decision"
            outcome: "accepted" | "rejected" | "completed" | "complained" | "cancelled"
            data: Additional context
        """
        feedback = {
            "action_id": action_id,
            "action_type": action_type,
            "outcome": outcome,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        self.feedback_store.append(feedback)
        
        # Update statistics
        self._update_statistics(action_type, outcome, data)
        
        # Persist every 10 feedbacks
        if len(self.feedback_store) % 10 == 0:
            self._save_statistics()
        
        logger.info("feedback_recorded", action_type=action_type, outcome=outcome)
    
    def _update_statistics(
        self,
        action_type: str,
        outcome: str,
        data: Dict[str, Any]
    ):
        """Update statistics based on feedback"""
        
        # 1. Update suggestion statistics
        if action_type == "suggestion":
            suggestion_type = data.get("suggestion_type", "unknown")
            
            if suggestion_type not in self.statistics["suggestions"]:
                self.statistics["suggestions"][suggestion_type] = {
                    "total": 0,
                    "accepted": 0,
                    "rejected": 0,
                    "acceptance_rate": 0.0
                }
            
            stats = self.statistics["suggestions"][suggestion_type]
            stats["total"] += 1
            
            if outcome == "accepted":
                stats["accepted"] += 1
            elif outcome == "rejected":
                stats["rejected"] += 1
            
            # Calculate acceptance rate
            if stats["total"] > 0:
                stats["acceptance_rate"] = stats["accepted"] / stats["total"]
        
        # 2. Update helper performance
        elif action_type == "match":
            helper_id = data.get("helper_id")
            
            if helper_id:
                if helper_id not in self.statistics["helpers"]:
                    self.statistics["helpers"][helper_id] = {
                        "matches": 0,
                        "completed": 0,
                        "cancelled": 0,
                        "complaints": 0,
                        "success_rate": 0.0
                    }
                
                stats = self.statistics["helpers"][helper_id]
                stats["matches"] += 1
                
                if outcome == "completed":
                    stats["completed"] += 1
                elif outcome == "cancelled":
                    stats["cancelled"] += 1
                elif outcome == "complained":
                    stats["complaints"] += 1
                
                # Calculate success rate
                if stats["matches"] > 0:
                    stats["success_rate"] = stats["completed"] / stats["matches"]
        
        # 3. Update rule effectiveness
        elif action_type == "decision":
            rule_applied = data.get("rule_applied")
            
            if rule_applied:
                if rule_applied not in self.statistics["rules"]:
                    self.statistics["rules"][rule_applied] = {
                        "applied": 0,
                        "successful": 0,
                        "failed": 0,
                        "success_rate": 0.0
                    }
                
                stats = self.statistics["rules"][rule_applied]
                stats["applied"] += 1
                
                if outcome in ["completed", "accepted"]:
                    stats["successful"] += 1
                elif outcome in ["complained", "cancelled", "rejected"]:
                    stats["failed"] += 1
                
                # Calculate success rate
                if stats["applied"] > 0:
                    stats["success_rate"] = stats["successful"] / stats["applied"]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current learning statistics"""
        return {
            "total_feedback": len(self.feedback_store),
            "statistics": self.statistics,
            "insights": self._generate_insights()
        }
    
    def _generate_insights(self) -> List[str]:
        """Generate actionable insights from statistics"""
        insights = []
        
        # 1. Analyze suggestion acceptance rates
        for suggestion_type, stats in self.statistics["suggestions"].items():
            if stats["total"] >= 10:  # Only if enough samples
                acceptance_rate = stats["acceptance_rate"]
                
                if acceptance_rate < 0.3:
                    insights.append(f"⚠️ Low acceptance for '{suggestion_type}' ({acceptance_rate:.0%}) - consider adjusting")
                elif acceptance_rate > 0.8:
                    insights.append(f"✅ High acceptance for '{suggestion_type}' ({acceptance_rate:.0%}) - working well")
        
        # 2. Analyze helper performance
        top_helpers = sorted(
            [(h_id, stats) for h_id, stats in self.statistics["helpers"].items() if stats["matches"] >= 5],
            key=lambda x: x[1]["success_rate"],
            reverse=True
        )[:5]
        
        if top_helpers:
            insights.append(f"🌟 Top helper success rate: {top_helpers[0][1]['success_rate']:.0%}")
        
        # 3. Analyze rule effectiveness
        ineffective_rules = [
            (rule, stats)
            for rule, stats in self.statistics["rules"].items()
            if stats["applied"] >= 10 and stats["success_rate"] < 0.5
        ]
        
        if ineffective_rules:
            for rule, stats in ineffective_rules[:3]:
                insights.append(f"⚠️ Rule '{rule}' has low success rate ({stats['success_rate']:.0%})")
        
        return insights
    
    def suggest_weight_adjustments(self) -> Dict[str, float]:
        """
        Suggest weight adjustments based on learning
        Used to improve matching algorithm
        """
        adjustments = {}
        
        # Example: If distance-based matches have high success, increase distance weight
        # This is simplified - in production, use more sophisticated analysis
        
        for helper_id, stats in self.statistics["helpers"].items():
            if stats["matches"] >= 10:
                success_rate = stats["success_rate"]
                
                # If helper has high success, analyze why
                # (In production, track which factors led to good matches)
                if success_rate > 0.9:
                    # This helper's characteristics should be weighted higher
                    pass
        
        return adjustments
    
    def get_recommendation_confidence(
        self,
        recommendation_type: str
    ) -> float:
        """
        Get confidence level for a recommendation type
        Based on historical success rate
        
        Returns 0.0-1.0
        """
        if recommendation_type in self.statistics["suggestions"]:
            stats = self.statistics["suggestions"][recommendation_type]
            
            if stats["total"] < 5:
                return 0.5  # Low confidence if few samples
            
            return stats["acceptance_rate"]
        
        return 0.5  # Neutral if no data
    
    def detect_patterns(self) -> List[Dict[str, Any]]:
        """
        Detect patterns in feedback data
        Example: "Users always reject suggestions on Friday evenings"
        """
        patterns = []
        
        # Analyze feedback by time of day
        if len(self.feedback_store) >= 50:
            by_hour = {}
            
            for feedback in self.feedback_store:
                try:
                    timestamp = datetime.fromisoformat(feedback["timestamp"])
                    hour = timestamp.hour
                    outcome = feedback["outcome"]
                    
                    if hour not in by_hour:
                        by_hour[hour] = {"accepted": 0, "rejected": 0}
                    
                    if outcome == "accepted":
                        by_hour[hour]["accepted"] += 1
                    elif outcome == "rejected":
                        by_hour[hour]["rejected"] += 1
                
                except Exception:
                    continue
            
            # Find hours with low acceptance
            for hour, counts in by_hour.items():
                total = counts["accepted"] + counts["rejected"]
                if total >= 5:
                    acceptance = counts["accepted"] / total
                    
                    if acceptance < 0.3:
                        patterns.append({
                            "pattern": "low_acceptance_hour",
                            "hour": hour,
                            "acceptance_rate": acceptance,
                            "suggestion": f"Users often reject suggestions at {hour}:00"
                        })
        
        return patterns
    
    def export_training_data(
        self,
        intent: str,
        language: str = "en"
    ) -> List[Dict[str, str]]:
        """
        Export feedback data as training data for intent classifier
        
        Returns:
            [
                {"text": "I need cleaning help", "intent": "service_request"},
                ...
            ]
        """
        training_data = []
        
        for feedback in self.feedback_store:
            if feedback["action_type"] == "intent_detection":
                user_text = feedback["data"].get("user_text", "")
                detected_intent = feedback["data"].get("intent", "")
                user_lang = feedback["data"].get("language", "en")
                
                # Only successful detections (accepted)
                if feedback["outcome"] == "accepted" and user_lang.startswith(language):
                    training_data.append({
                        "text": user_text,
                        "intent": detected_intent
                    })
        
        return training_data
    
    def get_weekly_report(self) -> Dict[str, Any]:
        """Generate weekly learning report"""
        # Get feedback from last 7 days
        week_ago = datetime.now() - timedelta(days=7)
        recent_feedback = [
            f for f in self.feedback_store
            if datetime.fromisoformat(f["timestamp"]) > week_ago
        ]
        
        # Calculate metrics
        total = len(recent_feedback)
        accepted = sum(1 for f in recent_feedback if f["outcome"] == "accepted")
        rejected = sum(1 for f in recent_feedback if f["outcome"] == "rejected")
        completed = sum(1 for f in recent_feedback if f["outcome"] == "completed")
        
        acceptance_rate = accepted / total if total > 0 else 0
        completion_rate = completed / total if total > 0 else 0
        
        return {
            "period": "last_7_days",
            "total_actions": total,
            "accepted": accepted,
            "rejected": rejected,
            "completed": completed,
            "acceptance_rate": round(acceptance_rate, 3),
            "completion_rate": round(completion_rate, 3),
            "insights": self._generate_insights(),
            "patterns": self.detect_patterns()
        }
