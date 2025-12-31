# Helpro API Server - Security Enhanced 🔒

Sicherer TypeScript-basierter API-Server mit MFA, Telefon-Verifizierung und umfassenden Sicherheitsmaßnahmen.

## 🔐 Sicherheitsfeatures

### Authentifizierung & Autorisierung
- ✅ **JWT Authentication** mit sicheren Tokens
- ✅ **Multi-Factor Authentication (MFA)** mit TOTP (Google Authenticator, etc.)
- ✅ **Phone Verification** mit SMS-Codes
- ✅ **Password Policy Enforcement** (Min. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen)
- ✅ **Account Locking** nach 5 fehlgeschlagenen Login-Versuchen (15 Min. Sperre)
- ✅ **Backup Codes** für MFA-Wiederherstellung

### Schutz vor Angriffen
- ✅ **Rate Limiting** (General: 100 req/15min, Login: 5 req/15min)
- ✅ **Helmet.js** für sichere HTTP-Headers
- ✅ **CORS** mit Whitelist-Konfiguration
- ✅ **Input Validation & Sanitization** gegen XSS
- ✅ **SQL Injection Prevention** (Parameter-basierte Queries)
- ✅ **Brute Force Protection** mit Account Locking
- ✅ **CSRF Protection** (Token-basiert)

### Best Practices
- ✅ **bcrypt** für Password Hashing (12 Rounds)
- ✅ **Secure Headers** (X-Content-Type-Options, X-Frame-Options, HSTS)
- ✅ **Error Handling** ohne sensitive Information Leakage
- ✅ **Request Size Limits** (10MB)
- ✅ **TypeScript** für Type Safety

## 🚀 Installation

```bash
cd server

# Dependencies installieren
npm install

# Environment konfigurieren
cp .env.example .env
# Bearbeite .env und setze JWT_SECRET!

# Development starten
npm run dev

# Production Build
npm run build
npm start
```

## 📡 API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "password": "SecurePass123!",
  "role": "customer",
  "phone": "+491234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "max@example.com",
  "password": "SecurePass123!"
}

# Response (wenn MFA aktiviert):
{
  "requireMFA": true,
  "token": "short-lived-token",
  "message": "MFA verification required"
}
```

#### Verify MFA
```http
POST /api/auth/verify-mfa
Authorization: Bearer <short-lived-token>
Content-Type: application/json

{
  "token": "123456"
}
```

### Phone Verification

#### Request Verification Code
```http
POST /api/auth/phone/request-verification
Authorization: Bearer <token>
Content-Type: application/json

{
  "phone": "+491234567890"
}

# Response:
{
  "message": "Verification code sent to your phone",
  "code": "123456"  // Nur in Development!
}
```

#### Verify Phone
```http
POST /api/auth/phone/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

### MFA Setup

#### Setup MFA
```http
POST /api/auth/mfa/setup
Authorization: Bearer <token>

# Response:
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,...",
  "backupCodes": ["ABCD1234", "EFGH5678", ...],
  "message": "Scan the QR code with your authenticator app"
}
```

#### Enable MFA
```http
POST /api/auth/mfa/enable
Authorization: Bearer <token>
Content-Type: application/json

{
  "secret": "JBSWY3DPEHPK3PXP",
  "token": "123456"
}
```

#### Disable MFA
```http
POST /api/auth/mfa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "SecurePass123!",
  "token": "123456"
}
```

## 🔒 Sicherheitsrichtlinien

### Password Requirements
- Mindestens 8 Zeichen
- Mindestens 1 Großbuchstabe
- Mindestens 1 Kleinbuchstabe
- Mindestens 1 Zahl
- Mindestens 1 Sonderzeichen

### Rate Limits
- **General API**: 100 Requests pro 15 Minuten
- **Login**: 5 Versuche pro 15 Minuten
- **Phone Verification**: 3 Requests pro Stunde
- **MFA Verification**: 5 Versuche pro 15 Minuten

### Account Locking
- Nach 5 fehlgeschlagenen Login-Versuchen
- Automatische Entsperrung nach 15 Minuten
- Manuelle Entsperrung durch Admin möglich

### Phone Verification
- 6-stelliger Code
- Gültig für 10 Minuten
- Max. 3 Verifizierungsversuche

## 🛡️ Production Checklist

- [ ] **JWT_SECRET** auf starken, zufälligen Wert setzen (min. 32 Zeichen)
- [ ] **NODE_ENV=production** setzen
- [ ] **CORS_ORIGIN** auf Production-Domain setzen
- [ ] **HTTPS** verwenden (Let's Encrypt)
- [ ] **SMS Provider** konfigurieren (Twilio, AWS SNS, etc.)
- [ ] **Email Provider** konfigurieren für Notifications
- [ ] **Database** auf PostgreSQL migrieren (aktuell JSON-basiert)
- [ ] **Logging** implementieren (Winston, Pino)
- [ ] **Monitoring** einrichten (Sentry, DataDog, etc.)
- [ ] **Backup Strategy** für data.json implementieren
- [ ] **Firewall** konfigurieren (nur notwendige Ports öffnen)
- [ ] **Reverse Proxy** verwenden (Nginx, Caddy)
- [ ] **Docker Secrets** für sensible Daten verwenden

## 📊 Monitoring & Logging

```http
GET /api/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-12-31T04:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## 🔧 Development

```bash
# TypeScript compilation check
npm run typecheck

# Build für Production
npm run build

# Clean dist folder
npm run clean
```

## 📝 Migration von JavaScript

Die alte JavaScript-Version befindet sich noch in den Root-Dateien:
- `index.js` → `src/index.ts`
- `database.js` → `src/database.ts`
- `middleware/auth.js` → `src/middleware/auth.ts`
- `routes/auth.js` → `src/routes/auth.ts`

Alle neuen Features sind nur in der TypeScript-Version verfügbar.

## 🚨 Known Issues

- SMS-Versand noch nicht implementiert (Code wird in Console geloggt)
- Email-Benachrichtigungen noch nicht implementiert
- Backup-Codes werden nicht persistiert
- JSON-Datenbank nicht Production-ready (PostgreSQL empfohlen)

## 📚 Dependencies

### Core
- `express` - Web Framework
- `typescript` - Type Safety
- `tsx` - TypeScript Execution

### Security
- `helmet` - Security Headers
- `cors` - CORS Configuration
- `express-rate-limit` - Rate Limiting
- `bcryptjs` - Password Hashing
- `jsonwebtoken` - JWT Authentication

### MFA & Verification
- `speakeasy` - TOTP Generation
- `qrcode` - QR Code Generation

## 📞 Support

Bei Fragen oder Problemen, kontaktiere das Development-Team.

---

**⚠️ WICHTIG**: Niemals Secrets oder Credentials in Git committen!
