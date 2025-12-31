"""
Rule Evaluation Engine
Python-based decision rules for chatbot flow
Clean IF-THEN logic, easy to test and extend
"""

from typing import Dict, List, Optional, Any
from enum import Enum

class DialogueState(str, Enum):
    """Must match TypeScript enum"""
    START = 'START'
    ASK_SERVICE = 'ASK_SERVICE'
    ASK_LOCATION = 'ASK_LOCATION'
    ASK_TIME = 'ASK_TIME'
    ASK_DESCRIPTION = 'ASK_DESCRIPTION'
    CONFIRM = 'CONFIRM'
    COMPLETE = 'COMPLETE'
    ERROR = 'ERROR'

class ActionType(str, Enum):
    """Must match TypeScript enum"""
    ASK_SERVICE = 'ASK_SERVICE'
    ASK_LOCATION = 'ASK_LOCATION'
    ASK_TIME = 'ASK_TIME'
    ASK_DESCRIPTION = 'ASK_DESCRIPTION'
    CONFIRM_REQUEST = 'CONFIRM_REQUEST'
    CREATE_TASK = 'CREATE_TASK'
    PROVIDE_PRICE_ESTIMATE = 'PROVIDE_PRICE_ESTIMATE'
    PROVIDE_AVAILABILITY = 'PROVIDE_AVAILABILITY'
    CANCEL_REQUEST = 'CANCEL_REQUEST'
    GREETING = 'GREETING'
    HELP = 'HELP'
    FALLBACK = 'FALLBACK'

