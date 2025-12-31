"""
MAIN AI ORCHESTRATOR
Combines all 7 components into complete AI flow
"""

from typing import Dict, Optional
from utils.text_normalizer import TextNormalizer
from intent.classifier import get_classifier
from entities.extractor import EntityExtractor
from context.memory import get_memory, ConversationContext
from rules.decision_engine import DecisionEngine
from response.generator import get_generator


class AIOrchestrator:
    """
    Main AI brain that coordinates all components.
    
    Flow:
    1. Normalize text
    2. Classify intent
    3. Extract entities
    4. Update context
    5. Apply decision rules
    6. Generate response
    """
    
    def __init__(self):
        self.normalizer = TextNormalizer()
        self.classifier = get_classifier()
        self.extractor = EntityExtractor()
        self.memory = get_memory()
        self.decision_engine = DecisionEngine()
        self.generator = get_generator()
    
    def process_message(
        self,
        text: str,
        session_id: str,
        user_id: str,
        language: str = 'en'
    ) -> Dict:
        """
        Complete AI flow: text in → structured response out
        
        Args:
            text: User message
            session_id: Conversation session ID
            user_id: User ID
            language: Language code
        
        Returns:
            {
                "message": "Where should it take place?",
                "intent": "REQUEST_SERVICE",
                "confidence": 0.87,
                "entities": {...},
                "next_state": "ASK_LOCATION",
                "quick_replies": [...]
            }
        """
        
        # STEP 1: Normalize text
        normalized = self.normalizer.normalize(text)
        
        # STEP 2: Classify intent (ML or rule-based)
        intent_result = self.classifier.classify(normalized)
        intent = intent_result['intent']
        confidence = intent_result['confidence']
        
        # STEP 3: Extract entities
        entities = self.extractor.extract_all(text)
        
        # STEP 4: Get or create context
        context = self.memory.get(session_id)
        if not context:
            context = self.memory.create(session_id, user_id)
        
        # Update context with new info
        context.update(
            intent=intent,
            **{k: v for k, v in entities.items() if v is not None}
        )
        context.add_message('user', text)
        
        # STEP 5: Make decision
        decision = self.decision_engine.evaluate(
            intent=intent,
            state=context.current_state,
            known=context.to_dict()
        )
        
        # Update state
        context.update(current_state=decision['next_state'])
        
        # STEP 6: Generate response
        response_text = self.generator.generate(
            response_key=decision['response_key'],
            language=language,
            slots=decision.get('slots', {})
        )
        
        # Get quick replies
        quick_replies = self.generator.generate_quick_replies(
            response_key=decision['response_key'],
            language=language
        )
        
        # Add bot message to history
        context.add_message('bot', response_text)
        
        # STEP 7: Return complete result
        return {
            'message': response_text,
            'session_id': session_id,
            'language': language,
            'intent': intent,
            'confidence': confidence,
            'entities': entities,
            'action': decision['action'],
            'next_state': decision['next_state'],
            'quick_replies': quick_replies if quick_replies else None,
            'missing_fields': context.get_missing_fields(),
            'is_complete': context.is_complete(),
        }
    
    def start_conversation(
        self,
        session_id: str,
        user_id: str,
        language: str = 'en'
    ) -> Dict:
        """Start new conversation"""
        # Create context
        context = self.memory.create(session_id, user_id)
        
        # Generate greeting
        greeting = self.generator.generate('greeting', language)
        context.add_message('bot', greeting)
        
        return {
            'message': greeting,
            'session_id': session_id,
            'language': language,
            'next_state': 'ASK_SERVICE'
        }
    
    def get_context(self, session_id: str) -> Optional[Dict]:
        """Get conversation context"""
        context = self.memory.get(session_id)
        if context:
            return context.to_dict()
        return None
    
    def end_conversation(self, session_id: str):
        """End conversation"""
        self.memory.delete(session_id)
    
    def health_check(self) -> Dict:
        """System health check"""
        return {
            'status': 'ok',
            'components': {
                'normalizer': 'ready',
                'classifier': 'trained' if self.classifier.pipeline else 'not_trained',
                'extractor': 'ready',
                'memory': 'ready',
                'decision_engine': 'ready',
                'generator': 'ready',
            },
            'active_sessions': self.memory.count(),
        }


# Singleton instance
_orchestrator = None

def get_orchestrator() -> AIOrchestrator:
    """Get or create orchestrator instance"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AIOrchestrator()
    return _orchestrator


# Example usage
if __name__ == "__main__":
    orchestrator = AIOrchestrator()
    
    print("AI Orchestrator Test")
    print("="*60)
    
    # Start conversation
    result = orchestrator.start_conversation(
        session_id='test_session_123',
        user_id='user_456',
        language='en'
    )
    print(f"\nBOT: {result['message']}")
    
    # User message 1
    result = orchestrator.process_message(
        text="I need help with cleaning",
        session_id='test_session_123',
        user_id='user_456',
        language='en'
    )
    print(f"\nUSER: I need help with cleaning")
    print(f"BOT: {result['message']}")
    print(f"Intent: {result['intent']} (confidence: {result['confidence']:.2f})")
    print(f"Entities: {result['entities']}")
    print(f"Next state: {result['next_state']}")
    
    # User message 2
    result = orchestrator.process_message(
        text="Stockholm, Södermalm",
        session_id='test_session_123',
        user_id='user_456',
        language='en'
    )
    print(f"\nUSER: Stockholm, Södermalm")
    print(f"BOT: {result['message']}")
    print(f"Missing fields: {result['missing_fields']}")
    
    # Get context
    context = orchestrator.get_context('test_session_123')
    print(f"\nCurrent context:")
    print(f"  Service: {context['service']}")
    print(f"  Location: {context['location']}")
    print(f"  State: {context['current_state']}")
    print(f"  Messages: {len(context['messages'])}")
