import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import './database.js';
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import profileRoutes from './routes/profile.js';
import verificationRoutes from './routes/verification.js';
import gdprRoutes from './routes/gdpr.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { securityConfig } from './config/security.js';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet(securityConfig.helmet));
app.use(cors(securityConfig.cors));

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disable X-Powered-By header
app.disable('x-powered-by');

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/admin', adminRoutes);

// AI Chat endpoint (mock) - TODO: Connect to AI service
app.post('/api/ai/chat', (req, res) => {
  const { tenantId, locale, messages, context, sessionId } = req.body;

  if (!tenantId || !locale || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage?.content?.toLowerCase() || '';

  let assistantMessage = 'Hello! How can I help you today?';
  let quickActions = ['Get a Quote', 'Book Help', 'Check Status', 'Talk to Human'];
  let nav = null;

  if (userText.includes('quote') || userText.includes('price')) {
    assistantMessage = 'I can help you get a quote! What type of help do you need?';
    quickActions = ['Moving', 'Delivery', 'Recycling', 'Shopping'];
  } else if (userText.includes('book') || userText.includes('help')) {
    assistantMessage = 'Great! To book help, I need a few details. What would you like help with?';
    nav = { route: '/requests', label: 'Create Request' };
  }

  setTimeout(() => {
    res.json({
      assistantMessage,
      quickActions,
      nav,
      requestId: Date.now().toString(),
    });
  }, 800);
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────┐
│  🚀 Helpro API Server (TypeScript)      │
│  ✅ Running on http://localhost:${PORT}    │
│  🔒 Security: Enhanced                  │
│  📱 Phone Verification: Enabled         │
│  � Email Verification: Enabled         │
│  🔐 MFA: Enabled                        │
│  🔑 OAuth: Google (Configured)          │
│  🛡️  Rate Limiting: Active               │
│  📦 Database: server/data.json          │
└─────────────────────────────────────────┘

Authentication Endpoints:
  🔐 Auth:      POST /api/auth/register
  🔐 Auth:      POST /api/auth/login
  🔐 Auth:      POST /api/auth/verify-mfa
  🔐 Auth:      GET  /api/auth/me
  📧 Email:     POST /api/auth/verify-email
  📧 Email:     POST /api/auth/resend-verification
  📱 Phone:     POST /api/auth/phone/request-verification
  📱 Phone:     POST /api/auth/phone/verify
  🔐 MFA:       POST /api/auth/mfa/setup
  🔐 MFA:       POST /api/auth/mfa/enable
  🔐 MFA:       POST /api/auth/mfa/disable

OAuth Endpoints:
  🔑 Google:    GET  /api/oauth/google
  🔑 Google:    POST /api/oauth/google/callback
  🔑 OAuth:     POST /api/oauth/disconnect/:provider
  🔑 OAuth:     GET  /api/oauth/linked

Profile Endpoints:
  👤 Profile:   GET  /api/profile
  👤 Profile:   PATCH /api/profile
  👤 Profile:   GET  /api/profile/:userId

Identity Verification:
  🆔 Status:    GET  /api/verification/status
  ✅ Consent:   POST /api/verification/consent/biometric
  ❌ Revoke:    POST /api/verification/consent/revoke
  🆔 Document:  POST /api/verification/document
  📸 Biometric: POST /api/verification/biometric
  ✅ Submit:    POST /api/verification/submit
  📁 File:      GET  /api/verification/file/:fileId
  
Admin Verification:
  👮 Pending:   GET  /api/verification/admin/pending
  ✅ Approve:   POST /api/verification/admin/:id/approve
  ❌ Reject:    POST /api/verification/admin/:id/reject

GDPR Compliance:
  📦 Export:    POST /api/gdpr/export
  📥 Download:  GET  /api/gdpr/export/:id/download
  🗑️ Delete:    POST /api/gdpr/delete
  ↩️  Cancel:    POST /api/gdpr/delete/cancel
  
Admin Dashboard:
  📊 Stats:     GET  /api/admin/stats
  👥 Users:     GET  /api/admin/users
  👤 User:      GET  /api/admin/users/:id
  🔄 Status:    PATCH /api/admin/users/:id/status
  🆔 Verify:    GET  /api/admin/verifications
  📋 Logs:      GET  /api/admin/audit-logs

Other:
  🏥 Health:    GET  /api/health
  🤖 AI:        POST /api/ai/chat
  `);
});

export default app;
