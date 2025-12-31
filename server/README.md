# Helpro Backend

Vollständiges Express.js Backend für die Helpro Marketplace-Anwendung.

## Features

- ✅ **Authentifizierung**: JWT-basierte Auth mit bcrypt Password-Hashing
- ✅ **JSON-Datenbank**: Persistente Datenspeicherung in data.json (auto-save alle 30s)
- ✅ **RESTful API**: Vollständige CRUD-Operationen für alle Ressourcen
- ✅ **Middleware**: Error handling, Auth-Protection
- ✅ **In-Memory Performance**: Schnelle Operationen mit periodischem Sync

## Installation

```bash
cd server
npm install
```

## Konfiguration

Erstelle eine `.env` Datei basierend auf `.env.example`:

```bash
cp .env.example .env
```

Bearbeite die `.env` Datei:
```
PORT=8080
JWT_SECRET=dein-sicherer-secret-key
NODE_ENV=development
```

## Starten

```bash
npm start
```

Der Server läuft auf `http://localhost:8080`

## API-Endpunkte

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| POST | `/api/auth/register` | - | Neuen User registrieren |
| POST | `/api/auth/login` | - | Login und Token erhalten |
| GET | `/api/auth/me` | ✓ | Aktuellen User abrufen |
| PATCH | `/api/auth/me` | ✓ | Profil aktualisieren |
| GET | `/api/auth/:id` | - | User nach ID abrufen |
| GET | `/api/auth` | - | Alle Users abrufen (mit Filtern) |

**Register Request:**
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "password": "sicheres-passwort",
  "role": "customer"
}
```

**Login Request:**
```json
{
  "email": "max@example.com",
  "password": "sicheres-passwort"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-xxx",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Requests (`/api/requests`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| POST | `/api/requests` | ✓ | Neue Hilfe-Anfrage erstellen |
| GET | `/api/requests` | - | Alle Anfragen abrufen |
| GET | `/api/requests/my` | ✓ | Eigene Anfragen abrufen |
| GET | `/api/requests/:id` | - | Anfrage nach ID |
| PATCH | `/api/requests/:id` | ✓ | Anfrage aktualisieren |
| PATCH | `/api/requests/:id/status` | ✓ | Status aktualisieren |
| DELETE | `/api/requests/:id` | ✓ | Anfrage löschen |

**Create Request:**
```json
{
  "title": "Umzugshilfe benötigt",
  "description": "2-Zimmer Wohnung, 3. Stock ohne Aufzug",
  "category": "moving",
  "budget": 100,
  "location": "Berlin Mitte",
  "scheduledDate": "2025-01-15T10:00:00Z"
}
```

### Bookings (`/api/bookings`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| POST | `/api/bookings` | ✓ | Neue Buchung erstellen (Helper) |
| GET | `/api/bookings` | ✓ | Eigene Buchungen abrufen |
| GET | `/api/bookings/request/:requestId` | ✓ | Buchungen für Request |
| GET | `/api/bookings/:id` | ✓ | Buchung nach ID |
| PATCH | `/api/bookings/:id/status` | ✓ | Status aktualisieren |
| POST | `/api/bookings/:id/review` | ✓ | Bewertung hinzufügen |
| DELETE | `/api/bookings/:id` | ✓ | Buchung stornieren |

**Create Booking:**
```json
{
  "requestId": "req-xxx",
  "price": 85,
  "proposedDate": "2025-01-15T10:00:00Z"
}
```

**Add Review:**
```json
{
  "rating": 5,
  "review": "Sehr zuverlässig und freundlich!"
}
```

### Messages (`/api/messages`)

| Method | Endpoint | Auth | Beschreibung |
|--------|----------|------|--------------|
| POST | `/api/messages` | ✓ | Nachricht senden |
| GET | `/api/messages/booking/:bookingId` | ✓ | Nachrichten für Buchung |
| GET | `/api/messages/my` | ✓ | Alle eigenen Nachrichten |
| PATCH | `/api/messages/:id/read` | ✓ | Als gelesen markieren |
| POST | `/api/messages/booking/:bookingId/read-all` | ✓ | Alle als gelesen markieren |
| DELETE | `/api/messages/:id` | ✓ | Nachricht löschen |

**Send Message:**
```json
{
  "bookingId": "booking-xxx",
  "content": "Hallo, wann können wir starten?"
}
```

### AI Chat (`/api/ai/chat`)

Mock-Endpunkt für AI-Chat-Widget (keine Auth erforderlich).

## Authorization

Alle geschützten Endpunkte benötigen einen Bearer Token im Header:

```
Authorization: Bearer <your-jwt-token>
```

## Datenbank

Die JSON-Datenbank wird automatisch gespeichert:
- **Datei**: `server/data.json`
- **Auto-Save**: Alle 30 Sekunden
- **Beim Beenden**: Automatisch beim SIGINT/SIGTERM

### Datenstruktur

```json
{
  "users": [...],
  "requests": [...],
  "bookings": [...],
  "messages": [...]
}
```

## Error Handling

Alle Fehler werden als JSON zurückgegeben:

```json
{
  "error": "User not found"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 500: Internal Server Error

## Development

```bash
# Backend starten
npm start

# Beide Server starten (von Root-Dir)
npm run dev:full
```

## Testen

```bash
# User registrieren
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Request erstellen (mit Token)
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Umzug","description":"Hilfe benötigt","category":"moving","budget":100,"location":"Berlin"}'
```
