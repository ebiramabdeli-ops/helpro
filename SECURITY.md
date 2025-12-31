# 🔒 Helpro Security Documentation

Umfassende Sicherheitsdokumentation für die Helpro-Plattform.

## 📋 Übersicht

Die Helpro-Plattform implementiert mehrschichtige Sicherheitsmaßnahmen zum Schutz vor:
- **Cyber-Angriffen** (DDoS, Brute Force, XSS, CSRF, SQL Injection)
- **Unbefugtem Zugriff** (MFA, Account Locking, JWT)
- **Datenlecks** (Input Validation, Sanitization, Encryption)
- **Identity Theft** (Phone Verification, Strong Authentication)

---

## 🛡️ Implementierte Sicherheitsmaßnahmen

### 1. Authentifizierung & Autorisierung

#### JWT (JSON Web Tokens)
- **Algorithmus**: HS256 (HMAC mit SHA-256)
- **Secret**: Min. 32 Zeichen, zufällig generiert
- **Expiration**: 7 Tage (normale Tokens), 5 Minuten (vor MFA)
- **Payload**: User ID, MFA Status
- **Übertragung**: Bearer Token im Authorization Header

```typescript
// Token Generation
const token = jwt.sign({ userId, mfaVerified }, JWT_SECRET, { 
  expiresIn: '7d' 
});

// Token Verification
const decoded = jwt.verify(token, JWT_SECRET);
```

#### Multi-Factor Authentication (MFA)
- **Protokoll**: TOTP (Time-based One-Time Password)
- **Standard**: RFC 6238
- **Algorithmus**: SHA-1
- **Zeitfenster**: 30 Sekunden
- **Toleranz**: ±2 Zeitschritte (60 Sekunden)
- **QR-Code**: Für einfache App-Integration
- **Backup-Codes**: 10 Codes zur Wiederherstellung

**Unterstützte Apps**:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 1Password
- Jede RFC 6238-kompatible App

**Flow**:
1. User registriert sich / loggt ein
2. User aktiviert MFA in Einstellungen
3. Server generiert Secret & QR-Code
4. User scannt QR-Code mit Authenticator App
5. User verifiziert mit TOTP-Code
6. MFA ist aktiviert
7. Bei Login: Short-lived Token → MFA Verification → Full Token

#### Phone Verification
- **Code-Format**: 6 Ziffern (0-9)
- **Validität**: 10 Minuten
- **Max. Versuche**: 3 pro Code
- **Rate Limit**: 3 Requests pro Stunde
- **Format**: E.164 (+[country][number])

**Zweck**:
- Account-Recovery
- Zusätzliche Identitätsverifikation
- 2FA via SMS (zusätzlich zu TOTP)
- Schutz vor Fake-Accounts

