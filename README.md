# Helpro - Marketplace-Plattform für Alltagshilfe

Helpro ist eine moderne Full-Stack-Marketplace-Plattform für alltägliche Hilfe und Dienstleistungen mit integriertem AI-System und Admin-Dashboard.

## 📋 Architektur

Die Plattform besteht aus vier unabhängigen Services:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   NestJS Backend │────▶│   PostgreSQL    │
│   React + Vite  │     │   TypeORM        │     │   (Planned)     │
│   Port 5173     │     │   Port 3000      │     └─────────────────┘
└─────────────────┘     └──────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│   Server        │     │   AI Service     │
│   Express       │     │   FastAPI        │
│   SQLite        │     │   ML-Models      │
│   Port 8080     │     │   Port 8000      │
└─────────────────┘     └──────────────────┘
```

## ✨ Features

### Kernfunktionen
- **Mehrsprachigkeit**: Deutsch, Englisch, Türkisch (i18next)
- **Benutzer-Dashboard**: Buchungen, Messaging, Profile
- **Provider-Dashboard**: Auftragsverwaltung, Kalender
- **Buchungssystem**: Echtzeit-Matching mit AI-gestützter Optimierung
- **Messaging**: Direktkommunikation zwischen Usern und Providern
- **Zahlungssystem**: Integration vorbereitet

### Admin-Dashboard (In Entwicklung)
- **Problem-Solving Focus**: Operative Eingriffe statt Analytics
- **User Management**: Benutzer sperren, blockieren, Rückerstattungen
- **Provider Management**: Verifizierung, Suspendierung
- **Booking Management**: Stornierungen, Eskalationen
- **Payment Management**: Rückerstattungen, Transaktionsprobleme
- **AI Control**: Modell-Management, A/B-Tests
- **System Health**: Service-Status, Performance-Überwachung

Status: MODULE A (Users) komplett implementiert, 6 weitere Module geplant.

### AI-System
- **Intent Classification**: Regel-basierte Absichtserkennung
- **Entity Extraction**: NLP für relevante Informationen
- **Trust & Risk Scoring**: Bewertungssystem für Sicherheit
- **Match Optimization**: Intelligentes Provider-Matching
- **Decision Engine**: Automatisierte Entscheidungsfindung
- **Context Memory**: Konversations-Historie
- **Response Generation**: Template-basierte Antworten

**Hinweis**: Kein LLM, rein regel-basiert + ML für schnelle Antworten.

## 🚀 Schnellstart

### Mit Docker (Empfohlen)

```bash
# Produktions-Modus
./docker.sh start

# Development-Modus (mit Hot Reload)
./docker.sh dev

# Services stoppen
./docker.sh stop

# Alle Container und Volumes löschen
./docker.sh clean

# Logs anzeigen
./docker.sh logs

# Oder mit Make
make dev        # Development starten
make logs       # Logs anzeigen
make stop       # Services stoppen
```

**URLs nach dem Start:**
- Frontend: http://localhost (Production) / http://localhost:5173 (Dev)
- Backend API: http://localhost:3000
- Server API: http://localhost:8080
- AI Service: http://localhost:8000

Siehe [DOCKER.md](DOCKER.md) für detaillierte Docker-Dokumentation.

### Ohne Docker (Lokale Entwicklung)

```bash
# Frontend (Terminal 1)
npm install
npm run dev

# Backend (Terminal 2)
cd backend
npm install
npm run start:dev

# Server (Terminal 3)
cd server
npm install
npm run dev

# AI Service (Terminal 4)
cd ai-python
pip install -r requirements.txt
python api.py
```

## 🛠 Tech Stack

### Frontend
- **React 18** mit TypeScript
- **Vite** für ultraschnelles Development
- **React Router** für Navigation
- **i18next** für Internationalisierung
- **TailwindCSS** (geplant)

### Backend
- **NestJS** mit TypeScript
- **TypeORM** für Datenbankzugriff
- **PostgreSQL** (in Planung, aktuell SQLite)
- **JWT Authentication**

### Server
- **Node.js Express**
- **SQLite** für einfache lokale Entwicklung
- **REST API**

### AI Service
- **FastAPI** (Python 3.12)
- **NLP Processing** ohne LLM
- **ML Models** für Scoring und Matching
- **Regel-basiertes System**

### DevOps
- **Docker** mit Multi-Stage Builds
- **Docker Compose** für Service-Orchestrierung
- **Nginx** als Reverse Proxy (Production)
- **Health Checks** für alle Services

## 📁 Projekt-Struktur

```
/workspaces/helpro/
├── src/                    # Frontend React Code
│   ├── components/         # React Komponenten
│   ├── pages/             # Seiten-Komponenten
│   ├── services/          # API Services
│   ├── guards/            # Route Guards (Admin)
│   └── i18n/              # Sprachdateien
├── backend/               # NestJS Backend
│   └── src/
│       └── modules/       # Feature-Module
├── server/                # Express Server
│   ├── models/            # Datenmodelle
│   └── routes/            # API Routes
├── ai-python/             # AI Service
│   ├── intent/            # Intent Classifier
│   ├── entities/          # Entity Extractor
│   ├── scoring/           # Trust & Risk
│   └── matching/          # Match Optimizer
├── docker-compose.yml     # Production Docker Setup
├── docker-compose.dev.yml # Development Docker Setup
└── docker.sh              # Docker Management Script
```

## 📚 Dokumentation

- [DOCKER.md](DOCKER.md) - Vollständige Docker-Dokumentation
- [BACKEND_ARCHITECTURE.md](BACKEND_ARCHITECTURE.md) - Backend Design
- [AI_SYSTEM_COMPLETE.md](AI_SYSTEM_COMPLETE.md) - AI System Details
- [ADMIN_DASHBOARD.md](ADMIN_DASHBOARD.md) - Admin Dashboard Specs
- [LANGUAGE_SYSTEM_ARCHITECTURE.md](LANGUAGE_SYSTEM_ARCHITECTURE.md) - i18n System

## 🔧 Development

### Building for Production

```bash
# Frontend
npm run build

# Mit Docker
./docker.sh start
```

### Known Issues

- **NestJS Backend**: 110 TypeScript Errors (kompiliert aber erfolgreich)
- **PostgreSQL**: Noch nicht vollständig integriert, SQLite als Fallback
- **Admin Backend**: API-Endpoints für Admin-Dashboard noch nicht implementiert

## 📝 Lizenz

Proprietär - Alle Rechte vorbehalten
