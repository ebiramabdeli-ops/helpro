import express from 'express';
import { Booking } from '../models/Booking.js';
import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// Create booking
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { requestId, price, proposedDate } = req.body;
    
    if (!requestId || !price || !proposedDate) {
      throw new ApiError('Missing required fields', 400);
    }
    
    const request = Request.findById(requestId);
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    
    if (request.status !== 'open') {
      throw new ApiError('Request is not available', 400);
    }
    
    const helper = User.findById(req.userId);
    if (!helper) {
      throw new ApiError('User not found', 404);
    }
    
    if (helper.role !== 'helper') {
      throw new ApiError('Only helpers can create bookings', 403);
    }
    
    const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const booking = Booking.create({
      id: bookingId,
      requestId,
      customerId: request.customerId,
      helperId: req.userId,
      helperName: helper.name,
      price,
      scheduledDate: proposedDate,
    });
    
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

// Get all bookings (filtered by user)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    
    const user = User.findById(req.userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const filters = {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };
    
    if (user.role === 'customer') {
      filters.customerId = req.userId;
    } else {
      filters.helperId = req.userId;
    }
    
    const bookings = Booking.getAll(filters);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// Get bookings for a specific request
router.get('/request/:requestId', authMiddleware, async (req, res, next) => {
  try {
    const bookings = Booking.getAll({ requestId: req.params.requestId });
    res.json(bookings);
  } catch (error) {
    next(error);
  }
});

// Get booking by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const booking = Booking.findById(req.params.id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Update booking status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    const booking = Booking.findById(req.params.id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    // Only customer or helper can update
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const completedAt = status === 'completed' ? new Date().toISOString() : null;
    const updated = Booking.updateStatus(req.params.id, status, completedAt);
    
    // Update request status if booking is accepted
    if (status === 'accepted') {
      Request.updateStatus(booking.requestId, 'in-progress');
    } else if (status === 'completed') {
      Request.updateStatus(booking.requestId, 'completed');
    }
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Add review to booking
router.post('/:id/review', authMiddleware, async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      throw new ApiError('Rating must be between 1 and 5', 400);
    }
    
    const booking = Booking.findById(req.params.id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId) {
      throw new ApiError('Only customer can review', 403);
    }
    
    if (booking.status !== 'completed') {
      throw new ApiError('Can only review completed bookings', 400);
    }
    
    const updated = Booking.addReview(req.params.id, rating, review);
    
    // Update helper's rating
    User.updateRating(booking.helperId, rating);
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Cancel booking
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const booking = Booking.findById(req.params.id);
    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }
    
    if (booking.customerId !== req.userId && booking.helperId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    Booking.updateStatus(req.params.id, 'cancelled');
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
