"""
FastAPI AI Microservice
Python AI brain - receives JSON from Node.js, returns JSON
Exposes all AI modules via REST API + Complete Orchestrator
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import uvicorn

# Import AI modules
from intent.classifier import get_classifier
from entities.extractor import get_extractor
from rules.decision_engine import get_engine
from scoring.trust_risk import get_trust_scorer, get_risk_scorer
from matching.optimizer import get_optimizer, get_skill_matcher
from orchestrator import get_orchestrator

# Initialize FastAPI app
app = FastAPI(
    title="Helpro AI Service",
    description="Python AI brain for intent, entities, rules, scoring, and matching",
    version="1.0.0"
)

# ======================
# Request/Response Models
# ======================

class IntentRequest(BaseModel):
    text: str
    language: Optional[str] = 'en'

class IntentResponse(BaseModel):
    intent: str
    confidence: float
    method: str
    entities: Dict[str, Any]

class DecisionRequest(BaseModel):
    intent: str
    state: str
    known: Dict[str, Any]

class DecisionResponse(BaseModel):
    action: str
    next_state: str
    response_key: str
    slots: Dict[str, Any]
    reasoning: str
    missing: List[str]

class TrustRequest(BaseModel):
    identity_verified: bool
    completed_tasks: int
    avg_rating: float
    on_time_completions: int
    total_completions: int
    disputes: int

class TrustResponse(BaseModel):
    total: float
    identity: float
    experience: float
    reputation: float
    reliability: float
    penalty: float
    level: str

class RiskRequest(BaseModel):
    user_data: Dict[str, Any]
    task_value: float
    recent_activity: Optional[List[Dict]] = []

class RiskResponse(BaseModel):
    risk_score: int
    risk_level: str
    flags: List[str]
    recommendations: List[str]
    fraud_detected: bool

class MatchingRequest(BaseModel):
    helpers: List[Dict[str, Any]]
    task: Dict[str, Any]
    top_n: Optional[int] = 3

class MatchingResponse(BaseModel):
    matches: List[Dict[str, Any]]

# ======================
# Health Check
# ======================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Helpro AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/intent",
            "/decision",
            "/trust",
            "/risk",
            "/matching"
        ]
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "modules": {
            "intent_classifier": "ok",
            "entity_extractor": "ok",
            "decision_engine": "ok",
            "trust_scorer": "ok",
            "risk_scorer": "ok",
            "matching_optimizer": "ok"
        }
    }

# ======================
# Intent Detection
# ======================

@app.post("/intent", response_model=IntentResponse)
async def detect_intent(request: IntentRequest):
    """
    Detect intent and extract entities from text
    
    Example:
        POST /intent
        { "text": "I need help cleaning my apartment tomorrow" }
        
        Response:
        {
            "intent": "REQUEST_SERVICE",
            "confidence": 0.85,
            "method": "rule-based",
            "entities": {
                "service": "cleaning",
                "time": "tomorrow",
                ...
            }
        }
    """
    try:
        # Get AI modules
        classifier = get_classifier()
        extractor = get_extractor()
        
        # Classify intent
        intent_result = classifier.classify(request.text)
        
        # Extract entities
        entities = extractor.extract_all(request.text)
        
        return IntentResponse(
            intent=intent_result['intent'],
            confidence=intent_result['confidence'],
            method=intent_result['method'],
            entities=entities
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Decision Engine
# ======================

@app.post("/decision", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """
    Evaluate decision rules
    
    Example:
        POST /decision
        {
            "intent": "REQUEST_SERVICE",
            "state": "ASK_LOCATION",
            "known": { "service": "cleaning" }
        }
        
        Response:
        {
            "action": "ASK_LOCATION",
            "next_state": "ASK_LOCATION",
            "response_key": "ask_location",
            "slots": { "service": "cleaning" },
            "reasoning": "Rule: need_location (priority 6)",
            "missing": ["location", "time", "description"]
        }
    """
    try:
        engine = get_engine()
        decision = engine.evaluate(request.intent, request.state, request.known)
        
        return DecisionResponse(**decision)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Trust Scoring
# ======================

@app.post("/trust", response_model=TrustResponse)
async def calculate_trust(request: TrustRequest):
    """
    Calculate user trust score
    
    Example:
        POST /trust
        {
            "identity_verified": true,
            "completed_tasks": 15,
            "avg_rating": 4.5,
            "on_time_completions": 14,
            "total_completions": 15,
            "disputes": 0
        }
        
        Response:
        {
            "total": 82.5,
            "identity": 100.0,
            "experience": 75.0,
            "reputation": 90.0,
            "reliability": 93.3,
            "penalty": 0.0,
            "level": "EXCELLENT"
        }
    """
    try:
        scorer = get_trust_scorer()
        
        user_data = request.dict()
        score_breakdown = scorer.calculate_trust_score(user_data)
        level = scorer.get_trust_level(score_breakdown['total'])
        
        return TrustResponse(
            **score_breakdown,
            level=level
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Risk Assessment
# ======================

@app.post("/risk", response_model=RiskResponse)
async def assess_risk(request: RiskRequest):
    """
    Assess transaction risk and detect fraud
    
    Example:
        POST /risk
        {
            "user_data": {
                "completed_tasks": 0,
                "trust_score": 25,
                "disputes": 0,
                "cancellations_last_7d": 0
            },
            "task_value": 1500,
            "recent_activity": []
        }
        
        Response:
        {
            "risk_score": 45,
            "risk_level": "MEDIUM",
            "flags": ["NEW_USER_HIGH_VALUE", "LOW_TRUST_SCORE"],
            "recommendations": ["Consider identity verification", "Require upfront payment or escrow"],
            "fraud_detected": false
        }
    """
    try:
        scorer = get_risk_scorer()
        
        # Assess risk
        risk_result = scorer.assess_risk(request.user_data, request.task_value)
        
        # Detect fraud patterns
        fraud_detected = scorer.detect_fraud_patterns(
            request.user_data, 
            request.recent_activity
        )
        
        return RiskResponse(
            **risk_result,
            fraud_detected=fraud_detected
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Matching Optimization
# ======================

@app.post("/matching", response_model=MatchingResponse)
async def find_matches(request: MatchingRequest):
    """
    Find best helper-task matches
    
    Example:
        POST /matching
        {
            "helpers": [
                {
                    "id": "helper_1",
                    "trust_score": 85,
                    "latitude": 59.3293,
                    "longitude": 18.0686,
                    "is_available": true,
                    "hourly_rate": 50
                }
            ],
            "task": {
                "id": "task_1",
                "latitude": 59.3326,
                "longitude": 18.0649,
                "max_budget": 60
            },
            "top_n": 3
        }
        
        Response:
        {
            "matches": [
                {
                    "helper_id": "helper_1",
                    "scores": {
                        "total": 88.5,
                        "trust": 85.0,
                        "distance": 95.2,
                        "availability": 100.0,
                        "price": 100.0,
                        "distance_km": 0.42
                    }
                }
            ]
        }
    """
    try:
        optimizer = get_optimizer()
        
        matches = optimizer.find_best_matches(
            request.helpers,
            request.task,
            request.top_n
        )
        
        return MatchingResponse(matches=matches)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ======================
# Optional: Batch Operations
# ======================

@app.post("/matching/batch")
async def batch_matching(helpers: List[Dict], tasks: List[Dict]):
    """
    Optimal batch assignment using Hungarian algorithm
    """
    try:
        optimizer = get_optimizer()
        assignments = optimizer.optimal_assignment(helpers, tasks)
        
        return {
            "assignments": [
                {"helper_id": h, "task_id": t, "score": s}
                for h, t, s in assignments
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ======================
# COMPLETE AI ORCHESTRATOR (7-Component Flow)
# ======================

class ChatMessageRequest(BaseModel):
    text: str
    session_id: str
    user_id: str
    language: Optional[str] = 'en'

class ChatStartRequest(BaseModel):
    session_id: str
    user_id: str
    language: Optional[str] = 'en'

class ChatResponse(BaseModel):
    message: str
    session_id: str
    language: str
    intent: Optional[str] = None
    confidence: Optional[float] = None
    entities: Optional[Dict] = None
    action: Optional[str] = None
    next_state: Optional[str] = None
    quick_replies: Optional[List[str]] = None
    missing_fields: Optional[List[str]] = None
    is_complete: Optional[bool] = None


@app.post("/chat/process", response_model=ChatResponse)
async def process_chat_message(request: ChatMessageRequest):
    """
    COMPLETE AI FLOW (7 Components):
    1. Text Normalization
    2. Intent Classification (ML)
    3. Entity Extraction
    4. Context Memory Update
    5. Rule-Based Decision
    6. Response Generation
    7. Return Structured Response
    
    This is the main endpoint that Node.js should call.
    """
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.process_message(
            text=request.text,
            session_id=request.session_id,
            user_id=request.user_id,
            language=request.language
        )
        return ChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/start")
async def start_chat(request: ChatStartRequest):
    """Start new conversation"""
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.start_conversation(
            session_id=request.session_id,
            user_id=request.user_id,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/context/{session_id}")
async def get_chat_context(session_id: str):
    """Get conversation context"""
    orchestrator = get_orchestrator()
    context = orchestrator.get_context(session_id)
    if not context:
        raise HTTPException(status_code=404, detail="Session not found")
    return context


@app.delete("/chat/context/{session_id}")
async def end_chat(session_id: str):
    """End conversation"""
    orchestrator = get_orchestrator()
    orchestrator.end_conversation(session_id)
    return {"message": "Conversation ended"}


# ======================
# Run Server
# ======================

if __name__ == "__main__":
    print("="*60)
    print("Helpro AI Microservice Starting")
    print("Rule-based AI + ML (NO LLM)")
    print("Port: 8000")
    print("="*60)
    
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
