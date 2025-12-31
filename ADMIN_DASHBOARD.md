# 🛡️ ADMIN DASHBOARD – INTERNAL CONTROL SYSTEM

**Secure, internal-only dashboard for platform management**

---

## ✅ What Admin Dashboard Means (CRITICAL)

### ❌ Admin Dashboard is NOT:
- ❌ Public website
- ❌ Visible to customers
- ❌ Visible to helpers
- ❌ Part of public app UI

### ✅ Admin Dashboard IS:
- ✅ Internal control system
- ✅ Accessible only after admin login
- ✅ Connected to backend with **admin permissions**
- ✅ Separate URL (e.g., `admin.helpro.com`)
- ✅ Protected by role-based access control (RBAC)

---

## 🧱 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC USERS                          │
│          (Customers + Helpers)                           │
│                                                           │
│  Mobile App (iOS/Android) + Web App (helpro.com)        │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│              BACKEND API (NestJS)                        │
│                Port 3000                                  │
│                                                           │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  Public Routes   │  │  Admin Routes    │            │
│  │  (USER token)    │  │  (ADMIN token)   │            │
│  └──────────────────┘  └──────────────────┘            │
└───────────────┬─────────────────────────────────────────┘
                │                     ▲
                ▼                     │
┌─────────────────────────────┐     │
│  PostgreSQL Database         │     │
│  (Users, Orders, Payments)   │     │
└─────────────────────────────┘     │
                                     │
                ┌────────────────────┘
                │
┌───────────────┴─────────────────────────────────────────┐
│              ADMIN DASHBOARD                             │
│          (admin.helpro.com)                              │
│                                                           │
│  Only accessible with:                                   │
│  ✅ Admin account                                        │
│  ✅ Admin role (SUPER_ADMIN / SUPPORT / FINANCE)        │
│  ✅ Valid admin token (JWT with role claim)             │
└─────────────────────────────────────────────────────────┘
```

**Key Principle:**  
Users NEVER see admin dashboard.  
Admins NEVER use public app UI.

---

## 🔐 Access Control (CRITICAL)

### 1. Separate URL

**Public App:**
```
https://helpro.com              (customer/helper UI)
https://app.helpro.com          (mobile web app)
```

**Admin Dashboard:**
```
https://admin.helpro.com        (internal only)
```

### 2. Admin Roles (5 Levels)

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',    // Full control
  SUPPORT_ADMIN = 'support_admin', // Support tickets, disputes
  FINANCE_ADMIN = 'finance_admin', // Payments, refunds
  MODERATOR = 'moderator',         // Content moderation
  VIEWER = 'viewer',               // Read-only access
}
```

**Permission Matrix:**

| Action | SUPER_ADMIN | SUPPORT_ADMIN | FINANCE_ADMIN | MODERATOR | VIEWER |
|--------|-------------|---------------|---------------|-----------|--------|
| View all users | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ban users | ✅ | ✅ | ❌ | ✅ | ❌ |
| View orders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cancel orders | ✅ | ✅ | ❌ | ❌ | ❌ |
| View payments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Process refunds | ✅ | ❌ | ✅ | ❌ | ❌ |
| View AI decisions | ✅ | ✅ | ❌ | ❌ | ✅ |
| Override AI | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage languages | ✅ | ❌ | ❌ | ✅ | ❌ |
| View system logs | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modify settings | ✅ | ❌ | ❌ | ❌ | ❌ |

### 3. Authentication Flow

```typescript
// Admin Login Flow
1. Admin enters email/password at admin.helpro.com/login
2. Backend verifies credentials
3. Backend checks role (must be admin role)
4. Backend generates JWT with admin claims:
   {
     userId: 'admin_123',
     email: 'admin@helpro.com',
     role: 'super_admin',
     permissions: ['view_users', 'ban_users', 'view_payments', ...]
   }
5. Admin dashboard stores token
6. All requests include token in Authorization header
7. Backend middleware validates:
   - Token valid?
   - Role = admin?
   - Permission matches route?
```

**Security Enforcement:**

```typescript
// backend/src/guards/admin.guard.ts

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // From JWT

    // Must have admin role
    const adminRoles = [
      UserRole.SUPER_ADMIN,
      UserRole.SUPPORT_ADMIN,
      UserRole.FINANCE_ADMIN,
      UserRole.MODERATOR,
    ];

    if (!adminRoles.includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}

// Usage on routes:
@Get('/admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
async getAllUsers() {
  // Only accessible with admin token
}
```

