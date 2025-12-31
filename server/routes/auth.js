import express from 'express';
import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      throw new ApiError('All fields are required', 400);
    }
    
    if (!['customer', 'helper'].includes(role)) {
      throw new ApiError('Invalid role', 400);
    }
    
    const existingUser = User.findByEmail(email);
    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }
    
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user = User.create({ id: userId, name, email, password, role });
    const token = generateToken(userId);
    
    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new ApiError('Email and password are required', 400);
    }
    
    const user = User.findByEmail(email);
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    const isValid = User.verifyPassword(password, user.password);
    if (!isValid) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    delete user.password;
    const token = generateToken(user.id);
    
    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = User.findById(req.userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update profile
router.patch('/me', authMiddleware, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = User.update(req.userId, { name, avatar });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get all users (with filters)
router.get('/', async (req, res, next) => {
  try {
    const { role, limit = 50, offset = 0 } = req.query;
    const users = User.getAll({ 
      role, 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

export default router;
