# Helpro Docker Integration

Diese App ist vollständig dockerisiert mit separaten Containern für:
- Frontend (React + Vite + Nginx)
- Backend (NestJS)
- Server (Node.js Express)
- AI Service (Python FastAPI)
- PostgreSQL Database

## Schnellstart

### Produktion

```bash
# Alle Services bauen und starten
docker-compose up -d

# Logs anzeigen
docker-compose logs -f

# Services stoppen
docker-compose down

# Services stoppen und Volumes löschen
docker-compose down -v
```

Die App ist dann verfügbar unter:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Server API**: http://localhost:8080
- **AI Service**: http://localhost:8000

### Development (mit Hot Reload)

```bash
# Development Services starten
docker-compose -f docker-compose.dev.yml up -d

# Logs verfolgen
docker-compose -f docker-compose.dev.yml logs -f

# Einzelnen Service neu starten
docker-compose -f docker-compose.dev.yml restart backend

# Services stoppen
docker-compose -f docker-compose.dev.yml down
```

Die App ist dann verfügbar unter:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Server API**: http://localhost:8080
- **AI Service**: http://localhost:8000

## Container Details

### Frontend Container
- **Base Image**: node:20-alpine + nginx:alpine
- **Port**: 80
- **Build**: Multi-stage (build + production)
- **Features**: Nginx reverse proxy für alle APIs

### Backend Container (NestJS)
- **Base Image**: node:20-alpine
- **Port**: 3000
- **Database**: PostgreSQL
- **Features**: TypeORM, JWT Auth

### Server Container (Node.js)
- **Base Image**: node:20-alpine
- **Port**: 8080
- **Database**: SQLite (File-based)
- **Features**: Express, JWT Auth

### AI Service Container
- **Base Image**: python:3.12-slim
- **Port**: 8000
- **Features**: FastAPI, ML models, NLP

### PostgreSQL Container
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Credentials**: 
  - User: helpro
  - Password: helpro_password
  - Database: helpro

## Umgebungsvariablen

Erstelle eine `.env` Datei für Production:

```env
# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=helpro
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=helpro

# Security
JWT_SECRET=your-very-secure-secret-key

# Ports (optional, Standard-Ports werden verwendet)
FRONTEND_PORT=80
BACKEND_PORT=3000
SERVER_PORT=8080
AI_SERVICE_PORT=8000
```

## Nützliche Befehle

```bash
# Container Status prüfen
docker-compose ps

# In einen Container einsteigen
docker-compose exec backend sh
docker-compose exec postgres psql -U helpro

# Container neu bauen
docker-compose build
docker-compose build --no-cache backend

# Einzelnen Service starten
docker-compose up frontend

# Ressourcen bereinigen
docker system prune -a
docker volume prune

# Database Backup erstellen
docker-compose exec postgres pg_dump -U helpro helpro > backup.sql

# Database Backup wiederherstellen
docker-compose exec -T postgres psql -U helpro helpro < backup.sql
```

## Volumes

- **postgres_data**: PostgreSQL Datenbank
- **server_data**: SQLite Datenbank und Server-Dateien

## Netzwerk

Alle Services befinden sich im selben Docker-Netzwerk `helpro-network` und können sich gegenseitig über ihre Service-Namen erreichen:
- `backend:3000`
- `server:8080`
- `ai-service:8000`
- `postgres:5432`

## Troubleshooting

### Port bereits in Verwendung
```bash
# Anderen Prozess auf Port finden
lsof -i :80
lsof -i :3000

# Prozess beenden oder Port in docker-compose.yml ändern
```

### Container startet nicht
```bash
# Logs überprüfen
docker-compose logs backend

# Container Status prüfen
docker-compose ps

# Container neu starten
docker-compose restart backend
```

### Database Connection Fehler
```bash
# Warten bis PostgreSQL bereit ist
docker-compose exec postgres pg_isready -U helpro

# Database Container neu starten
docker-compose restart postgres
```

### Build-Fehler
```bash
# Cache löschen und neu bauen
docker-compose build --no-cache

# Nur einen Service neu bauen
docker-compose build --no-cache backend
```

## Production Best Practices

1. **Secrets**: Verwende Docker Secrets oder externe Secret-Management-Tools
2. **SSL/TLS**: Füge einen Reverse Proxy (z.B. Traefik, Nginx) für HTTPS hinzu
3. **Health Checks**: Sind bereits für PostgreSQL konfiguriert
4. **Monitoring**: Füge Prometheus/Grafana für Monitoring hinzu
5. **Logging**: Verwende einen zentralen Logging-Service
6. **Backups**: Automatisiere Database-Backups
7. **Updates**: Halte Base Images aktuell

## Sicherheit

⚠️ **Wichtig für Production**:
- Ändere alle Standardpasswörter
- Verwende starke JWT Secrets
- Aktiviere SSL/TLS
- Beschränke exposed Ports
- Verwende Read-only Container wo möglich
- Scanne Images auf Vulnerabilities: `docker scan helpro-frontend`
