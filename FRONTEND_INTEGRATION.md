# 🎨 FRONTEND INTEGRATION GUIDE

**Complete step-by-step guide for integrating Helpro frontend with Backend + AI**

---

## 1. Tech Stack (Current)

✅ **Core Framework:**
- React 18 + Vite + TypeScript
- Why: Fast development, excellent DX, modern tooling

✅ **Styling:**
- CSS Modules (current)
- → Migrate to **Tailwind CSS** (recommended for scalability)

✅ **State Management:**
- React Context (current)
- → Add **Zustand** or **Jotai** for complex state (optional)

✅ **i18n:**
- Custom system (15 languages ✅)
- → Migrate to **i18next** (Phase 2, after translations)

---

## 2. Architecture Overview

```
/src
├── /components      # Reusable UI components
├── /pages           # Page components (routes)
├── /services        # ✅ API clients (NEW)
├── /hooks           # Custom React hooks
├── /i18n            # ✅ 15 languages
├── /config          # ✅ API config (NEW)
├── /types           # TypeScript types
├── /styles          # Global styles
└── /utils           # Helper functions
```

**NEW Services Layer:**
```
/services
├── api-client.ts          # ✅ HTTP client with auth
├── ai.service.ts          # ✅ Python AI integration
├── auth.service.ts        # ✅ Authentication
├── order.service.ts       # ✅ Bookings
├── payment.service.ts     # ✅ Stripe payments
└── service-catalog.service.ts  # ✅ Browse services
```

---

## 3. Environment Setup

### Step 1: Create `.env` file

```bash
# Copy example
cp .env.example .env
```

**Required variables:**
```env
# Backend API (NestJS)
VITE_API_URL=http://localhost:3000

# AI Service (Python)
VITE_AI_URL=http://localhost:8000

# Stripe (get from https://dashboard.stripe.com)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
```

### Step 2: Install dependencies

```bash
# Core dependencies (already installed)
npm install

# NEW: Stripe
npm install @stripe/stripe-js @stripe/react-stripe-js

# OPTIONAL: State management
npm install zustand

# OPTIONAL: Better date handling
npm install date-fns
```

---

## 4. Service Integration Examples

### A. Authentication Flow

**Login Component:**
```tsx
import { useAuth } from '../services/auth.service';
import { useState } from 'react';

function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### B. AI-Powered Chat

**Smart Chat Input:**
```tsx
import { useAI } from '../services/ai.service';
import { useState } from 'react';
import { getLocale } from '../i18n';