class DecisionEngine:
    """
    Rule-based decision engine
    Evaluates IF-THEN rules to decide next action
    """
    
    def __init__(self):
        self.rules = self._define_rules()
    
    def _define_rules(self) -> List[Dict[str, Any]]:
        """
        Define decision rules
        Format: { 'condition': function, 'action': ActionType, 'next_state': DialogueState }
        """
        return [
            # Rule 1: Greeting
            {
                'name': 'greeting',
                'condition': lambda intent, state, known: intent == 'GREETING',
                'action': ActionType.GREETING,
                'next_state': DialogueState.ASK_SERVICE,
                'response_key': 'greeting',
                'priority': 10
            },
            
            # Rule 2: Help request
            {
                'name': 'help',
                'condition': lambda intent, state, known: intent == 'HELP',
                'action': ActionType.HELP,
                'next_state': DialogueState.ASK_SERVICE,
                'response_key': 'help',
                'priority': 10
            },
            
            # Rule 3: Cancellation
            {
                'name': 'cancel',
                'condition': lambda intent, state, known: intent == 'CANCEL_REQUEST',
                'action': ActionType.CANCEL_REQUEST,
                'next_state': DialogueState.START,
                'response_key': 'cancelled',
                'priority': 10
            },
            
            # Rule 4: Price inquiry (need service first)
            {
                'name': 'price_no_service',
                'condition': lambda intent, state, known: intent == 'ASK_PRICE' and not known.get('service'),
                'action': ActionType.ASK_SERVICE,
                'next_state': DialogueState.ASK_SERVICE,
                'response_key': 'ask_service_for_price',
                'priority': 8
            },
            
            # Rule 5: Price inquiry (service known)
            {
                'name': 'price_with_service',
                'condition': lambda intent, state, known: intent == 'ASK_PRICE' and known.get('service'),
                'action': ActionType.PROVIDE_PRICE_ESTIMATE,
                'next_state': DialogueState.ASK_LOCATION,
                'response_key': 'price_estimate',
                'priority': 8
            },
            
            # Rule 6: Service request - need service
            {
                'name': 'need_service',
                'condition': lambda intent, state, known: (
                    intent == 'REQUEST_SERVICE' and 
                    not known.get('service')
                ),
                'action': ActionType.ASK_SERVICE,
                'next_state': DialogueState.ASK_SERVICE,
                'response_key': 'ask_service',
                'priority': 7
            },
            
            # Rule 7: Service known - need location
            {
                'name': 'need_location',
                'condition': lambda intent, state, known: (
                    intent == 'REQUEST_SERVICE' and 
                    known.get('service') and 
                    not known.get('location')
                ),
                'action': ActionType.ASK_LOCATION,
                'next_state': DialogueState.ASK_LOCATION,
                'response_key': 'ask_location',
                'priority': 6
            },
            
            # Rule 8: Service + location known - need time
            {
                'name': 'need_time',
                'condition': lambda intent, state, known: (
                    intent == 'REQUEST_SERVICE' and 
                    known.get('service') and 
                    known.get('location') and 
                    not known.get('time')
                ),
                'action': ActionType.ASK_TIME,
                'next_state': DialogueState.ASK_TIME,
                'response_key': 'ask_time',
                'priority': 5
            },
            
            # Rule 9: Basic info complete - need description
            {
                'name': 'need_description',
                'condition': lambda intent, state, known: (
                    intent == 'REQUEST_SERVICE' and 
                    known.get('service') and 
                    known.get('location') and 
                    known.get('time') and 
                    not known.get('description')
                ),
                'action': ActionType.ASK_DESCRIPTION,
                'next_state': DialogueState.ASK_DESCRIPTION,
                'response_key': 'ask_description',
                'priority': 4
            },
            
            # Rule 10: All info complete - confirm
            {
                'name': 'ready_to_confirm',
                'condition': lambda intent, state, known: (
                    intent == 'REQUEST_SERVICE' and 
                    known.get('service') and 
                    known.get('location') and 
                    known.get('time') and 
                    known.get('description')
                ),
                'action': ActionType.CONFIRM_REQUEST,
                'next_state': DialogueState.CONFIRM,
                'response_key': 'confirm',
                'priority': 3
            },
            
            # Fallback rule (lowest priority)
            {
                'name': 'fallback',
                'condition': lambda intent, state, known: True,  # Always matches
                'action': ActionType.FALLBACK,
                'next_state': DialogueState.ASK_SERVICE,
                'response_key': 'fallback',
                'priority': 0
            }
        ]
    
    def evaluate(self, intent: str, state: str, known: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate rules and return decision
        
        Args:
            intent: Detected intent (e.g., 'REQUEST_SERVICE')
            state: Current dialogue state (e.g., 'ASK_LOCATION')
            known: Dict of known information (service, location, time, etc.)
        
        Returns:
            {
                'action': ActionType,
                'next_state': DialogueState,
                'response_key': str,
                'slots': dict,
                'reasoning': str
            }
        """
        # Find matching rules
        matching_rules = []
        for rule in self.rules:
            try:
                if rule['condition'](intent, state, known):
                    matching_rules.append(rule)
            except Exception as e:
                # Rule evaluation error - skip
                continue
        
        # Sort by priority (highest first)
        matching_rules.sort(key=lambda r: r['priority'], reverse=True)
        
        # Take highest priority rule
        if matching_rules:
            best_rule = matching_rules[0]
            
            # Build slots from known info
            slots = {k: v for k, v in known.items() if v is not None}
            
            return {
                'action': best_rule['action'].value,
                'next_state': best_rule['next_state'].value,
                'response_key': best_rule['response_key'],
                'slots': slots,
                'reasoning': f"Rule: {best_rule['name']} (priority {best_rule['priority']})",
                'missing': self._get_missing_info(known)
            }
        
        # Should never happen (fallback rule always matches)
        return {
            'action': ActionType.FALLBACK.value,
            'next_state': DialogueState.ASK_SERVICE.value,
            'response_key': 'fallback',
            'slots': {},
            'reasoning': 'No rules matched (fallback)',
            'missing': []
        }
    
    def _get_missing_info(self, known: Dict[str, Any]) -> List[str]:
        """Determine what information is still missing"""
        required = ['service', 'location', 'time', 'description']
        return [field for field in required if not known.get(field)]
    
    def calculate_priority(self, known: Dict[str, Any]) -> str:
        """
        Calculate urgency priority
        Returns: 'high', 'medium', or 'low'
        """
        urgency = known.get('urgency')
        time = known.get('time')
        
        if urgency == 'urgent':
            return 'high'
        if time in ['today', 'tomorrow']:
            return 'high'
        if time == 'this_week':
            return 'medium'
        
        return 'low'
    
    def is_complete(self, known: Dict[str, Any]) -> bool:
        """Check if all required information is collected"""
        required = ['service', 'location', 'time', 'description']
        return all(known.get(field) for field in required)


# Singleton instance
_engine = None

def get_engine() -> DecisionEngine:
    """Get or create decision engine instance"""
    global _engine
    if _engine is None:
        _engine = DecisionEngine()
    return _engine
