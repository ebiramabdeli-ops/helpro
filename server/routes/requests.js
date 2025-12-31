import express from 'express';
import { Request } from '../models/Request.js';
import { User } from '../models/User.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = express.Router();

// Create request
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { title, description, category, budget, location, scheduledDate } = req.body;
    
    if (!title || !description || !category || !budget || !location) {
      throw new ApiError('Missing required fields', 400);
    }
    
    const user = User.findById(req.userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const request = Request.create({
      id: requestId,
      customerId: req.userId,
      customerName: user.name,
      title,
      description,
      category,
      budget,
      location,
      scheduledDate,
    });
    
    res.status(201).json(request);
  } catch (error) {
    next(error);
  }
});

// Get all requests
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { status, category, limit = 50, offset = 0 } = req.query;
    const requests = Request.getAll({
      status,
      category,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// Get user's requests
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const requests = Request.getAll({
      customerId: req.userId,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    res.json(requests);
  } catch (error) {
    next(error);
  }
});

// Get request by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const request = Request.findById(req.params.id);
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    res.json(request);
  } catch (error) {
    next(error);
  }
});

// Update request
router.patch('/:id', authMiddleware, async (req, res, next) => {
  try {
    const request = Request.findById(req.params.id);
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    
    if (request.customerId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const { title, description, budget, location, scheduledDate } = req.body;
    const updated = Request.update(req.params.id, {
      title,
      description,
      budget,
      location,
      scheduledDate,
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Update request status
router.patch('/:id/status', authMiddleware, async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['open', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      throw new ApiError('Invalid status', 400);
    }
    
    const request = Request.findById(req.params.id);
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    
    if (request.customerId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    const updated = Request.updateStatus(req.params.id, status);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete request
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const request = Request.findById(req.params.id);
    if (!request) {
      throw new ApiError('Request not found', 404);
    }
    
    if (request.customerId !== req.userId) {
      throw new ApiError('Not authorized', 403);
    }
    
    Request.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
