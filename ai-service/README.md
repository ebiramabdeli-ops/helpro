# Helpro AI Service

🧠 **Rule-based Intelligence Engine (NO LLM)**

## Architecture

```
User Input → NLP → Intent Detection → Decision Engine → Response
                ↓           ↓              ↓
            Entities    Confidence    Business Rules
```

## Features

### ✅ 1. NLP Layer (spaCy)
- Entity extraction (dates, times, locations, items)
- Urgency detection
- Service type detection
- **NO LLM** - Classical NLP only

### ✅ 2. Intent Classifier (scikit-learn)
- 13 intent types
- TF-IDF + Logistic Regression
- Trainable with 200-500 examples per language
- Multilingual (15 languages)

### ✅ 3. Decision Engine
- Rule-based business logic
- Decision tables
- Constraint checking
- Safety rules

### ✅ 4. Scoring System
- **Trust Score** (0-5): User reliability
- **Quality Score** (0-5): Helper performance
- **Priority Score** (0-100): Task urgency

### ✅ 5. Optimization Engine
- Helper-task matching (weighted scoring)
- Schedule optimization
- Price suggestions
- Distance calculations

### ✅ 6. Learning System
- Statistical learning (NO LLM)
- Feedback tracking
- Pattern detection
- Automatic weight adjustments

## Tech Stack

- **Python 3.11+**
- **FastAPI** - Web framework
- **spaCy** - NLP (entity extraction)
- **scikit-learn** - ML (intent classification)
- **NumPy/Pandas** - Data processing
- **Redis** - Caching (optional)

## Installation

```bash
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Download spaCy models (only needed languages)
python -m spacy download en_core_web_sm
python -m spacy download de_core_news_sm
python -m spacy download fr_core_news_sm
# ... etc
```

## Running

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### POST /analyze
Analyze user text (NLP + Intent Detection)

**Request:**
```json
{
  "text": "I need someone to remove a sofa tomorrow",
  "language": "en-GB",
  "context": {}
}
```

**Response:**
```json
{
  "intent": "service_request",
  "confidence": 0.95,
  "entities": {
    "items": ["sofa"],
    "dates": ["tomorrow"],
    "urgency": "high"
  },
  "service_category": "recycling"
}
```

### POST /decide
Make business decision based on intent

**Request:**
```json
{
  "intent": "service_request",
  "entities": {"service_hints": ["cleaning"]},
  "user_data": {
    "trust_score": 4.2,
    "verification_level": 2,
    "subscription_tier": "PRO"
  }
}
```

**Response:**
```json
{
  "action": "create_booking",
  "suggested_response": "Great! I'm preparing your cleaning booking...",
  "next_steps": ["match_helpers", "send_confirmation"],
  "auto_actions": ["create_draft_booking"],
  "warnings": []
}
```

### POST /score
Calculate trust/quality/priority scores

**Request:**
```json
{
  "user_id": "user_123",
  "score_type": "trust",
  "data": {
    "completed_jobs": 15,
    "verification_level": 2,
    "average_review": 4.5,
    "complaints": 0
  }
}
```

**Response:**
```json
{
  "score": 4.2,
  "breakdown": {
    "completed_jobs": 1.25,
    "verification_level": 0.67,
    "reviews": 0.90
  },
  "level": "high",
  "recommendations": ["Complete Level 3 verification"]
}
```

### POST /match
Match helpers to task

**Request:**
```json
{
  "task_data": {
    "service_category": "cleaning",
    "location": {"lat": 51.5, "lng": -0.1},
    "budget": 50,
    "urgency": "high"
  },
  "available_helpers": [
    {
      "id": "helper_1",
      "quality_score": 4.8,
      "location": {"lat": 51.52, "lng": -0.12},
      "hourly_rate": 25
    }
  ]
}
```

**Response:**
```json
{
  "matches": [
    {
      "id": "helper_1",
      "match_score": 87.5,
      "match_reasons": ["Top-rated helper", "Very close (2.3km)"],
      "distance_km": 2.3
    }
  ],
  "algorithm": "weighted_scoring",
  "execution_time_ms": 15.2
}
```

