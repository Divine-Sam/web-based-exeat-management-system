const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireRole('hall_admin', 'dean'), async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('user_id', 'full_name crawford_number role')
      .populate('request_id', 'destination academic_session')
      .sort({ created_at: -1 })
      .limit(100);

    const formatted = logs.map(l => {
      const obj = l.toObject();
      return {
        ...obj,
        id: obj._id?.toString(),
        profiles: obj.user_id ? {
          id: obj.user_id._id?.toString(),
          full_name: obj.user_id.full_name,
          crawford_number: obj.user_id.crawford_number,
          role: obj.user_id.role,
        } : null,
        exeat_requests: obj.request_id ? {
          destination: obj.request_id.destination,
          academic_session: obj.request_id.academic_session,
        } : null,
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
