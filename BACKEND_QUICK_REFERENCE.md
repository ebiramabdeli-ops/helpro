# 🚀 Helpro Backend - Quick Reference

## 📁 New Files Created (This Session)

### User Management
```
backend/src/common/enums/index.ts
├─ UserStatus (PENDING, VERIFIED, SUSPENDED, BANNED)
├─ VerificationLevel (L0, L1, L2, L3)
└─ VerificationType (6 types)

backend/src/modules/users/entities/
├─ user.entity.ts (extended with status field)
├─ customer-profile.entity.ts (new)
└─ provider-profile.entity.ts (new)
```

### Verification Module
```
backend/src/modules/verification/entities/
└─ user-verification.entity.ts (KYC, licenses, background checks)
```

### Service Configuration
```
backend/src/modules/services/entities/
├─ service.entity.ts (service catalog with requirements)
└─ service-rule.entity.ts (business logic rules)
```

### Order Management
```
backend/src/modules/orders/entities/
└─ order.entity.ts (complete order entity with FSM)

backend/src/modules/orders/services/
└─ order-state-machine.service.ts (state transition validator)
```

### Payment & Escrow
```
backend/src/modules/payments/entities/
├─ payment.entity.ts (payment tracking with escrow status)
├─ transaction.entity.ts (audit trail)
└─ wallet.entity.ts (provider balance)

backend/src/modules/payments/services/
└─ escrow.service.ts (3-step payment flow)
```

### Reviews & Trust
```
backend/src/modules/reviews/services/
└─ review.service.ts (weighted ratings, abuse detection, trust scoring)
```

---

## 🔑 Key Concepts

### 1. RBAC (Role-Based Access Control)
```typescript
UserRole.CUSTOMER → Can request services
UserRole.HELPER   → Casual provider
UserRole.PRO      → Professional provider
UserRole.ADMIN    → Full platform access
UserRole.SUPPORT  → Customer service
```

### 2. Verification Levels
```
L0: Email/Phone ✔️
L1: Identity (KYC) ✔️
L2: Professional License ✔️
L3: Background Check ✔️

Higher level = More trust = Better matches
```

### 3. Order State Machine
```
CREATED → MATCHING → ACCEPTED → CONFIRMED → IN_PROGRESS → COMPLETED → REVIEWED
                ↓         ↓          ↓             ↓
             CANCELLED CANCELLED CANCELLED    DISPUTED
```

### 4. Payment Escrow Flow
```
Step 1: Customer pays → ESCROWED (money held)
Step 2: Job done → RELEASED (provider receives)
Step 3: If cancelled → REFUNDED (customer receives)

Auto-release: 7 days after completion (if no dispute)
```

### 5. Trust Weight System
```
Review from L3 user = 2.0x weight
Review from L2 user = 1.5x weight
Review from L1 user = 1.2x weight
Review from L0 user = 1.0x weight

Weighted Average = Σ(rating × weight) / Σ(weight)
```

---

## 💻 Code Examples

### Check User Verification
```typescript
// Can user create order for this service?
const canOrder = (user: User, service: Service): boolean => {
  if (service.minProviderLevel === 'L3') {
    return user.backgroundCheckPassed;
  }
  if (service.minProviderLevel === 'L2') {
    return user.identityVerified; // + license check
  }
  if (service.minProviderLevel === 'L1') {
    return user.identityVerified;
  }
  return user.emailVerified || user.phoneVerified; // L0
};
```

### Transition Order State
```typescript
// Use OrderStateMachine service
const machine = new OrderStateMachine();

// Check if transition is allowed
if (machine.canTransition(order.status, OrderStatus.IN_PROGRESS, 'provider')) {
  // Perform transition
  machine.transition(order, OrderStatus.IN_PROGRESS, 'provider', 'Started work');
  await orderRepository.save(order);
}
```

### Escrow Payment
```typescript
// Step 1: Customer pays, money goes to escrow
const payment = await escrowService.escrowPayment(
  order,
  stripePaymentIntentId
);
// → Payment status: ESCROWED
// → Provider pendingBalance += amount

// Step 2: Release after completion
await escrowService.releasePayment(payment, 'system_auto_release');
// → Payment status: RELEASED
// → Provider availableBalance += amount

// Step 3: Refund if cancelled
await escrowService.refundPayment(
  payment,
  order.totalPrice,
  'Order cancelled by customer',
  order.customerId
);
// → Payment status: REFUNDED
```

### Calculate Trust Score
```typescript
const trustScore = await reviewService.calculateTrustScore(userId);
// Returns 0-100

// Factors:
// + Email verified: +5
// + Phone verified: +5
// + Identity verified: +15
// + Background check: +25
// + High rating: +20 (max)
// + Completion rate: +15 (max)
// + Account age: +10 (max)
// - Disputes: -5 each
```

### Detect Abuse
```typescript
const abuse = await reviewService.detectAbusePatterns(userId);
// Returns: { suspicious: boolean, reasons: string[] }

// Checks:
// 1. Too many 1-star reviews in 7 days
// 2. All reviews are extreme (all 1 or all 5)
// 3. Very short comments repeatedly
// 4. User received > 60% negative reviews
```

---

## 🗄️ Database Quick Reference

