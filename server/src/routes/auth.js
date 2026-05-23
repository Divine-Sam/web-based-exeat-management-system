const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { full_name, crawford_number, password, role } = req.body;
    if (!full_name || !crawford_number || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const existing = await User.findOne({ crawford_number: crawford_number.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'Crawford Number already registered.' });
    }

    const user = await User.create({ full_name, crawford_number: crawford_number.toUpperCase(), password, role });
    const token = signToken(user._id);

    res.status(201).json({ token, user: user.toProfile() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { crawford_number, password, role } = req.body;
    if (!crawford_number || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const user = await User.findOne({ crawford_number: crawford_number.toUpperCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Crawford Number or credentials.' });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `This account does not have ${role.replace('_', ' ')} access.` });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your Crawford Number and password.' });
    }

    const token = signToken(user._id);
    res.json({ token, user: user.toProfile() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toProfile() });
});

// ── Update Name ─────────────────────────────────────────────────────────────
router.put('/update-name', protect, async (req, res) => {
  try {
    const { full_name } = req.body;
    if (!full_name?.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { full_name: full_name.trim() },
      { new: true }
    );

    res.json({ user: user.toProfile() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Change Password ─────────────────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'Both current and new password are required.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(current_password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = new_password;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;