import express from 'express';
import { Message } from '../models/Message.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// Send message
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { bookingId, content } = req.body;
    
    if (!bookingId || !content) {
      throw new ApiError('Missing required fields', 400);
    }
    
    const booking = Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const user = User.findById(req.userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const message = Message.create({
      id: messageId,
      bookingId,
      senderId: req.userId,
      senderName: user.name,
      content,
    });
    
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
});

// Get messages for a booking
router.get('/booking/:bookingId', authMiddleware, async (req, res, next) => {
  try {
    const booking = Booking.findById(req.params.bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const { limit = 100, offset = 0 } = req.query;
    const messages = Message.getByBooking(req.params.bookingId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Get all messages for current user
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const messages = Message.getByUser(req.userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.patch('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const message = Message.findById(req.params.id);
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    const booking = Booking.findById(message.bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const updated = Message.markAsRead(req.params.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Mark all messages in a booking as read
router.post('/booking/:bookingId/read-all', authMiddleware, async (req, res, next) => {
  try {
    const booking = Booking.findById(req.params.bookingId);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const count = Message.markBookingMessagesAsRead(req.params.bookingId, req.userId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const message = Message.findById(req.params.id);
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    if (message.senderId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    Message.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
