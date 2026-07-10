const express = require('express');
const User = require('../models/User');
const ExeatRequest = require('../models/ExeatRequest');
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// ── Get all users ──────────────────────────────────────────────────────────
router.get('/users', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 });
    res.json(users.map(u => u.toProfile()));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Create user ────────────────────────────────────────────────────────────
router.post('/users', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const { full_name, crawford_number, password, role } = req.body;
    if (!full_name || !crawford_number || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existing = await User.findOne({ crawford_number: crawford_number.toUpperCase() });
    if (existing) return res.status(409).json({ message: 'Crawford ID already registered.' });

    const user = await User.create({
      full_name,
      crawford_number: crawford_number.toUpperCase(),
      password,
      role,
    });
    res.status(201).json(user.toProfile());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update user role ───────────────────────────────────────────────────────
router.put('/users/:id/role', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required.' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user.toProfile());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Delete user ────────────────────────────────────────────────────────────
router.delete('/users/:id', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'superadmin') return res.status(400).json({ message: 'Cannot delete superadmin.' });
    await user.deleteOne();
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── System stats ───────────────────────────────────────────────────────────
router.get('/stats', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const [users, requests] = await Promise.all([
      User.find().select('role'),
      ExeatRequest.find().select('status created_at'),
    ]);

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    res.json({
      totalUsers:    users.length,
      students:      users.filter(u => u.role === 'student').length,
      hallAdmins:    users.filter(u => u.role === 'hall_admin').length,
      deans:         users.filter(u => u.role === 'dean').length,
      security:      users.filter(u => u.role === 'security').length,
      totalRequests: requests.length,
      todayRequests: requests.filter(r => new Date(r.created_at) >= startOfDay).length,
      pending:       requests.filter(r => r.status === 'PENDING_HALL_ADMIN').length,
      approvedFinal: requests.filter(r => r.status === 'APPROVED_FINAL').length,
      checkedOut:    requests.filter(r => r.status === 'CHECKED_OUT').length,
      checkedIn:     requests.filter(r => r.status === 'CHECKED_IN').length,
      rejected:      requests.filter(r => ['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'].includes(r.status)).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── All requests ───────────────────────────────────────────────────────────
router.get('/requests', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const requests = await ExeatRequest.find(filter)
      .populate('student_id', 'full_name crawford_number role')
      .sort({ created_at: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Audit logs ─────────────────────────────────────────────────────────────
router.get('/audit', protect, requireRole('superadmin'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user_id', 'full_name crawford_number role')
      .sort({ created_at: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;