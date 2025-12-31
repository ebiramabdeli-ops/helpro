# Helpro - Vollständiges Backend Setup

## ✅ Fertiggestellt

Ich habe ein vollständiges Express.js Backend für Helpro erstellt mit:

### Features

1. **Authentifizierung & Authorization**
   - JWT-Token-basierte Auth
   - bcrypt Password-Hashing
   - Auth-Middleware für geschützte Routen

2. **Persistente JSON-Datenbank**
   - Auto-Save alle 30 Sekunden
   - Speicherung in `server/data.json`
   - In-Memory Operationen für Performance

3. **Vollständige REST API**
   - `/api/auth/*` - Registrierung, Login, User-Management
   - `/api/requests/*` - Hilfe-Anfragen (CRUD)
   - `/api/bookings/*` - Buchungen mit Reviews
   - `/api/messages/*` - Messaging-System
   - `/api/ai/chat` - AI-Chat (existing mock)

4. **Datenmodelle**
   - Users (Customer & Helper Rollen)
   - Requests (Status-Management)
   - Bookings (mit Rating-System)
   - Messages (Read-Status)

### Dateistruktur

```
server/
├── index.js              # Hauptserver mit allen Routen
├── database.js           # JSON-basierte Datenbanklogik
├── .env.example          # Environment-Variablen Template
├── package.json          # Dependencies
├── README.md             # Ausführliche API-Dokumentation
├── middleware/
│   ├── auth.js          # JWT Auth & Middleware
│   └── errorHandler.js  # Error Handling
├── models/
│   ├── User.js          # User-Model mit bcrypt
│   ├── Request.js       # Request-Model
│   ├── Booking.js       # Booking-Model
│   └── Message.js       # Message-Model
└── routes/
    ├── auth.js          # Auth-Endpunkte
    ├── requests.js      # Request-Endpunkte
    ├── bookings.js      # Booking-Endpunkte
    └── messages.js      # Message-Endpunkte
```

### Server läuft

Der Server läuft bereits auf **http://localhost:8080**

### Nächste Schritte

1. **Frontend anpassen**: Das Frontend muss die neuen API-Endpunkte verwenden
2. **Environment-Variablen**: `.env` Datei erstellen (siehe `.env.example`)
3. **Test-Daten**: Über `/api/auth/register` Users erstellen

### Beispiel-Requests

```bash
# User registrieren
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Request erstellen (mit Token aus Login)
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title":"Umzugshilfe",
    "description":"2-Zimmer Wohnung, 3. Stock",
    "category":"moving",
    "budget":100,
    "location":"Berlin"
  }'
```

### API-Dokumentation

Siehe [server/README.md](server/README.md) für vollständige API-Dokumentation.

### Vorteile dieses Setups

✅ Keine Datenbank-Installation erforderlich  
✅ Schnelle In-Memory-Operationen  
✅ Automatische Persistenz  
✅ Vollständige Type-Safety durch Models  
✅ Production-ready Error Handling  
✅ JWT-basierte Security  
✅ Skalierbar (später einfach auf echte DB migrieren)