function SmartChatInput() {
  const { analyzeText, makeDecision } = useAI();
  const [message, setMessage] = useState('');
  const [thinking, setThinking] = useState(false);
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    if (!message.trim()) return;

    setThinking(true);
    try {
      // Step 1: Analyze user text
      const analysis = await analyzeText(message, getLocale());
      
      console.log('Intent:', analysis.intent);
      console.log('Confidence:', analysis.confidence);
      console.log('Urgency:', analysis.urgency);

      // Step 2: Make decision
      const decision = await makeDecision({
        intent: analysis.intent,
        entities: analysis.entities,
        context: {},
      });

      // Step 3: Show AI response
      setResponse(decision.suggested_response);

      // Step 4: Execute actions
      if (decision.action === 'create_booking') {
        // Redirect to booking form
        window.location.href = '/booking/new';
      }
    } catch (error) {
      console.error('AI error:', error);
      setResponse('Sorry, I couldn't process that. Please try again.');
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="chat-input">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="How can I help you today?"
        disabled={thinking}
      />
      <button onClick={handleSend} disabled={thinking}>
        {thinking ? '🧠 Thinking...' : 'Send'}
      </button>
      {response && (
        <div className="ai-response">
          <strong>AI:</strong> {response}
        </div>
      )}
    </div>
  );
}
```

### C. Service Booking Flow

**Booking Form with AI Matching:**
```tsx
import { useOrders } from '../services/order.service';
import { useAI } from '../services/ai.service';
import { useState } from 'react';

function BookingForm() {
  const { createOrder } = useOrders();
  const { matchHelpers } = useAI();
  
  const [service, setService] = useState('cleaning');
  const [location, setLocation] = useState({ lat: 0, lng: 0 });
  const [budget, setBudget] = useState(50);
  const [matches, setMatches] = useState([]);

  const handleFindHelpers = async () => {
    // Use AI to find best matches
    const result = await matchHelpers({
      service_category: service,
      location,
      budget,
      urgency: 'medium',
    });

    console.log(`Found ${result.matches.length} helpers in ${result.execution_time_ms}ms`);
    setMatches(result.matches);
  };

  const handleBookHelper = async (helperId: string) => {
    await createOrder({
      serviceCategory: service,
      description: 'Cleaning service',
      location: {
        address: '123 Main St',
        lat: location.lat,
        lng: location.lng,
      },
      scheduledDate: new Date().toISOString(),
      estimatedHours: 3,
      budget,
    });

    alert('Booking created!');
  };

  return (
    <div>
      <h2>Book a Service</h2>
      
      {/* Service Selection */}
      <select value={service} onChange={(e) => setService(e.target.value)}>
        <option value="cleaning">Cleaning</option>
        <option value="moving">Moving</option>
        <option value="recycling">Recycling</option>
      </select>

      {/* Budget */}
      <input
        type="number"
        value={budget}
        onChange={(e) => setBudget(Number(e.target.value))}
        placeholder="Budget (€)"
      />

      {/* Find Helpers */}
      <button onClick={handleFindHelpers}>Find Helpers</button>

      {/* Show Matches */}
      {matches.length > 0 && (
        <div className="matches">
          <h3>Best Matches:</h3>
          {matches.map((match) => (
            <div key={match.id} className="match-card">
              <h4>Helper #{match.id}</h4>
              <div>Match Score: {match.match_score}/100</div>
              <div>Distance: {match.distance_km} km</div>
              <div>Reasons: {match.match_reasons.join(', ')}</div>
              <button onClick={() => handleBookHelper(match.id)}>
                Book This Helper
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### D. Payment Integration (Stripe)

**Payment Form:**
```tsx
import { usePayments, initializeStripe } from '../services/payment.service';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';

// Initialize Stripe
const stripePromise = initializeStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PaymentForm({ orderId, amount }: { orderId: string; amount: number }) {
  const { createPaymentIntent, confirmPayment } = usePayments();
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create payment intent on mount
    createPaymentIntent({ orderId, amount, currency: 'eur' }).then((response) => {
      setClientSecret(response.clientSecret);
    });
  }, [orderId, amount]);

  if (!clientSecret) {
    return <div>Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      });

      if (error) {
        setError(error.message || 'Payment failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

### E. Trust Score Display

**User Trust Badge:**
```tsx
import { useAI } from '../services/ai.service';
import { useEffect, useState } from 'react';

function TrustScoreBadge() {
  const { getMyTrustScore } = useAI();
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    getMyTrustScore().then(setScore);
  }, []);

  if (!score) return null;

  const levelColors = {
    high: '#10b981',
    medium: '#f59e0b',
    low: '#ef4444',
  };

  return (
    <div className="trust-badge">
      <div className="score" style={{ color: levelColors[score.level] }}>
        {score.score.toFixed(1)}/5.0
      </div>
      <div className="level">{score.level.toUpperCase()} TRUST</div>
      
      {/* Breakdown */}
      <details>
        <summary>See Details</summary>
        <ul>
          {Object.entries(score.breakdown).map(([key, value]) => (
            <li key={key}>
              {key}: +{(value as number).toFixed(2)}
            </li>
          ))}
        </ul>
      </details>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="recommendations">
          <strong>How to improve:</strong>
          <ul>
            {score.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Protected Routes

**Auth Guard:**
```tsx
import { useAuth } from '../services/auth.service';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

// Usage:
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## 6. Error Handling

**Global Error Boundary:**
```tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
    // Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-page">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 7. Language Integration

**Update useChat to use AI:**
```tsx
// src/hooks/useChat.ts

import { useState } from 'react';
import { useAI } from '../services/ai.service';
import { getLocale } from '../i18n';

export function useChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const { analyzeText, makeDecision } = useAI();

  const sendMessage = async (text: string) => {
    // Add user message
    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Use AI to understand and respond
      const analysis = await analyzeText(text, getLocale());
      const decision = await makeDecision({
        intent: analysis.intent,
        entities: analysis.entities,
        context: { messages },
      });

      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: decision.suggested_response,
        actions: decision.next_steps,
      };
      setMessages((prev) => [...prev, aiMessage]);

      return aiMessage;
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
      return errorMessage;
    }
  };

  return {
    messages,
    sendMessage,
  };
}
```

---

## 8. Testing Services

**Quick Test Script:**
```tsx
// src/test-services.ts

import { AuthService } from './services/auth.service';
import { AIService } from './services/ai.service';
import { OrderService } from './services/order.service';

async function testServices() {
  console.log('🧪 Testing services...\n');

  // Test AI Service
  console.log('1. Testing AI Service...');
  try {
    const health = await AIService.healthCheck();
    console.log('✅ AI Service:', health.status);

    const analysis = await AIService.analyzeText(
      'I need help moving furniture tomorrow',
      'en-GB'
    );
    console.log('✅ Text analysis:', analysis.intent, analysis.confidence);
  } catch (error) {
    console.error('❌ AI Service failed:', error);
  }

  // Test Auth
  console.log('\n2. Testing Auth Service...');
  try {
    const user = await AuthService.getCurrentUser();
    console.log('✅ Current user:', user?.email || 'Not logged in');
  } catch (error) {
    console.log('ℹ️  Not authenticated');
  }

  console.log('\n✅ Service tests complete');
}

// Run in browser console:
// import('./test-services.ts').then(m => m.testServices())
```

---

## 9. Performance Optimization

### Lazy Loading Components

```tsx
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bookings = lazy(() => import('./pages/Bookings'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}
```

### API Response Caching

```tsx
// Simple cache wrapper
const cache = new Map();

async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 60000
): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

// Usage:
const categories = await cachedFetch(
  'service-categories',
  () => ServiceCatalogService.getCategories(),
  300000 // 5 minutes
);
```

---

## 10. Next Steps

### Phase 1: Core Integration ✅
- [x] API client with authentication
- [x] AI service integration
- [x] Auth service
- [x] Order service
- [x] Payment service

### Phase 2: UI Components (Next)
- [ ] Update ChatWidget to use AI service
- [ ] Create booking flow stepper
- [ ] Add Stripe payment form
- [ ] Build trust score component
- [ ] Create helper matching UI

### Phase 3: Mobile Optimization
- [ ] Responsive design (mobile-first)
- [ ] Touch-friendly UI
- [ ] Offline support (Service Worker)
- [ ] PWA manifest

### Phase 4: Advanced Features
- [ ] Real-time notifications (WebSocket)
- [ ] Push notifications
- [ ] Geolocation services
- [ ] Image upload (profile, verification)

---

## 11. Deployment Checklist

Before deploying:

- [ ] Set production environment variables
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Add error tracking (Sentry)
- [ ] Add analytics (Google Analytics, Plausible)
- [ ] Test all payment flows
- [ ] Test authentication flows
- [ ] Verify all 15 languages display correctly
- [ ] Performance audit (Lighthouse)
- [ ] Security audit

---

## 12. Useful Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Test Services
# Open browser console and run:
import('./src/test-services.ts').then(m => m.testServices())
```

---

## 13. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│                     Port 5173                            │
└───────────────┬─────────────────────────────────────────┘
                │
                ├─→ API Client (api-client.ts)
                │   │
                │   ├─→ Auth Service → NestJS Backend (3000)
                │   ├─→ Order Service → NestJS Backend (3000)
                │   ├─→ Payment Service → NestJS Backend (3000)
                │   │
                │   └─→ AI Service → Python AI (8000)
                │       ├─→ Analyze Text (NLP)
                │       ├─→ Make Decision (Rules)
                │       ├─→ Match Helpers (Optimization)
                │       └─→ Get Trust Score
                │
                ├─→ Components (UI)
                ├─→ Pages (Routes)
                └─→ i18n (15 Languages)
```

---

**Status:** ✅ Frontend services integrated and ready to use

**Next:** Update existing components to use new services

**Files Created:** 8 service files + config + documentation
