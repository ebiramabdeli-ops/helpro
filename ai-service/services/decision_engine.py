"""
Decision Engine - Rule-based business logic (NO LLM)
This is the "brain" that decides what should happen
"""
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
import structlog

logger = structlog.get_logger()


class DecisionEngine:
    """
    Decision Engine - Pure business logic
    - Apply rules based on intent + context
    - Check constraints (verification, trust, availability)
    - Suggest actions
    - Auto-execute safe actions
    """
    
    def __init__(self):
        # Load service rules from backend config
        self.service_rules = self._load_service_rules()
        
        # Decision tables
        self.decision_tables = {
            "service_request": self._handle_service_request,
            "price_inquiry": self._handle_price_inquiry,
            "complaint": self._handle_complaint,
            "emergency": self._handle_emergency,
            "booking_cancel": self._handle_booking_cancel,
            "booking_modify": self._handle_booking_modify,
            "payment_issue": self._handle_payment_issue,
        }
    
    def _load_service_rules(self) -> Dict[str, Any]:
        """Load service rules from config"""
        try:
            config_path = Path(__file__).parent.parent.parent / "backend" / "src" / "modules" / "chat" / "config" / "service-rules.json"
            
            if config_path.exists():
                with open(config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            
            logger.warning("service_rules_not_found", message="Using default rules")
            return self._get_default_rules()
        
        except Exception as e:
            logger.error("load_service_rules_error", error=str(e))
            return self._get_default_rules()
    
    def _get_default_rules(self) -> Dict[str, Any]:
        """Default service rules if config not found"""
        return {
            "serviceCategories": {
                "cleaning": {
                    "minVerificationLevel": 1,
                    "minTrustScore": 3.5,
                    "estimatedDuration": "2-4 hours",
                    "priceRange": "€30-80"
                },
                "moving": {
                    "minVerificationLevel": 2,
                    "minTrustScore": 4.0,
                    "estimatedDuration": "3-6 hours",
                    "priceRange": "€50-150"
                },
                "recycling": {
                    "minVerificationLevel": 1,
                    "minTrustScore": 3.0,
                    "estimatedDuration": "1-2 hours",
                    "priceRange": "€20-60"
                },
                "handyman": {
                    "minVerificationLevel": 2,
                    "minTrustScore": 4.0,
                    "estimatedDuration": "2-4 hours",
                    "priceRange": "€40-100"
                }
            }
        }
    
    def decide(
        self,
        intent: str,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Main decision function
        
        Args:
            intent: Detected intent (e.g., "service_request")
            entities: Extracted entities (dates, items, locations)
            user_data: User info (trust_score, verification_level, subscription_tier)
            context: Additional context (conversation history, etc.)
        
        Returns:
            {
                "action": "create_booking" | "request_info" | "escalate" | "reject",
                "suggested_response": "Your booking for cleaning is confirmed...",
                "next_steps": ["match_helper", "send_confirmation"],
                "auto_actions": ["create_draft_booking"],
                "warnings": ["Verification required", "Low trust score"]
            }
        """
        context = context or {}
        
        # Get handler for intent
        handler = self.decision_tables.get(intent, self._handle_generic)
        
        # Execute decision logic
        decision = handler(entities, user_data, context)
        
        # Add safety checks
        decision = self._apply_safety_checks(decision, user_data)
        
        return decision
    
    def _handle_service_request(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Handle service booking request
        Decision tree:
        1. Check if user can book (verification, trust, payment method)
        2. Check service availability
        3. Suggest helper or request more info
        """
        service_category = entities.get("service_hints", [None])[0]
        trust_score = user_data.get("trust_score", 0)
        verification_level = user_data.get("verification_level", 0)
        subscription_tier = user_data.get("subscription_tier", "BASIC")
        
        warnings = []
        next_steps = []
        auto_actions = []
        
        # Check verification
        if service_category and service_category in self.service_rules.get("serviceCategories", {}):
            rules = self.service_rules["serviceCategories"][service_category]
            min_verification = rules.get("minVerificationLevel", 1)
            min_trust = rules.get("minTrustScore", 3.0)
            
            if verification_level < min_verification:
                warnings.append(f"Verification L{min_verification} required for {service_category}")
                return {
                    "action": "request_verification",
                    "suggested_response": f"To book {service_category} services, please complete identity verification (Level {min_verification}).",
                    "next_steps": ["redirect_to_verification"],
                    "auto_actions": [],
                    "warnings": warnings
                }
            
            if trust_score < min_trust:
                warnings.append(f"Trust score too low ({trust_score:.1f} < {min_trust})")
        
        # Check if enough info to create booking
        has_service = service_category is not None
        has_time = entities.get("time_preference") is not None or len(entities.get("dates", [])) > 0
        has_location = len(entities.get("locations", [])) > 0
        
        if has_service and has_time:
            # Can create draft booking
            auto_actions.append("create_draft_booking")
            next_steps.append("match_helpers")
            
            if subscription_tier in ["PRO", "PREMIUM"]:
                next_steps.append("apply_smart_matching")
            
            action = "create_booking"
            response = f"Great! I'm preparing your {service_category} booking. "
            
            if not has_location:
                response += "Could you provide your location?"
                next_steps.append("request_location")
            else:
                response += f"We'll find the best helpers in {entities['locations'][0]}."
        
        else:
            # Need more information
            action = "request_info"
            missing = []
            if not has_service:
                missing.append("service type")
            if not has_time:
                missing.append("preferred time")
            if not has_location:
                missing.append("location")
            
            response = f"I can help you with that! To get started, I need: {', '.join(missing)}."
            next_steps.append("request_missing_info")
        
        return {
            "action": action,
            "suggested_response": response,
            "next_steps": next_steps,
            "auto_actions": auto_actions,
            "warnings": warnings
        }
    
    def _handle_price_inquiry(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle pricing questions"""
        service_category = entities.get("service_hints", [None])[0]
        
        if service_category and service_category in self.service_rules.get("serviceCategories", {}):
            rules = self.service_rules["serviceCategories"][service_category]
            price_range = rules.get("priceRange", "€20-100")
            duration = rules.get("estimatedDuration", "2-4 hours")
            
            response = f"{service_category.capitalize()} typically costs {price_range} for {duration}. "
            response += "Final price depends on your specific needs. Would you like to book?"
        else:
            response = "Prices vary by service type. Could you tell me what kind of help you need?"
        
        return {
            "action": "provide_info",
            "suggested_response": response,
            "next_steps": ["suggest_booking"],
            "auto_actions": [],
            "warnings": []
        }
    
    def _handle_complaint(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle complaints - escalate to human support"""
        trust_score = user_data.get("trust_score", 0)
        complaint_count = user_data.get("complaint_count", 0)
        
        # High-value users get priority
        priority = "high" if trust_score >= 4.5 or complaint_count == 0 else "medium"
        
        return {
            "action": "escalate",
            "suggested_response": "I'm sorry to hear you're experiencing issues. Let me connect you with our support team right away.",
            "next_steps": ["create_support_ticket", "notify_support_team"],
            "auto_actions": ["create_support_ticket"],
            "warnings": [f"Complaint from user {user_data.get('user_id')} - Priority: {priority}"]
        }
    
    def _handle_emergency(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle emergency situations"""
        return {
            "action": "escalate",
            "suggested_response": "This seems urgent. I'm prioritizing your request and notifying our team immediately.",
            "next_steps": ["create_priority_booking", "notify_support_team", "find_available_helpers"],
            "auto_actions": ["mark_as_urgent", "notify_team"],
            "warnings": ["EMERGENCY REQUEST - Immediate action required"]
        }
    
    def _handle_booking_cancel(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle cancellation requests"""
        booking_id = context.get("active_booking_id")
        
        if not booking_id:
            return {
                "action": "request_info",
                "suggested_response": "Which booking would you like to cancel?",
                "next_steps": ["show_active_bookings"],
                "auto_actions": [],
                "warnings": []
            }
        
        # Check cancellation policy
        can_cancel_free = self._can_cancel_free(context)
        
        if can_cancel_free:
            response = "Your booking has been cancelled. No cancellation fee applies."
            auto_actions = ["cancel_booking", "refund_payment"]
        else:
            response = "Cancelling within 24 hours incurs a 50% fee. Continue?"
            auto_actions = []
        
        return {
            "action": "cancel_booking" if can_cancel_free else "confirm_cancellation",
            "suggested_response": response,
            "next_steps": ["update_helper", "process_refund"],
            "auto_actions": auto_actions,
            "warnings": [] if can_cancel_free else ["Late cancellation - fee applies"]
        }
    
    def _handle_booking_modify(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle booking modification requests"""
        return {
            "action": "modify_booking",
            "suggested_response": "I can help you change your booking. What would you like to modify?",
            "next_steps": ["show_booking_details", "request_changes"],
            "auto_actions": [],
            "warnings": []
        }
    
    def _handle_payment_issue(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle payment problems"""
        return {
            "action": "escalate",
            "suggested_response": "I see there's a payment issue. Let me connect you with our payment support team.",
            "next_steps": ["create_payment_ticket", "notify_finance_team"],
            "auto_actions": ["create_payment_ticket"],
            "warnings": ["Payment issue reported"]
        }
    
    def _handle_generic(
        self,
        entities: Dict[str, Any],
        user_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generic fallback handler"""
        return {
            "action": "provide_info",
            "suggested_response": "I'm here to help! Could you tell me more about what you need?",
            "next_steps": ["clarify_intent"],
            "auto_actions": [],
            "warnings": ["Intent unclear - needs clarification"]
        }
    
    def _apply_safety_checks(
        self,
        decision: Dict[str, Any],
        user_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply safety rules to decision"""
        # Check if user is banned
        if user_data.get("status") == "BANNED":
            return {
                "action": "reject",
                "suggested_response": "Your account is currently suspended. Please contact support.",
                "next_steps": [],
                "auto_actions": [],
                "warnings": ["Banned user attempted action"]
            }
        
        # Check subscription limits
        subscription_tier = user_data.get("subscription_tier", "BASIC")
        if subscription_tier == "BASIC":
            # BASIC users can't auto-book (need manual approval)
            if "create_booking" in decision.get("auto_actions", []):
                decision["auto_actions"].remove("create_booking")
                decision["next_steps"].append("request_manual_approval")
        
        return decision
    
    def _can_cancel_free(self, context: Dict[str, Any]) -> bool:
        """Check if user can cancel without fee"""
        booking_start_time = context.get("booking_start_time")
        
        if not booking_start_time:
            return True
        
        # Calculate hours until booking
        # (Simplified - in production, use datetime)
        hours_until = 48  # Mock value
        
        return hours_until > 24  # Free cancellation if > 24h before
