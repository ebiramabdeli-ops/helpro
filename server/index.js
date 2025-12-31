import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './database.js';
import authRoutes from './routes/auth.js';
import requestRoutes from './routes/requests.js';
import bookingRoutes from './routes/bookings.js';
import messageRoutes from './routes/messages.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);

// AI Chat endpoint (mock)
app.post('/api/ai/chat', (req, res) => {
  const { tenantId, locale, messages, context, sessionId } = req.body;

  // Validation
  if (!tenantId || !locale || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  // Mock response based on last user message
  const lastMessage = messages[messages.length - 1];
  const userText = lastMessage?.content?.toLowerCase() || '';

  let assistantMessage = 'Hello! How can I help you today?';
  let quickActions = ['Get a Quote', 'Book Help', 'Check Status', 'Talk to Human'];
  let nav = null;

  if (userText.includes('quote') || userText.includes('price')) {
    assistantMessage = 'I can help you get a quote! What type of help do you need? (moving, delivery, recycling, shopping, or home tasks)';
    quickActions = ['Moving', 'Delivery', 'Recycling', 'Shopping'];
  } else if (userText.includes('book') || userText.includes('help')) {
    assistantMessage = 'Great! To book help, I need a few details. What would you like help with?';
    nav = { route: '/requests', label: 'Create Request' };
  } else if (userText.includes('status') || userText.includes('booking')) {
    assistantMessage = 'Let me check your bookings for you...';
    nav = { route: '/bookings', label: 'View Bookings' };
  } else if (userText.includes('moving') || userText.includes('furniture')) {
    assistantMessage = 'Moving help! I can connect you with helpers who have vehicles. Typical cost is €30-80 depending on size and distance. Ready to post a request?';
    quickActions = ['Post Request', 'Browse Helpers', 'Get Estimate'];
  } else if (userText.includes('delivery')) {
    assistantMessage = 'Delivery service! Perfect for picking up second-hand items or delivering packages. Typical cost is €15-50. Want to create a delivery request?';
    quickActions = ['Create Request', 'View Helpers'];
  } else if (userText.includes('recycle') || userText.includes('waste')) {
    assistantMessage = 'Recycling help! We can connect you with someone to take items to the recycling center. Eco-friendly and convenient. Cost usually €20-40.';
    quickActions = ['Post Request', 'Learn More'];
  }

  setTimeout(() => {
    res.json({
      assistantMessage,
      quickActions,
      nav,
      requestId: Date.now().toString(),
    });
  }, 800); // Simulate network delay
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Helpro API server running on http://localhost:${PORT}`);
  console.log(`📦 Database: server/helpro.db`);
  console.log(`🔐 Auth endpoints: /api/auth/*`);
  console.log(`📝 Request endpoints: /api/requests/*`);
  console.log(`📅 Booking endpoints: /api/bookings/*`);
  console.log(`💬 Message endpoints: /api/messages/*`);
});