### POST /feedback
Record feedback for learning

**Request:**
```json
{
  "action_id": "action_123",
  "action_type": "match",
  "outcome": "completed",
  "data": {"helper_id": "helper_1"}
}
```

## Multilingual Support

**Supported Languages:** 15 (same as frontend)

```
🇬🇧 en-GB, en-IE  🇩🇪 de-DE  🇫🇷 fr-FR  🇪🇸 es-ES  🇮🇹 it-IT
🇸🇪 sv-SE  🇳🇴 nb-NO  🇩🇰 da-DK  🇫🇮 fi-FI  🇳🇱 nl-NL
🇵🇹 pt-PT  🇵🇱 pl-PL  🇷🇴 ro-RO  🇬🇷 el-GR
```

**Translation Status:**
- ✅ English (en-GB, en-IE)
- ✅ German (de-DE)
- ✅ French (fr-FR)
- ✅ Spanish (es-ES)
- ✅ Italian (it-IT)
- ✅ Swedish (sv-SE)
- ✅ Norwegian (nb-NO)
- ❌ Others (pending Phase 2-4)

## Training Intent Classifier

```python
from services.intent_classifier import IntentClassifier

classifier = IntentClassifier()

training_data = [
    {"text": "I need help moving furniture", "intent": "service_request"},
    {"text": "How much does cleaning cost?", "intent": "price_inquiry"},
    {"text": "I want to cancel my booking", "intent": "booking_cancel"},
    # ... 200-500 examples per intent
]

classifier.train(training_data, language="en")
```

## Integration with NestJS Backend

```typescript
// backend/src/modules/ai/ai.service.ts
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AIService {
  private readonly aiServiceUrl = 'http://localhost:8000';

  async analyzeText(text: string, language: string) {
    const response = await this.httpService.post(
      `${this.aiServiceUrl}/analyze`,
      { text, language }
    ).toPromise();
    
    return response.data;
  }

  async makeDecision(intent: string, entities: any, userData: any) {
    const response = await this.httpService.post(
      `${this.aiServiceUrl}/decide`,
      { intent, entities, user_data: userData }
    ).toPromise();
    
    return response.data;
  }
}
```

## Philosophy

> **"Your AI is not a chatbot. It's a silent operator."**

- ❌ NO LLM
- ❌ NO free-text generation
- ❌ NO hallucinations
- ✅ Predictable rules
- ✅ Explainable decisions
- ✅ Low cost (<€100/month)
- ✅ Fast (<50ms response)

## Cost Analysis

**Monthly Costs (1M requests):**
- spaCy: Free (open source)
- scikit-learn: Free (open source)
- Server: €20-50 (1-2 CPUs)
- **Total: €20-50/month**

**vs LLM (GPT-4):**
- 1M requests × $0.03 = **$30,000/month** 💸

## Performance

- **NLP Processing**: ~10ms
- **Intent Classification**: ~5ms
- **Decision Engine**: ~5ms
- **Matching (100 helpers)**: ~20ms
- **Total**: **~40ms** ⚡

## Testing

```bash
# Run tests
pytest

# Test specific service
pytest tests/test_nlp_service.py -v

# Test with coverage
pytest --cov=services --cov-report=html
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m spacy download en_core_web_sm

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build & Run

```bash
docker build -t helpro-ai .
docker run -p 8000:8000 helpro-ai
```

## Monitoring

```python
# main.py includes structured logging
import structlog

logger = structlog.get_logger()
logger.info("analyze_text", text_length=len(text), language=language)
```

## Future Enhancements

- [ ] Multi-model intent classification (ensemble)
- [ ] Real-time feedback loop
- [ ] A/B testing framework
- [ ] Advanced pattern detection
- [ ] Reinforcement learning (statistics-based)

## License

Proprietary - Helpro Platform

---

**Built with ❤️ without LLM hype**
