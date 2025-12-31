# Helpro Backend - Production-Ready Architecture

## 🏗️ Architecture Overview

This is a **modular monolith** backend built with NestJS, designed to scale to microservices later.

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│              (Auth, Rate Limit, Logging)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────▼────┐                    ┌────▼────┐
    │  REST   │                    │WebSocket│
    │   API   │                    │  (Chat) │
    └────┬────┘                    └────┬────┘
         │                              │
┌────────┴──────────────────────────────┴─────────┐
│              Backend Core Modules                │
├──────────────────────────────────────────────────┤
│ ✓ Auth & Identity (JWT + RBAC)                 │
│ ✓ Users & Roles (Customer/Helper/Pro/Admin)    │
│ ✓ Tasks/Jobs Engine (State Machine)            │
│ ✓ Matching & Optimization (AI Core)            │
│ ✓ Verification & Trust Score                   │
│ ✓ Payments & Escrow (Stripe)                   │
│ ✓ Messaging & Notifications                    │
│ ✓ Reviews & Reputation                         │
│ ✓ Disputes & Support                           │
│ ✓ Admin/Ops Dashboard API                      │
└─────────────────┬────────────────────────────────┘
                  │
      ┌───────────┴──────────────┐
      │                          │
 ┌────▼─────┐            ┌──────▼────┐
 │PostgreSQL│            │   Redis   │
 │          │            │ + BullMQ  │
 └──────────┘            └───────────┘
```

## 📦 Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Framework** | NestJS (TypeScript) | Enterprise architecture, DI, modularity |
| **Database** | PostgreSQL | Primary data store |
| **Cache/Queue** | Redis + BullMQ | Caching, background jobs |
| **ORM** | TypeORM | Database abstraction |
| **Auth** | JWT + Passport | Authentication & authorization |
| **Payments** | Stripe | Payment processing & escrow |
| **WebSockets** | Socket.io | Real-time messaging |

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── common/
│   │   ├── decorators/       # Custom decorators (Roles, etc.)
│   │   ├── guards/           # Auth guards, RBAC
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Logging, transform
│   │   ├── pipes/            # Validation pipes
│   │   └── enums/            # Shared enums
│   │
│   ├── config/               # Configuration modules
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── stripe.config.ts
│   │
│   ├── modules/
│   │   ├── auth/             # Authentication & JWT
│   │   ├── users/            # User management & RBAC
│   │   ├── tasks/            # Task/Job engine
│   │   ├── matching/         # Matching & optimization (AI)
│   │   ├── verification/     # Trust & verification
│   │   ├── payments/         # Stripe & escrow
│   │   ├── messaging/        # Chat & notifications
│   │   ├── reviews/          # Reviews & ratings
│   │   ├── disputes/         # Dispute resolution
│   │   ├── admin/            # Admin dashboard API
│   │   └── notifications/    # Push, SMS, Email
│   │
│   ├── database/
│   │   ├── migrations/       # TypeORM migrations
│   │   └── seeds/            # Database seeds
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── test/                     # E2E tests
├── .env.example
├── package.json
└── README.md
```

## 🔐 RBAC (Role-Based Access Control)

### Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `customer` | Regular users needing help | Create tasks, rate helpers |
| `helper` | Service providers | Accept tasks, complete work |
| `pro` | Verified professionals | Higher trust, better matching |
| `admin` | Platform administrators | Full access, user management |
| `support` | Support agents | Handle disputes, messaging |

### Implementation

```typescript
// In controller:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Get('admin/users')
getUsers() {}

// In guard:
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role === role);
  }
}
```

## 🎯 Core Modules

### 1. Auth & Identity

**Files**: `src/modules/auth/`

- JWT-based authentication
- Refresh token support
- Password reset flow
- 2FA (planned)

**Endpoints**:
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### 2. Users & Roles

**Files**: `src/modules/users/`

- User CRUD
- Profile management
- Role assignment
- Helper availability

**Endpoints**:
```
GET    /api/users/me
PATCH  /api/users/me
GET    /api/users/:id
GET    /api/users/:id/reviews
PATCH  /api/users/:id/availability
```

### 3. Tasks/Jobs Engine

**Files**: `src/modules/tasks/`

**Task State Machine**:
```
CREATED → MATCHING → ASSIGNED → IN_PROGRESS → COMPLETED
           ↓            ↓            ↓
       CANCELLED    CANCELLED    DISPUTED
```

**Endpoints**:
```
POST   /api/tasks
GET    /api/tasks
GET    /api/tasks/:id
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/accept (helper)
POST   /api/tasks/:id/start
POST   /api/tasks/:id/complete
```

### 4. Matching & Optimization Engine ⭐ (AI Core)

**Files**: `src/modules/matching/`

**Algorithm**:
```typescript
Score = 
  (trust_score × 0.4) +
  (distance_score × 0.3) +
  (availability_score × 0.2) +
  (price_fit × 0.1)
```