### 4. Two-Factor Authentication (Recommended)

**For SUPER_ADMIN and FINANCE_ADMIN:**
- Enable 2FA (TOTP via Authenticator app)
- Required on every login
- Backup codes for recovery

**Implementation:**
```bash
npm install otplib qrcode
```

```typescript
// backend/src/modules/auth/two-factor.service.ts

import { authenticator } from 'otplib';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string): string {
    return authenticator.generateSecret();
  }

  verifyToken(secret: string, token: string): boolean {
    return authenticator.verify({ token, secret });
  }

  generateQRCode(email: string, secret: string): string {
    return authenticator.keyuri(email, 'Helpro Admin', secret);
  }
}
```

---

## 🧠 Why This Architecture Is Correct

### Security Benefits:

1. **Separation of Concerns**
   - Public users cannot access admin routes
   - Admin functions isolated from public API
   - Reduced attack surface

2. **Clear Permission Boundaries**
   - User token → public features only
   - Admin token → admin features only
   - Role-based access control enforced at API level

3. **Audit Trail**
   - All admin actions logged
   - Who did what, when
   - Compliance with GDPR

4. **Scalability**
   - Admin dashboard can be separate codebase
   - Different deployment strategy
   - Different performance requirements

---

## 🧑‍💼 Who Uses Admin Dashboard?

### ✅ Internal Team Only:

1. **Super Admins (2-3 people)**
   - Platform owners
   - CTO / Tech Lead
   - Full control

2. **Support Agents (5-10 people)**
   - Respond to tickets
   - Resolve disputes
   - Ban abusive users

3. **Finance Admins (1-2 people)**
   - Process refunds
   - Investigate payment issues
   - Review escrow releases

4. **Moderators (Optional)**
   - Review content
   - Check translations
   - Flag inappropriate behavior

### ❌ NEVER:
- ❌ Customers
- ❌ Helpers
- ❌ Business partners
- ❌ External contractors (unless explicitly given access)

---

## 📊 Admin Dashboard Features

### 1. User Management

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  USER MANAGEMENT                                         │
├─────────────────────────────────────────────────────────┤
│  Search: [_____________]  Filter: [All Users ▼]         │
│                                                           │
│  ID    | Name           | Email            | Status      │
│  ─────────────────────────────────────────────────────  │
│  U001  | John Smith     | john@email.com   | ✅ Active  │
│  U002  | Maria García   | maria@email.com  | ⚠️ Warning │
│  U003  | Lars Müller    | lars@email.com   | 🔴 Banned  │
│                                                           │
│  Actions: [View] [Edit] [Ban] [View Orders]             │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- View user profile
- View trust score breakdown
- View verification documents
- View order history
- Ban/unban user
- Adjust trust score (with reason)
- Send notification

### 2. Order Management

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  ORDER MANAGEMENT                                        │
├─────────────────────────────────────────────────────────┤
│  Filter: [Status: All ▼]  [Date: Last 30 days ▼]       │
│                                                           │
│  Order | Customer | Helper | Service | Status | Actions  │
│  ─────────────────────────────────────────────────────  │
│  #1234 | John S.  | Maria  | Moving  | ✅ Done | [View] │
│  #1235 | Lars M.  | -      | Clean   | ⏳ Pending | [Match]│
│  #1236 | Anna K.  | Peter  | Garden  | ⚠️ Dispute | [Resolve]│
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- View order details
- View AI matching reasoning
- Manually match helper
- Cancel order (with refund)
- Resolve dispute
- Override AI decision

### 3. Payment Management

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  PAYMENT MANAGEMENT                                      │
├─────────────────────────────────────────────────────────┤
│  Payment | Order | Amount | Status    | Date            │
│  ─────────────────────────────────────────────────────  │
│  P001    | #1234 | €50.00 | ✅ Released | 2025-12-20   │
│  P002    | #1235 | €30.00 | ⏳ Escrow   | 2025-12-25   │
│  P003    | #1236 | €75.00 | ⚠️ Disputed | 2025-12-28   │
│                                                           │
│  Actions: [View] [Refund] [Release] [Hold]              │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- View payment details
- Process refund (full or partial)
- Force release escrow
- Hold payment (fraud investigation)
- View Stripe transaction

