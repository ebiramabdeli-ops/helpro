# Python AI Microservice

## 🧠 Overview

This is the **Python AI Brain** for Helpro - a microservice that handles all AI logic:

1. **Intent Classification** (rule-based + ML fallback)
2. **Entity Extraction** (regex + dateparser)
3. **Decision Rules** (IF-THEN logic)
4. **Trust & Risk Scoring** (algorithmic)
5. **Matching Optimization** (scipy + numpy)

**NO LLMs, NO Transformers, NO GPUs** - Pure algorithmic AI, CPU-only, cheap to run.

---

## 🏗️ Architecture

```
Node.js Backend (TypeScript)
        ↓ HTTP Request (JSON)
Python AI Service (Port 8000)
        ↓ HTTP Response (JSON)
Node.js Backend
```

**Separation of Concerns:**
- **Python**: AI brain (decisions, scoring, optimization)
- **Node.js**: Orchestration, APIs, database, authentication

---

## 📁 Project Structure

```
ai-python/
├── api.py                  # FastAPI microservice (main entry point)
├── requirements.txt        # Python dependencies
├── test_api.py            # Test script
├── intent/
│   ├── classifier.py      # Intent classification (hybrid: rules + ML)
│   └── train.py          # Training script (run offline)
├── entities/
│   └── extractor.py       # Entity extraction (service, time, location)
├── rules/
│   └── decision_engine.py # Decision rules (IF-THEN logic)
├── scoring/
│   └── trust_risk.py      # Trust & risk scoring algorithms
├── matching/
│   └── optimizer.py       # Helper-task matching (scipy optimization)
└── models/
    └── intent_model.pkl   # Trained intent classifier (optional)
```

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd ai-python
pip install -r requirements.txt
```

### 2. Train Intent Classifier (Optional)

```bash
python intent/train.py
```

This creates `models/intent_model.pkl`. If skipped, the service falls back to rule-based classification only.

### 3. Start AI Service

```bash
python api.py
```

Service runs on **http://localhost:8000**

### 4. Test Endpoints

```bash
python test_api.py
```

---

## 📡 API Endpoints

### Health Check

```bash
GET http://localhost:8000/health
```

**Response:**
```json
{
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
```

---

### 1. Intent Detection

**Endpoint:** `POST /intent`

**Request:**
```json
{
  "text": "I need help cleaning my apartment tomorrow",
  "language": "en"
}
```

**Response:**
```json
{
  "intent": "REQUEST_SERVICE",
  "confidence": 0.85,
  "method": "rule-based",
  "entities": {
    "service": "cleaning",
    "time": {
      "raw": "tomorrow",
      "relative": "tomorrow",
      "parsed": "2026-01-01"
    },
    "urgency": null,
    "location": null,
    "budget": null
  }
}
```

---

### 2. Decision Engine

**Endpoint:** `POST /decision`

**Request:**
```json
{
  "intent": "REQUEST_SERVICE",
  "state": "ASK_LOCATION",
  "known": {
    "service": "cleaning"
  }
}
```

**Response:**
```json
{
  "action": "ASK_LOCATION",
  "next_state": "ASK_LOCATION",
  "response_key": "ask_location",
  "slots": {
    "service": "cleaning"
  },
  "reasoning": "Rule: need_location (priority 6)",
  "missing": ["location", "time", "description"]
}
```

---

### 3. Trust Scoring

**Endpoint:** `POST /trust`

**Request:**
```json
{
  "identity_verified": true,
  "completed_tasks": 15,
  "avg_rating": 4.5,
  "on_time_completions": 14,
  "total_completions": 15,
  "disputes": 0
}
```

**Response:**
```json
{
  "total": 82.5,
  "identity": 100.0,
  "experience": 75.0,
  "reputation": 90.0,
  "reliability": 93.3,
  "penalty": 0.0,
  "level": "EXCELLENT"
}
```

---

### 4. Risk Assessment

**Endpoint:** `POST /risk`

**Request:**
```json
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
```

**Response:**
```json
{
  "risk_score": 45,
  "risk_level": "MEDIUM",
  "flags": ["NEW_USER_HIGH_VALUE", "LOW_TRUST_SCORE"],
  "recommendations": [
    "Consider identity verification",
    "Require upfront payment or escrow"
  ],
  "fraud_detected": false
}
```

---

### 5. Matching Optimization

**Endpoint:** `POST /matching`

**Request:**
```json
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
```

**Response:**
```json
{
  "matches": [
    {
      "helper_id": "helper_1",
      "helper": {...},
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
```

---

## 🔧 Integration with Node.js Backend

### Example: Call Python AI from TypeScript

```typescript
// services/ai-client.service.ts
import axios from 'axios';

const AI_SERVICE_URL = 'http://localhost:8000';

export class AIClientService {
  async detectIntent(text: string) {
    const response = await axios.post(`${AI_SERVICE_URL}/intent`, {
      text,
      language: 'en'
    });
    return response.data;
  }

  async calculateTrust(userData: any) {
    const response = await axios.post(`${AI_SERVICE_URL}/trust`, userData);
    return response.data;
  }

  async findMatches(helpers: any[], task: any) {
    const response = await axios.post(`${AI_SERVICE_URL}/matching`, {
      helpers,
      task,
      top_n: 3
    });
    return response.data;
  }
}
```

---

## 📊 Performance Characteristics

| Metric | Value |
|--------|-------|
| **Response Time** | ~20-50ms per request |
| **Memory** | ~200MB (base) + ~50MB per concurrent request |
| **CPU** | 100% CPU-only (NO GPU needed) |
| **Scalability** | Horizontal (run multiple instances) |
| **Cost** | ~€5-10/month for 100k requests |

---

## 🧪 Testing

### Unit Tests

```bash
pytest
```

### Manual Testing

```bash
# Test intent detection
curl -X POST http://localhost:8000/intent \
  -H "Content-Type: application/json" \
  -d '{"text": "I need help cleaning tomorrow"}'

# Test matching
curl -X POST http://localhost:8000/matching \
  -H "Content-Type: application/json" \
  -d @test_matching.json
```

---

## 🔒 Security

**What We DON'T Do:**
- ❌ Store raw messages
- ❌ Send data to third-party APIs (OpenAI, etc.)
- ❌ Use cloud ML services

**What We DO:**
- ✅ Process data locally (CPU-only)
- ✅ GDPR-compliant (no PII logging)
- ✅ Input validation (Pydantic models)
- ✅ Rate limiting (optional, via reverse proxy)

---

## 🎯 Key Principles

1. **Rule-Based First**: Rules are faster, cheaper, more predictable
2. **ML as Fallback**: ML only for ambiguous cases
3. **CPU-Only**: NO GPUs, NO cloud AI APIs
4. **Deterministic**: Same input → same output
5. **Testable**: 100% unit test coverage possible
6. **Explainable**: Every decision has reasoning

---

## 🚀 Deployment

### Production Setup

1. **Run as Systemd Service** (Linux):

```ini
# /etc/systemd/system/helpro-ai.service
[Unit]
Description=Helpro AI Service
After=network.target

[Service]
User=helpro
WorkingDirectory=/opt/helpro/ai-python
ExecStart=/usr/bin/python3 api.py
Restart=always

[Install]
WantedBy=multi-user.target
```

2. **Use Gunicorn for Production**:

```bash
gunicorn api:app \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --worker-class uvicorn.workers.UvicornWorker
```

3. **Reverse Proxy** (Nginx):

```nginx
location /ai/ {
    proxy_pass http://localhost:8000/;
    proxy_set_header Host $host;
}
```

---

## 📈 Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

### Logs

```bash
tail -f /var/log/helpro/ai-service.log
```

---

## 🔮 Future Enhancements (Optional)

1. **Skill Matching** with embeddings (CPU-only, small models)
2. **Demand Forecasting** using time-series (Prophet, CPU)
3. **Language Detection** (fastText, 2MB model)
4. **Sentiment Analysis** (rule-based, NO transformers)

**Always:**
- ❌ NO LLMs
- ❌ NO GPUs
- ❌ NO cloud AI APIs

---

## 🆘 Troubleshooting

### Service Won't Start

```bash
# Check Python version (needs 3.8+)
python3 --version

# Check dependencies
pip install -r requirements.txt

# Check port availability
lsof -i :8000
```

### Slow Response Times

- Check CPU usage: `top`
- Reduce concurrent requests
- Consider caching (Redis)

---

## 📝 License

Proprietary - Helpro Project

---

**Built with**: Python 3.10, FastAPI, scikit-learn, scipy, numpy
**Deployment**: CPU-only, horizontal scaling
**Cost**: ~€0.0001 per AI request