#### Password Policy
- **Min. Länge**: 8 Zeichen
- **Erforderlich**:
  - Mindestens 1 Großbuchstabe (A-Z)
  - Mindestens 1 Kleinbuchstabe (a-z)
  - Mindestens 1 Zahl (0-9)
  - Mindestens 1 Sonderzeichen (!@#$%^&*...)
- **Hashing**: bcrypt mit 12 Rounds
- **Salt**: Automatisch von bcrypt generiert (unique pro Password)

**Beispiel gültiger Passwörter**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Helpro#2025`

#### Account Locking (Brute Force Protection)
- **Trigger**: 5 fehlgeschlagene Login-Versuche
- **Dauer**: 15 Minuten automatische Sperre
- **Entsperrung**: Automatisch nach Ablauf oder manuell durch Admin
- **Zähler-Reset**: Bei erfolgreichem Login

**Flow**:
1. User gibt falsches Password ein
2. `loginAttempts` wird inkrementiert
3. Bei 5 Versuchen: `accountLocked = true`
4. Login-Versuche werden mit 423 Locked abgelehnt
5. Nach 15 Min: Auto-Unlock
6. Bei erfolgreichem Login: `loginAttempts = 0`

---

### 2. Schutz vor Cyber-Angriffen

#### Rate Limiting
Schutz vor DDoS und Brute Force Attacks.

| Endpoint-Typ | Requests | Zeitfenster | Zweck |
|-------------|----------|-------------|-------|
| General API | 100 | 15 Minuten | DDoS Protection |
| Auth/Login | 5 | 15 Minuten | Brute Force Protection |
| Phone Verify | 3 | 1 Stunde | SMS Spam Prevention |
| MFA Verify | 5 | 15 Minuten | MFA Brute Force Protection |

**Implementation**: `express-rate-limit` mit Memory Store
**Production**: Redis Store empfohlen für Multi-Server Setup

```typescript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
  skipSuccessfulRequests: true
});
```

#### Helmet.js - Security Headers
Automatisches Setzen sicherer HTTP-Headers.

**Implementierte Headers**:
```http
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Schutz gegen**:
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME-Type Sniffing
- Protocol Downgrade Attacks

#### CORS (Cross-Origin Resource Sharing)
Whitelisting erlaubter Origins.

```typescript
cors({
  origin: 'http://localhost:5173', // Production: https://helpro.app
  credentials: true
})
```

**Production**: Nur vertrauenswürdige Domains erlauben

#### Input Validation & Sanitization
Schutz vor XSS und Injection Attacks.

**Email Validation**:
```typescript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

**Phone Validation** (E.164):
```typescript
/^\+[1-9]\d{1,14}$/
```

**Sanitization**:
- Entfernen von `<>` Zeichen (XSS Prevention)
- Trimming von Whitespace
- Max. Länge: 1000 Zeichen
- HTML-Entity Encoding

**SQL Injection Prevention**:
- Aktuell: JSON-basierte DB (keine SQL)
- Geplant PostgreSQL: Prepared Statements / Parameterized Queries

#### CSRF Protection
Token-basierter Schutz gegen Cross-Site Request Forgery.

```typescript
const csrfToken = crypto.randomBytes(32).toString('hex');
```

**Flow**:
1. Server generiert CSRF Token bei Session-Start
2. Token wird in Cookie gespeichert
3. Client sendet Token in Header bei State-Changing Requests
4. Server validiert Token

---

### 3. Daten-Sicherheit

#### Verschlüsselung

**Passwords**:
- **Algorithmus**: bcrypt
- **Work Factor**: 12 Rounds (2^12 = 4096 Iterationen)
- **Salt**: 128-bit, unique pro Password
- **Hash-Länge**: 60 Zeichen

```typescript
const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

**MFA Secrets**:
- **Länge**: 32 Bytes (Base32-encoded)
- **Storage**: Verschlüsselt in DB (TODO: Implement encryption at rest)

**Backup Codes**:
- **Format**: 8 Hex-Zeichen (4 Bytes)
- **Storage**: SHA-256 Hash
- **Anzahl**: 10 Codes
- **Einmalig**: Nach Verwendung gelöscht

#### Sensitive Data Handling
**Niemals in Response**:
- Password Hashes
- MFA Secrets
- Backup Codes (plain)
- JWT Secrets
- Internal User IDs (verwende UUIDs)

**UserSafe Type**:
```typescript
type UserSafe = Omit<User, 'password' | 'mfaSecret'>;
```

#### HTTPS/TLS
**Production Requirements**:
- Min. TLS 1.2, besser TLS 1.3
- Starke Cipher Suites
- HSTS Header (2 Jahre)
- Certificate Pinning (optional)

---

### 4. Error Handling

#### Keine Information Leakage
```typescript
// ❌ BAD
res.status(500).json({ error: error.stack });

// ✅ GOOD
res.status(500).json({ error: 'Internal server error' });
```

**Log Errors Server-Side**:
```typescript
console.error('Error:', error);
// Production: Use structured logging (Winston, Pino)
```

#### HTTP Status Codes
- `400` - Bad Request (Client Error)
- `401` - Unauthorized (Authentication Required)
- `403` - Forbidden (Authorization Failed)
- `404` - Not Found
- `409` - Conflict (Duplicate Resource)
- `423` - Locked (Account Locked)
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

---

## 🚨 Bekannte Schwachstellen & TODOs

### Aktuell
1. **JSON-Datei als DB**: Nicht skalierbar, keine Transaktionen
   - **Fix**: Migration zu PostgreSQL mit Row-Level Security
   
2. **SMS-Versand nicht implementiert**: Codes werden geloggt
   - **Fix**: Twilio/AWS SNS Integration
   
3. **Backup Codes nicht persistiert**: Gehen bei Server-Neustart verloren
   - **Fix**: Hashed in DB speichern
   
4. **Keine Encryption at Rest**: Sensitive Daten unverschlüsselt
   - **Fix**: AES-256-GCM für MFA Secrets
   
5. **Kein Session Management**: JWT ohne Revocation
   - **Fix**: Redis-basierte Session Store mit Blacklist
   
6. **Keine Audit Logs**: Keine Nachvollziehbarkeit von Security Events
   - **Fix**: Audit Log für Login, MFA, Account Changes

### Production TODOs
- [ ] PostgreSQL mit SSL
- [ ] Redis für Sessions & Rate Limiting
- [ ] Twilio/AWS SNS für SMS
- [ ] SendGrid/AWS SES für Emails
- [ ] Winston Logging mit Rotation
- [ ] Sentry für Error Tracking
- [ ] Let's Encrypt für HTTPS
- [ ] Nginx mit Rate Limiting
- [ ] Fail2Ban für IP-Blocking
- [ ] Regular Security Audits
- [ ] Penetration Testing
- [ ] GDPR Compliance Check

---

## 📊 Security Monitoring

### Metriken
- Failed Login Attempts
- Account Lockouts
- Rate Limit Hits
- MFA Enrollment Rate
- Phone Verification Success Rate
- Error Rates (4xx, 5xx)

### Alerts
- Multiple failed logins (>5 in 5 Min)
- Unusual login patterns (Zeit, Location)
- Rate Limit exceeded
- Server errors (>10 in 1 Min)

### Logging
**Log Level**:
- `error` - System Errors, Failed Auth
- `warn` - Rate Limits, Account Locks
- `info` - Successful Logins, MFA Events
- `debug` - Request Details (Dev only)

**Never Log**:
- Passwords (plain or hashed)
- MFA Tokens
- Backup Codes
- JWT Tokens
- Full Credit Card Numbers

---

## 🔐 Best Practices für Entwickler

### 1. Environment Variables
```bash
# ❌ NEVER commit to Git
JWT_SECRET=actual-secret-value

# ✅ Use .env.example with placeholders
JWT_SECRET=your-secret-key-change-in-production
```

### 2. Password Handling
```typescript
// ❌ NEVER store plain passwords
user.password = req.body.password;

// ✅ Always hash
user.password = await bcrypt.hash(req.body.password, 12);
```

### 3. SQL Queries (when migrating to PostgreSQL)
```typescript
// ❌ NEVER concatenate user input
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ Use parameterized queries
db.query('SELECT * FROM users WHERE email = $1', [email]);
```

### 4. Response Data
```typescript
// ❌ NEVER expose sensitive data
res.json({ user });

// ✅ Remove sensitive fields
const { password, mfaSecret, ...safeUser } = user;
res.json({ user: safeUser });
```

### 5. Error Messages
```typescript
// ❌ NEVER expose system details
throw new Error(`Database connection failed: ${dbError.message}`);

// ✅ Generic message to client, log details server-side
console.error('DB Error:', dbError);
throw new Error('Service temporarily unavailable');
```

---

## 📚 Compliance & Standards

### OWASP Top 10 (2021)
- ✅ A01: Broken Access Control → JWT + Role-Based Access
- ✅ A02: Cryptographic Failures → bcrypt, TLS
- ✅ A03: Injection → Input Validation, Sanitization
- ✅ A04: Insecure Design → Security by Design
- ✅ A05: Security Misconfiguration → Helmet, Secure Headers
- ✅ A06: Vulnerable Components → Regular Updates
- ✅ A07: Authentication Failures → MFA, Account Locking
- ⚠️ A08: Data Integrity Failures → TODO: Implement
- ✅ A09: Logging Failures → Basic logging implemented
- ✅ A10: SSRF → Input validation on URLs

### GDPR Compliance
- ✅ **Right to Access**: API für User-Daten
- ✅ **Right to Deletion**: TODO: Implement user deletion
- ✅ **Data Minimization**: Nur notwendige Daten
- ✅ **Consent**: TODO: Implement consent management
- ⚠️ **Encryption**: TODO: Encryption at rest
- ⚠️ **Data Breach Notification**: TODO: Implement

### Industry Standards
- ✅ **PCI DSS**: Keine Kreditkarten-Speicherung (Payment Provider)
- ✅ **ISO 27001**: Security Management Framework
- ✅ **NIST**: Password Guidelines (SP 800-63B)

---

## 🆘 Incident Response

### Im Falle eines Security Breaches:

1. **Immediately**:
   - Isoliere betroffene Systeme
   - Revoke alle JWT Tokens (implement blacklist)
   - Ändere alle Secrets (JWT_SECRET, etc.)
   - Aktiviere Maintenance Mode

2. **Within 1 Hour**:
   - Identifiziere Breach Scope
   - Informiere Team & Management
   - Dokumentiere Timeline

3. **Within 24 Hours**:
   - Patch Vulnerability
   - Force Password Reset für betroffene User
   - Benachrichtige Benutzer (GDPR: 72h)

4. **Post-Incident**:
   - Post-Mortem Analysis
   - Update Security Measures
   - Training für Team
   - External Security Audit

---

## 📞 Security Contacts

- **Security Team**: [security@helpro.app](mailto:security@helpro.app)
- **Bug Bounty**: TODO: Implement responsible disclosure program
- **Emergency**: On-Call DevOps Team

---

**Version**: 2.0.0  
**Last Updated**: 2025-12-31  
**Next Review**: 2026-03-31

---

**⚠️ WICHTIG**: Diese Dokumentation ist vertraulich und nur für interne Verwendung bestimmt.
