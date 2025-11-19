const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('rank').optional().trim(),
    body('organization').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, firstName, lastName, rank, organization, role } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ 
          error: { message: 'User already exists with this email' } 
        });
      }

      // Create user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        rank,
        organization,
        role: role || 'planner'
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: { message: 'Registration failed' } });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ 
          error: { message: 'Invalid credentials' } 
        });
      }

      // Check password
      const isValid = await user.validatePassword(password);
      if (!isValid) {
        return res.status(401).json({ 
          error: { message: 'Invalid credentials' } 
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ 
          error: { message: 'Account is inactive' } 
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({
        user: user.toJSON(),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: { message: 'Login failed' } });
    }
  }
);

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

// Update profile
router.put('/profile', authenticate,
  [
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    body('rank').optional().trim(),
    body('organization').optional().trim()
  ],
  async (req, res) => {
    try {
      const { firstName, lastName, rank, organization } = req.body;

      await req.user.update({
        firstName,
        lastName,
        rank,
        organization
      });

      res.json({ user: req.user.toJSON() });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: { message: 'Profile update failed' } });
    }
  }
);

module.exports = router;
