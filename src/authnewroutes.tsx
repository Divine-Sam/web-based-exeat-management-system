// ── Add these two routes to server/src/routes/auth.js ──────────────────────
// Place them after the GET /me route

const bcrypt = require('bcryptjs');  // already imported at top of auth.js

// ── Update Name ─────────────────────────────────────────────────────────────
router.put('/update-name', protect, async (req, res) => {
  try {
    const { full_name } = req.body;
    if (!full_name?.trim()) {
      return res.status(400).json({ message: 'Full name is required.' });
    }

    req.user.full_name = full_name.trim();
    await req.user.save();

    res.json({
      user: {
        id: req.user._id,
        full_name: req.user.full_name,
        crawford_number: req.user.crawford_number,
        role: req.user.role,
      }
    });
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

    // Verify current password
    // Note: req.user from protect middleware may not include password field
    // Re-fetch user with password selected
    const User = require('../models/User');
    const userWithPassword = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(current_password, userWithPassword.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    // Hash and save new password
    userWithPassword.password = await bcrypt.hash(new_password, 10);
    await userWithPassword.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});