"""
Component 4: CONTEXT MEMORY
Purpose: Remember conversation state (NO database, in-memory)
"""

from typing import Dict, Optional, List
from datetime import datetime
from dataclasses import dataclass, field, asdict


@dataclass
class ConversationContext:
    """
    Stores conversation state.
    This is intelligence, not language.
    """
    session_id: str
    user_id: str
    
    # What we know
    intent: Optional[str] = None
    service: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    description: Optional[str] = None
    urgency: Optional[str] = None
    
    # Metadata
    current_state: str = "START"
    confidence: float = 0.0
    messages: List[Dict] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    
    def update(self, **kwargs):
        """Update context fields"""
        for key, value in kwargs.items():
            if hasattr(self, key) and value is not None:
                setattr(self, key, value)
        self.updated_at = datetime.now()
    
    def add_message(self, role: str, content: str):
        """Add message to history"""
        self.messages.append({
            'role': role,
            'content': content,
            'timestamp': datetime.now().isoformat()
        })
        self.updated_at = datetime.now()
    
    def get_missing_fields(self) -> List[str]:
        """
        Get list of missing required fields.
        This determines what to ask next.
        """
        missing = []
        
        if not self.service:
            missing.append('service')
        if not self.location:
            missing.append('location')
        if not self.date and not self.time:
            missing.append('time')
        if not self.description:
            missing.append('description')
        
        return missing
    
    def is_complete(self) -> bool:
        """Check if all required information is collected"""
        return len(self.get_missing_fields()) == 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return asdict(self)


class ContextMemory:
    """
    In-memory context storage.
    In production, use Redis or similar.
    """
    
    def __init__(self):
        self._contexts: Dict[str, ConversationContext] = {}
    
    def create(self, session_id: str, user_id: str) -> ConversationContext:
        """Create new conversation context"""
        context = ConversationContext(
            session_id=session_id,
            user_id=user_id
        )
        self._contexts[session_id] = context
        return context
    
    def get(self, session_id: str) -> Optional[ConversationContext]:
        """Get context by session ID"""
        return self._contexts.get(session_id)
    
    def update(self, session_id: str, **kwargs) -> Optional[ConversationContext]:
        """Update context"""
        context = self.get(session_id)
        if context:
            context.update(**kwargs)
        return context
    
    def delete(self, session_id: str):
        """Delete context (conversation ended)"""
        if session_id in self._contexts:
            del self._contexts[session_id]
    
    def exists(self, session_id: str) -> bool:
        """Check if context exists"""
        return session_id in self._contexts
    
    def get_all(self) -> List[ConversationContext]:
        """Get all active contexts"""
        return list(self._contexts.values())
    
    def count(self) -> int:
        """Get number of active contexts"""
        return len(self._contexts)


# Singleton instance
_memory = None

def get_memory() -> ContextMemory:
    """Get or create memory instance"""
    global _memory
    if _memory is None:
        _memory = ContextMemory()
    return _memory


# Example usage
if __name__ == "__main__":
    memory = ContextMemory()
    
    # Create conversation
    ctx = memory.create("session_123", "user_456")
    print(f"Created context: {ctx.session_id}")
    print(f"Missing fields: {ctx.get_missing_fields()}")
    
    # Update with extracted entities
    ctx.update(
        intent="REQUEST_SERVICE",
        service="cleaning",
        location="Stockholm"
    )
    print(f"\nAfter update:")
    print(f"Service: {ctx.service}")
    print(f"Location: {ctx.location}")
    print(f"Missing fields: {ctx.get_missing_fields()}")
    
    # Add more info
    ctx.update(date="2026-01-01", time="10:00")
    ctx.add_message("user", "I need cleaning tomorrow at 10")
    ctx.add_message("bot", "Where should the cleaning take place?")
    
    print(f"\nComplete: {ctx.is_complete()}")
    print(f"Message count: {len(ctx.messages)}")
    
    # Retrieve context
    retrieved = memory.get("session_123")
    print(f"\nRetrieved context: {retrieved.service} at {retrieved.location}")