### 4. AI System Monitoring

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  AI SYSTEM HEALTH                                        │
├─────────────────────────────────────────────────────────┤
│  Status: ✅ Online    Response Time: 42ms                │
│                                                           │
│  Intent Detection Accuracy:  87% ████████░░              │
│  Matching Quality:            92% █████████░             │
│  Decision Overrides:          3% ░░░░░░░░░░              │
│                                                           │
│  Recent Decisions:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ User: John → Intent: booking → Action: create    │   │
│  │ Confidence: 0.89 → Status: ✅ Accepted          │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  [View Full Stats] [Export Logs] [Train Model]          │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- View AI statistics
- See decision logs
- Override AI decision
- Retrain intent classifier
- Export training data

### 5. Support Tickets

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  SUPPORT TICKETS                                         │
├─────────────────────────────────────────────────────────┤
│  Filter: [Status: Open ▼]  [Priority: All ▼]            │
│                                                           │
│  ID   | User      | Subject          | Priority | Age    │
│  ─────────────────────────────────────────────────────  │
│  T001 | John S.   | Payment failed   | 🔴 High  | 2h    │
│  T002 | Maria G.  | Can't book       | 🟡 Med   | 5h    │
│  T003 | Lars M.   | Question         | 🟢 Low   | 1d    │
│                                                           │
│  Actions: [Reply] [Escalate] [Close] [Merge]            │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- Reply to ticket
- Escalate to senior support
- Close ticket (with reason)
- Merge duplicate tickets
- View conversation history

### 6. Content & Language Management

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  LANGUAGE MANAGEMENT                                     │
├─────────────────────────────────────────────────────────┤
│  Language     | Status      | Coverage | Last Updated   │
│  ──────────────────────────────────────────────────────│
│  English (GB) | ✅ Complete | 100%     | 2025-12-20    │
│  German (DE)  | ✅ Complete | 100%     | 2025-12-20    │
│  French (FR)  | ⏳ Progress | 87%      | 2025-12-15    │
│  Spanish (ES) | ⏳ Progress | 92%      | 2025-12-18    │
│                                                           │
│  [Add Translation] [Approve] [Edit] [Export]            │
└─────────────────────────────────────────────────────────┘
```

**Actions:**
- View all translations
- Edit translations
- Approve translations (quality check)
- Export for translators
- Import translations

### 7. System Logs & Analytics

**View:**
```
┌─────────────────────────────────────────────────────────┐
│  SYSTEM HEALTH                                           │
├─────────────────────────────────────────────────────────┤
│  Uptime: 99.8%    Errors: 0.2%    Response: 180ms       │
│                                                           │
│  Active Users:  1,234                                    │
│  Orders Today:  45                                       │
│  Revenue:       €2,340                                   │
│                                                           │
│  Recent Errors:                                          │
│  [2025-12-31 10:23] Payment timeout (user_123)          │
│  [2025-12-31 09:45] AI service unreachable              │
│                                                           │
│  [View Full Logs] [Download Report]                     │
└─────────────────────────────────────────────────────────┘
```

**Metrics:**
- System uptime
- Error rate
- Active users
- Orders (today / week / month)
- Revenue
- Average response time
- AI performance

---

## 🛠️ Technical Implementation

### Frontend (Admin Dashboard)

**Tech Stack:**
```
Framework: React 18 + TypeScript (same as public app)
Routing: React Router
State: Zustand or Redux Toolkit
UI: Tailwind CSS + shadcn/ui
Charts: Recharts or Chart.js
Tables: TanStack Table (React Table v8)
```

**Project Structure:**
```
admin-dashboard/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview
│   │   ├── Users.tsx            # User management
│   │   ├── Orders.tsx           # Order management
│   │   ├── Payments.tsx         # Payment management
│   │   ├── Support.tsx          # Support tickets
│   │   ├── AI.tsx               # AI monitoring
│   │   ├── Languages.tsx        # Content management
│   │   └── Logs.tsx             # System logs
│   ├── components/
│   │   ├── UserTable.tsx
│   │   ├── OrderCard.tsx
│   │   ├── PaymentActions.tsx
│   │   └── ...
│   ├── services/
│   │   ├── admin-api.ts         # API client (admin routes)
│   │   ├── auth.service.ts      # Admin auth
│   │   └── ...
│   └── hooks/
│       ├── useAdminAuth.ts
│       └── usePermissions.ts
```

**Admin API Client:**
```typescript
// admin-dashboard/src/services/admin-api.ts

