"""
AI Service - Decision & Intelligence Engine
No LLM, rule-based intelligence
Port: 8000
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import structlog

from services.nlp_service import NLPService
from services.intent_classifier import IntentClassifier
from services.decision_engine import DecisionEngine
from services.scoring_service import ScoringService
from services.optimization_service import OptimizationService
from services.learning_service import LearningService

# Initialize logger
logger = structlog.get_logger()

# Initialize FastAPI
app = FastAPI(
    title="Helpro AI Service",
    description="Decision & Intelligence Engine (No LLM)",
    version="1.0.0"
)

# CORS (allow NestJS backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services (lazy loading)
nlp_service: Optional[NLPService] = None
intent_classifier: Optional[IntentClassifier] = None
decision_engine: Optional[DecisionEngine] = None
scoring_service: Optional[ScoringService] = None
optimization_service: Optional[OptimizationService] = None
learning_service: Optional[LearningService] = None


@app.on_event("startup")
async def startup_event():
    """Initialize AI services on startup"""
    global nlp_service, intent_classifier, decision_engine, scoring_service, optimization_service, learning_service
    
    logger.info("🚀 Starting AI Service...")
    
    # Initialize services
    nlp_service = NLPService()
    intent_classifier = IntentClassifier()
    decision_engine = DecisionEngine()
    scoring_service = ScoringService()
    optimization_service = OptimizationService()
    learning_service = LearningService()
    
    logger.info("✅ AI Service ready")


# Request/Response Models
class TextAnalysisRequest(BaseModel):
    text: str
    language: str = "en-GB"
    user_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


class IntentResponse(BaseModel):
    intent: str
    confidence: float
    entities: Dict[str, Any]
    urgency: str
    service_category: Optional[str] = None


class DecisionRequest(BaseModel):
    intent: str
    entities: Dict[str, Any]
    user_data: Dict[str, Any]
    context: Optional[Dict[str, Any]] = None


class DecisionResponse(BaseModel):
    action: str
    suggested_response: str
    next_steps: List[str]
    auto_actions: List[str]
    warnings: List[str]


class ScoringRequest(BaseModel):
    user_id: str
    score_type: str  # "trust" | "quality" | "priority"
    data: Dict[str, Any]


class ScoringResponse(BaseModel):
    score: float
    breakdown: Dict[str, float]
    level: str
    recommendations: List[str]


class MatchingRequest(BaseModel):
    task_data: Dict[str, Any]
    available_helpers: List[Dict[str, Any]]
    preferences: Optional[Dict[str, Any]] = None


class MatchingResponse(BaseModel):
    matches: List[Dict[str, Any]]
    algorithm: str
    execution_time_ms: float


class FeedbackRequest(BaseModel):
    action_id: str
    action_type: str
    outcome: str  # "accepted" | "rejected" | "completed" | "complained"
    data: Dict[str, Any]


# API Endpoints

@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "Helpro AI Engine",
        "status": "running",
        "version": "1.0.0",
        "type": "rule-based (no LLM)"
    }


@app.post("/analyze", response_model=IntentResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    NLP Layer: Understand user text
    - Detect intent
    - Extract entities
    - Detect urgency
    - Classify service type
    """
    try:
        # Step 1: NLP processing
        nlp_result = nlp_service.process(
            text=request.text,
            language=request.language
        )
        
        # Step 2: Intent classification
        intent_result = intent_classifier.classify(
            text=request.text,
            language=request.language,
            context=request.context
        )
        
        return IntentResponse(
            intent=intent_result["intent"],
            confidence=intent_result["confidence"],
            entities=nlp_result["entities"],
            urgency=nlp_result["urgency"],
            service_category=intent_result.get("service_category")
        )
    
    except Exception as e:
        logger.error("analyze_text_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/decide", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """
    Decision Engine: Decide what should happen
    - Apply business rules
    - Check constraints
    - Suggest actions
    """
    try:
        decision = decision_engine.decide(
            intent=request.intent,
            entities=request.entities,
            user_data=request.user_data,
            context=request.context
        )
        
        return DecisionResponse(**decision)
    
    except Exception as e:
        logger.error("make_decision_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score", response_model=ScoringResponse)
async def calculate_score(request: ScoringRequest):
    """
    Scoring System: Calculate trust/quality/priority scores
    - Trust Score: User reliability
    - Quality Score: Helper performance
    - Priority Score: Task urgency
    """
    try:
        score_result = scoring_service.calculate(
            user_id=request.user_id,
            score_type=request.score_type,
            data=request.data
        )
        
        return ScoringResponse(**score_result)
    
    except Exception as e:
        logger.error("calculate_score_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match", response_model=MatchingResponse)
async def match_helpers(request: MatchingRequest):
    """
    Optimization Engine: Match helpers to tasks
    - Score all candidates
    - Apply constraints
    - Rank by weighted score
    """
    try:
        import time
        start_time = time.time()
        
        matches = optimization_service.match(
            task_data=request.task_data,
            available_helpers=request.available_helpers,
            preferences=request.preferences
        )
        
        execution_time = (time.time() - start_time) * 1000
        
        return MatchingResponse(
            matches=matches,
            algorithm="weighted_scoring",
            execution_time_ms=round(execution_time, 2)
        )
    
    except Exception as e:
        logger.error("match_helpers_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/feedback")
async def record_feedback(request: FeedbackRequest):
    """
    Learning System: Learn from outcomes
    - Store feedback
    - Update statistics
    - Adjust weights
    """
    try:
        learning_service.record_feedback(
            action_id=request.action_id,
            action_type=request.action_type,
            outcome=request.outcome,
            data=request.data
        )
        
        return {"status": "recorded"}
    
    except Exception as e:
        logger.error("record_feedback_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    """Get AI system statistics"""
    try:
        stats = learning_service.get_stats()
        return stats
    
    except Exception as e:
        logger.error("get_stats_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