**No ML/LLM needed - pure algorithmic optimization**

**Process**:
1. Task created → Queue job
2. Find available helpers in radius
3. Calculate scores
4. Rank candidates
5. Notify top 3
6. Auto-assign after timeout

### 5. Verification & Trust Score

**Files**: `src/modules/verification/`

**Trust Score Formula**:
```typescript
trustScore = 
  (identity_verified × 25) +
  (completed_jobs × 30) +
  (avg_rating × 25) +
  (on_time_ratio × 10) +
  (dispute_ratio × -10)
```

**Verification Types**:
- Email verification
- Phone (SMS)
- ID document upload
- Background check (3rd party)
- Professional licenses

### 6. Payments & Escrow

**Files**: `src/modules/payments/`

**Escrow Flow**:
```
1. Customer pays → Stripe escrow
2. Task assigned → Funds held
3. Task completed → Release to helper
4. Platform fee deducted (15%)
```

**Endpoints**:
```
POST /api/payments/create-intent
POST /api/payments/confirm
POST /api/payments/refund
GET  /api/payments/history
```

### 7. Messaging

**Files**: `src/modules/messaging/`

- WebSocket-based real-time chat
- Push notifications
- Read receipts
- File uploads

**WebSocket Events**:
```
message:send
message:received
message:read
typing:start
typing:stop
```

### 8. Reviews & Reputation

**Files**: `src/modules/reviews/`

**2-Way Reviews**:
- Customer reviews Helper
- Helper reviews Customer

**Fraud Detection**:
- Rate limiting
- Duplicate detection
- Trust-weighted reviews

### 9. Admin Dashboard API

**Files**: `src/modules/admin/`

**Admin Powers**:
- View all tasks (live map)
- User management
- Ban/unban users
- Manual task reassignment
- Payment intervention
- Dispute resolution
- Analytics dashboard

**Endpoints**:
```
GET    /api/admin/dashboard
GET    /api/admin/users
PATCH  /api/admin/users/:id/ban
GET    /api/admin/tasks
PATCH  /api/admin/tasks/:id/reassign
GET    /api/admin/payments
POST   /api/admin/payments/:id/refund
GET    /api/admin/analytics
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Users
users (id, email, password, role, trust_score, rating, ...)

-- Tasks
tasks (id, customer_id, helper_id, status, category, location, ...)

-- Reviews
reviews (id, task_id, reviewer_id, reviewed_id, rating, ...)

-- Payments
payments (id, task_id, amount, status, stripe_id, ...)

-- Messages
messages (id, task_id, sender_id, content, ...)

-- Verifications
verifications (id, user_id, type, status, ...)

-- Disputes
disputes (id, task_id, reason, status, ...)
```

## 🚀 Development

### Setup

```bash
# Install dependencies
cd backend
npm install

# Setup PostgreSQL
docker run --name helpro-db -e POSTGRES_PASSWORD=helpro -p 5432:5432 -d postgres

# Setup Redis
docker run --name helpro-redis -p 6379:6379 -d redis

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Available Scripts

```bash
npm run start:dev      # Development with watch mode
npm run build          # Production build
npm run start:prod     # Production server
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run migration:generate  # Generate migration
npm run migration:run       # Run migrations
```

## 📊 Monitoring & Logging

- Winston for logging
- Sentry for error tracking (planned)
- Prometheus metrics (planned)
- Health check endpoint: `/api/health`

## 🔒 Security

- ✅ JWT authentication
- ✅ RBAC authorization
- ✅ Rate limiting (per endpoint)
- ✅ Input validation (class-validator)
- ✅ SQL injection protection (TypeORM)
- ✅ XSS protection
- ✅ CORS enabled
- ✅ Helmet.js (planned)
- ✅ HTTPS only in production

## 📈 Scaling Strategy

### Current (MVP)
- Single NestJS monolith
- PostgreSQL
- Redis

### Phase 2
- Horizontal scaling (load balancer)
- Read replicas
- CDN for static assets

### Phase 3
- Microservices extraction:
  - Matching service
  - Payment service
  - Notification service
- Event-driven architecture
- Kubernetes deployment

## 🌍 Multi-Country Support

Ready for expansion to EU/Scandinavia:

- Currency handling
- Country-specific verification rules
- Localized content
- Timezone handling
- GDPR compliance

## 📝 Next Steps

1. ✅ Complete all module implementations
2. ⬜ Write unit tests (80%+ coverage)
3. ⬜ E2E testing
4. ⬜ API documentation (Swagger)
5. ⬜ Docker Compose setup
6. ⬜ CI/CD pipeline
7. ⬜ Production deployment guide

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Stripe API](https://stripe.com/docs/api)
- [BullMQ Documentation](https://docs.bullmq.io/)

---

**Built for**: Trust-first, operations-focused helping platform  
**Not**: ChatGPT clone or AI hype project  
**Philosophy**: Rules > ML, Operations > Features, Simple > Fancy