import { APIClient } from './api-client';

class AdminAPIClient extends APIClient {
  constructor() {
    super(import.meta.env.VITE_API_URL, 10000);
  }

  // Automatically add /admin prefix
  async get<T>(endpoint: string, params?: any): Promise<T> {
    return super.get<T>(`/admin${endpoint}`, params);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return super.post<T>(`/admin${endpoint}`, data);
  }

  // Admin-specific methods
  async getAllUsers(filters?: any) {
    return this.get('/users', filters);
  }

  async banUser(userId: string, reason: string) {
    return this.post(`/users/${userId}/ban`, { reason });
  }

  async getAllOrders(filters?: any) {
    return this.get('/orders', filters);
  }

  async refundPayment(paymentId: string, amount: number) {
    return this.post(`/payments/${paymentId}/refund`, { amount });
  }

  async getAIStats() {
    return this.get('/ai/stats');
  }
}

export const adminApi = new AdminAPIClient();
```

### Backend (Admin Routes)

**Route Structure:**
```
backend/src/modules/admin/
├── admin.module.ts
├── admin.controller.ts
├── admin.service.ts
├── dto/
│   ├── ban-user.dto.ts
│   ├── refund-payment.dto.ts
│   └── ...
└── guards/
    ├── admin.guard.ts
    └── permissions.guard.ts
```

**Admin Controller Example:**
```typescript
// backend/src/modules/admin/admin.controller.ts

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // User Management
  @Get('users')
  @UseGuards(PermissionsGuard(['view_users']))
  async getAllUsers(@Query() filters: any) {
    return this.adminService.getAllUsers(filters);
  }

  @Post('users/:id/ban')
  @UseGuards(PermissionsGuard(['ban_users']))
  async banUser(
    @Param('id') userId: string,
    @Body() dto: BanUserDto,
    @CurrentUser() admin: User,
  ) {
    // Log admin action
    await this.adminService.logAction({
      adminId: admin.id,
      action: 'BAN_USER',
      targetUserId: userId,
      reason: dto.reason,
      timestamp: new Date(),
    });

    return this.adminService.banUser(userId, dto.reason);
  }

  // Order Management
  @Get('orders')
  @UseGuards(PermissionsGuard(['view_orders']))
  async getAllOrders(@Query() filters: any) {
    return this.adminService.getAllOrders(filters);
  }

  @Post('orders/:id/cancel')
  @UseGuards(PermissionsGuard(['cancel_orders']))
  async cancelOrder(
    @Param('id') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() admin: User,
  ) {
    await this.adminService.logAction({
      adminId: admin.id,
      action: 'CANCEL_ORDER',
      targetOrderId: orderId,
      reason: dto.reason,
      timestamp: new Date(),
    });

    return this.adminService.cancelOrder(orderId, dto.reason);
  }

  // Payment Management
  @Post('payments/:id/refund')
  @UseGuards(PermissionsGuard(['process_refunds']))
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() admin: User,
  ) {
    await this.adminService.logAction({
      adminId: admin.id,
      action: 'REFUND_PAYMENT',
      targetPaymentId: paymentId,
      amount: dto.amount,
      timestamp: new Date(),
    });

    return this.adminService.refundPayment(paymentId, dto.amount);
  }

  // AI System
  @Get('ai/stats')
  @UseGuards(PermissionsGuard(['view_ai_stats']))
  async getAIStats() {
    return this.adminService.getAIStats();
  }

  @Post('ai/decisions/:id/override')
  @UseGuards(PermissionsGuard(['override_ai']))
  async overrideAIDecision(
    @Param('id') decisionId: string,
    @Body() dto: OverrideDecisionDto,
    @CurrentUser() admin: User,
  ) {
    await this.adminService.logAction({
      adminId: admin.id,
      action: 'OVERRIDE_AI_DECISION',
      targetDecisionId: decisionId,
      newAction: dto.action,
      reason: dto.reason,
      timestamp: new Date(),
    });

    return this.adminService.overrideAIDecision(decisionId, dto.action, dto.reason);
  }
}
```

**Permissions Guard:**
```typescript
// backend/src/modules/admin/guards/permissions.guard.ts