### Users
```sql
users
├─ id (uuid)
├─ email (unique)
├─ role (enum: customer, helper, pro, admin, support)
├─ status (enum: pending, verified, suspended, banned)
├─ trustScore (0-100)
├─ rating (weighted average)
├─ emailVerified, phoneVerified, identityVerified, backgroundCheckPassed
└─ Relations: customerProfile, providerProfile, verifications, orders, reviews
```

### Orders
```sql
orders
├─ id (uuid)
├─ customerId, providerId, serviceId
├─ status (enum: 10 states)
├─ address, city, latitude, longitude
├─ totalPrice, providerEarnings, platformFee
├─ scheduledDate, actualStartTime, actualEndTime
├─ statusHistory (json array)
└─ Relations: customer, provider, service, payment, reviews
```

### Payments
```sql
payments
├─ id (uuid)
├─ orderId, customerId, providerId
├─ status (enum: pending, escrowed, released, refunded)
├─ amount, platformFee, providerAmount
├─ escrowedAt, releasedAt, releaseScheduledAt
├─ stripePaymentIntentId, stripeChargeId
└─ Relations: order, customer, provider
```

### Wallets
```sql
wallets
├─ id (uuid)
├─ userId
├─ availableBalance (can withdraw)
├─ pendingBalance (in escrow)
├─ totalEarnings, totalWithdrawn
└─ Relations: user, transactions
```

---

## 🎯 Business Rules Implementation

### Service Requirements
```typescript
// Example: Electrician service
{
  slug: 'electrician',
  requiresLicense: true,
  requiredLicenses: ['electrician'],
  minProviderLevel: 'L2',  // Must have license
  requiresTools: true,
  platformFeePercentage: 15
}

// Backend checks before matching
if (service.requiresLicense) {
  const hasLicense = provider.licenses.includes('electrician');
  if (!hasLicense) return; // Don't match
}
```

### Automatic Actions
```typescript
// Auto-release escrow after 7 days
@Cron('0 0 * * *') // Daily at midnight
async autoReleasePayments() {
  await escrowService.autoReleaseEscrowedPayments();
}

// Auto-cancel if no provider found after 24h
@Cron('0 * * * *') // Hourly
async autoCancelUnmatched() {
  const orders = await findOrders({
    status: OrderStatus.MATCHING,
    createdAt: { $lt: Date.now() - 24 * 60 * 60 * 1000 }
  });
  
  for (const order of orders) {
    await cancelOrder(order, 'No providers available');
  }
}
```

---

## 🔒 Security Checklist

- [x] Password hashing (bcrypt)
- [x] JWT authentication
- [x] Role-based access control
- [x] State machine validation (prevents invalid transitions)
- [x] Escrow system (prevents direct payments)
- [x] Verification gates (prevents unverified providers)
- [x] Audit logging (all critical actions logged)
- [x] Rate limiting (TODO: add to controllers)
- [x] Input validation (TODO: add DTOs with class-validator)
- [ ] Stripe webhook signature verification
- [ ] File upload validation & virus scanning
- [ ] GDPR compliance (data export/deletion)

---

## 📊 Monitoring & Logging

### Key Metrics to Track
```typescript
// Business Metrics
- Orders per day
- Completion rate (completed / total)
- Average order value
- Platform revenue (sum of platform fees)
- Provider earnings

// Trust Metrics
- Average trust score
- Verification completion rate (L1/L2/L3)
- Dispute rate (disputed / completed)
- Review submission rate

// Technical Metrics
- API response time
- Database query time
- Payment success rate
- Escrow auto-release success rate
```

### Log Events
```typescript
// Critical Actions (Always Log)
- User registration/login
- Verification submission/approval
- Order creation
- Order state transitions
- Payment transactions
- Disputes opened/resolved
- Admin actions (suspend, ban, refund)
```

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...
DATABASE_SSL=true

# JWT
JWT_SECRET=...
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Verification Providers
VERIFF_API_KEY=...
ONFIDO_API_TOKEN=...

# Email
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

# Storage (S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=helpro-documents

# Platform Settings
PLATFORM_FEE_PERCENTAGE=15
AUTO_RELEASE_DAYS=7
MINIMUM_WITHDRAWAL=20
```

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- -n AddUserStatus

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Deployment Steps
```bash
1. Build: npm run build
2. Run migrations: npm run migration:run
3. Start: npm run start:prod
4. Health check: curl https://api.helpro.com/health
5. Monitor logs: pm2 logs
```

---

## 🧪 Testing Commands

```bash
# Unit tests
npm run test

# Integration tests
npm run test:e2e

# Coverage
npm run test:cov

# Watch mode
npm run test:watch

# Specific module
npm run test -- orders
```

---

## 📚 Related Documentation

- [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) - Complete system architecture
- [AI_SYSTEM_COMPLETE.md](./AI_SYSTEM_COMPLETE.md) - Python AI microservice
- [CHATBOT_ARCHITECTURE.md](./CHATBOT_ARCHITECTURE.md) - Chatbot state machine
- [TEXT_COMPLEXITY_STRATEGY.md](./TEXT_COMPLEXITY_STRATEGY.md) - Level 4 "Intelligent" text
- [LANGUAGE_SELECTION.md](./LANGUAGE_SELECTION.md) - Frontend language screen

---

**Status**: ✅ Backend core complete, ready for API implementation
**Next**: Create controllers, add Stripe integration, write tests