export const PermissionsGuard = (requiredPermissions: string[]) => {
  @Injectable()
  class PermissionsGuardClass implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Super admin has all permissions
      if (user.role === UserRole.SUPER_ADMIN) {
        return true;
      }

      // Check if user has required permissions
      const userPermissions = this.getPermissionsForRole(user.role);
      const hasPermission = requiredPermissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      return true;
    }

    private getPermissionsForRole(role: UserRole): string[] {
      const rolePermissions = {
        [UserRole.SUPER_ADMIN]: ['*'], // All permissions
        [UserRole.SUPPORT_ADMIN]: [
          'view_users',
          'ban_users',
          'view_orders',
          'cancel_orders',
          'view_ai_stats',
          'override_ai',
        ],
        [UserRole.FINANCE_ADMIN]: [
          'view_users',
          'view_orders',
          'view_payments',
          'process_refunds',
        ],
        [UserRole.MODERATOR]: [
          'view_users',
          'ban_users',
          'view_content',
          'manage_languages',
        ],
        [UserRole.VIEWER]: ['view_users', 'view_orders', 'view_ai_stats'],
      };

      return rolePermissions[role] || [];
    }
  }

  return PermissionsGuardClass;
};
```

---

## 📝 Admin Action Logging (Audit Trail)

**Database Schema:**
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  target_order_id UUID REFERENCES orders(id),
  target_payment_id UUID REFERENCES payments(id),
  target_decision_id VARCHAR(50),
  reason TEXT,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_timestamp ON admin_actions(timestamp DESC);
CREATE INDEX idx_admin_actions_action ON admin_actions(action);
```

**Example Logs:**
```json
{
  "id": "log_001",
  "admin_id": "admin_123",
  "action": "BAN_USER",
  "target_user_id": "user_456",
  "reason": "Multiple fraud attempts",
  "timestamp": "2025-12-31T10:30:00Z",
  "ip_address": "192.168.1.10",
  "user_agent": "Mozilla/5.0..."
}

{
  "id": "log_002",
  "admin_id": "admin_789",
  "action": "REFUND_PAYMENT",
  "target_payment_id": "pay_001",
  "reason": "Service not delivered",
  "metadata": { "amount": 50.00, "currency": "EUR" },
  "timestamp": "2025-12-31T11:15:00Z"
}
```

---

## 🚀 Deployment

### Option 1: Separate Subdomain (Recommended)

**Setup:**
```bash
# Public App
https://helpro.com              → Vercel/Netlify
https://app.helpro.com          → Vercel/Netlify

# Admin Dashboard
https://admin.helpro.com        → Separate deployment (Vercel/Netlify)

# Backend
https://api.helpro.com          → Railway/Render
```

**Benefits:**
- Clear separation
- Independent deployments
- Easy to restrict access (firewall, VPN)

### Option 2: Same Deployment, Different Routes

**Setup:**
```bash
https://helpro.com/             → Public app
https://helpro.com/admin        → Admin dashboard (protected by route guard)
```

**Benefits:**
- Simpler setup
- Single deployment
- Lower cost

**Security:**
- Must have strong route guards
- Admin routes protected by middleware
- Consider IP whitelist for extra security

---

## 🔒 Security Checklist

Before deploying admin dashboard:

- [ ] Admin routes protected by `AdminGuard`
- [ ] Permissions enforced with `PermissionsGuard`
- [ ] All admin actions logged
- [ ] 2FA enabled for SUPER_ADMIN and FINANCE_ADMIN
- [ ] Rate limiting on admin endpoints
- [ ] IP whitelist (optional, recommended)
- [ ] Session timeout (30 minutes)
- [ ] Strong password policy
- [ ] Regular security audits
- [ ] Admin accounts reviewed quarterly

---

## ✅ Final Confirmation

✔ **Yes, I understand**  
✔ Admin dashboard is **behind** the app  
✔ **Internal, protected, role-based**  
✔ Same backend, **different permissions**  
✔ Correct for **security, trust, and scaling**

You are thinking like a **real platform owner**, not a beginner. 🚀

---

## 🔗 Related Documentation

- [TEAM_STRUCTURE.md](TEAM_STRUCTURE.md) – Team roles and responsibilities
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) – Public app integration
- [AI_SYSTEM_COMPLETE.md](AI_SYSTEM_COMPLETE.md) – AI system documentation

---

**Last Updated:** 2025-12-31  
**Status:** ✅ Architecture approved  
**Access:** Internal only (admin roles)
