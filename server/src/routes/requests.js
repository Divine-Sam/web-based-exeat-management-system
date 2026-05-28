const express = require('express');
const ExeatRequest = require('../models/ExeatRequest');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getCurrentAcademicSession, logAudit } = require('../utils/helpers');

const router = express.Router();

function calcDays(dep, ret) {
  return Math.ceil((new Date(ret) - new Date(dep)) / (1000 * 60 * 60 * 24));
}

async function populatedRequest(id) {
  return ExeatRequest.findById(id).populate('student_id', 'full_name crawford_number role');
}

function formatRequest(r) {
  if (!r) return null;
  const obj = r.toObject ? r.toObject() : r;
  const student = obj.student_id;
  return {
    ...obj,
    id: obj._id?.toString(),
    student_id: student?._id?.toString() || obj.student_id?.toString(),
    profiles: student ? {
      id: student._id?.toString(),
      full_name: student.full_name,
      crawford_number: student.crawford_number,
      role: student.role,
    } : undefined,
  };
}

// ── Student: Create ────────────────────────────────────────────────────────
router.post('/', protect, requireRole('student'), upload.single('document'), async (req, res) => {
  try {
    const {
      destination, reason_description, reason_category,
      departure_date, return_date,
      parent_name, parent_phone, parent_relationship
    } = req.body;

    if (!destination || !reason_description || !reason_category ||
        !departure_date || !return_date ||
        !parent_name || !parent_phone || !parent_relationship) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const session = getCurrentAcademicSession();
    const studentId = req.user._id;

    const count = await ExeatRequest.countDocuments({ student_id: studentId, academic_session: session });
    if (count >= 5) return res.status(400).json({ message: 'Maximum exeat request limit for this session has been reached.' });

    const totalDays = calcDays(departure_date, return_date);
    if (totalDays <= 0) return res.status(400).json({ message: 'Return date must be after departure date.' });
    if (totalDays > 5)  return res.status(400).json({ message: 'Exeat duration cannot exceed 5 days.' });

    const overlaps = await ExeatRequest.findOne({
      student_id: studentId,
      status: { $in: ['PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN', 'APPROVED_FINAL', 'CHECKED_OUT'] },
      departure_date: { $lte: return_date },
      return_date:    { $gte: departure_date },
    });
    if (overlaps) return res.status(400).json({ message: 'You already have an active exeat within the selected dates.' });
    if (!req.file) return res.status(400).json({ message: 'Supporting document is required.' });

    const request = await ExeatRequest.create({
      student_id: studentId,
      destination,
      reason_description,
      reason_category,
      departure_date,
      return_date,
      total_days: totalDays,
      academic_session: session,
      parent_name,
      parent_phone,
      parent_relationship,
      supporting_document_path: req.file.filename,
      supporting_document_name: req.file.originalname,
      status: 'PENDING_HALL_ADMIN',
    });

    await logAudit(studentId, 'REQUEST_CREATED', request._id, null, 'PENDING_HALL_ADMIN');
    const populated = await populatedRequest(request._id);
    res.status(201).json(formatRequest(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: Update ────────────────────────────────────────────────────────
router.put('/:id', protect, requireRole('student'), upload.single('document'), async (req, res) => {
  try {
    const existing = await ExeatRequest.findOne({ _id: req.params.id, student_id: req.user._id });
    if (!existing) return res.status(404).json({ message: 'Request not found.' });
    if (existing.status !== 'PENDING_HALL_ADMIN') return res.status(400).json({ message: 'Only pending requests can be edited.' });

    const { destination, reason_description, reason_category, departure_date, return_date } = req.body;
    const totalDays = calcDays(departure_date, return_date);
    if (totalDays <= 0) return res.status(400).json({ message: 'Return date must be after departure date.' });
    if (totalDays > 5)  return res.status(400).json({ message: 'Exeat duration cannot exceed 5 days.' });

    const overlaps = await ExeatRequest.findOne({
      student_id: req.user._id,
      _id: { $ne: existing._id },
      status: { $in: ['PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN', 'APPROVED_FINAL', 'CHECKED_OUT'] },
      departure_date: { $lte: return_date },
      return_date:    { $gte: departure_date },
    });
    if (overlaps) return res.status(400).json({ message: 'You already have an active exeat within the selected dates.' });

    existing.destination        = destination;
    existing.reason_description = reason_description;
    existing.reason_category    = reason_category;
    existing.departure_date     = departure_date;
    existing.return_date        = return_date;
    existing.total_days         = totalDays;

    if (req.file) {
      existing.supporting_document_path = req.file.filename;
      existing.supporting_document_name = req.file.originalname;
    }

    await existing.save();
    await logAudit(req.user._id, 'REQUEST_EDITED', existing._id, 'PENDING_HALL_ADMIN', 'PENDING_HALL_ADMIN');
    const populated = await populatedRequest(existing._id);
    res.json(formatRequest(populated));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: Cancel ────────────────────────────────────────────────────────
router.delete('/:id', protect, requireRole('student'), async (req, res) => {
  try {
    const request = await ExeatRequest.findOne({ _id: req.params.id, student_id: req.user._id });
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'PENDING_HALL_ADMIN') return res.status(400).json({ message: 'Only pending requests can be cancelled.' });

    await logAudit(req.user._id, 'REQUEST_CANCELLED', request._id, 'PENDING_HALL_ADMIN', null);
    await request.deleteOne();
    res.json({ message: 'Request cancelled.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: My Requests ───────────────────────────────────────────────────
router.get('/my', protect, requireRole('student'), async (req, res) => {
  try {
    const requests = await ExeatRequest.find({ student_id: req.user._id })
      .populate('student_id', 'full_name crawford_number role')
      .sort({ created_at: -1 });
    res.json(requests.map(formatRequest));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Student: Stats ─────────────────────────────────────────────────────────
router.get('/my/stats', protect, requireRole('student'), async (req, res) => {
  try {
    const session = getCurrentAcademicSession();
    const all = await ExeatRequest.find({ student_id: req.user._id, academic_session: session }).select('status');
    rres.json({
  total:     all.filter(r => !['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'].includes(r.status)).length,
  pending:   all.filter(r => ['PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN'].includes(r.status)).length,
  approved:  all.filter(r => ['APPROVED_FINAL', 'CHECKED_OUT', 'CHECKED_IN'].includes(r.status)).length,
  rejected:  all.filter(r => ['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'].includes(r.status)).length,
  remaining: Math.max(0, 5 - all.filter(r => !['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'].includes(r.status)).length),
  session,
});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Stats ───────────────────────────────────────────────────────────
router.get('/admin/stats', protect, requireRole('hall_admin', 'dean', 'security'), async (req, res) => {
  try {
    const all = await ExeatRequest.find().select('status created_at');

    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const todayTotal = all.filter(r => {
      const d = new Date(r.created_at);
      return d >= startOfDay && d <= endOfDay;
    }).length;

    const totalApproved = all.filter(r =>
      ['APPROVED_FINAL', 'CHECKED_OUT', 'CHECKED_IN'].includes(r.status)
    ).length;

    res.json({
      total:            all.length,
      todayTotal,
      totalApproved,
      pendingHallAdmin: all.filter(r => r.status === 'PENDING_HALL_ADMIN').length,
      pendingDean:      all.filter(r => r.status === 'APPROVED_BY_HALL_ADMIN').length,
      approvedFinal:    all.filter(r => r.status === 'APPROVED_FINAL').length,
      checkedOut:       all.filter(r => r.status === 'CHECKED_OUT').length,
      checkedIn:        all.filter(r => r.status === 'CHECKED_IN').length,
      rejected:         all.filter(r => ['REJECTED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN'].includes(r.status)).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: All Requests ────────────────────────────────────────────────────
router.get('/all', protect, requireRole('hall_admin', 'dean', 'security'), async (req, res) => {
  try {
    const filter = {};

    if (req.query.todayOnly === 'true') {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      filter.created_at = { $gte: startOfDay, $lte: endOfDay };
    }
    else if (req.query.status) {
      filter.status = req.query.status;
    }
    else if (req.user.role === 'hall_admin' || req.user.role === 'dean') {
      filter.status = { $nin: ['CHECKED_OUT', 'CHECKED_IN'] };
    }

    let requests = await ExeatRequest.find(filter)
      .populate('student_id', 'full_name crawford_number role')
      .sort({ created_at: -1 });

    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      requests = requests.filter(r => {
        const p = r.student_id;
        return (
          p?.full_name?.toLowerCase().includes(s) ||
          p?.crawford_number?.toLowerCase().includes(s) ||
          r.destination?.toLowerCase().includes(s)
        );
      });
    }

    res.json(requests.map(formatRequest));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Shared: Get by ID ──────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id)
      .populate('student_id', 'full_name crawford_number role');
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (req.user.role === 'student' && request.student_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    res.json(formatRequest(request));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Hall Admin: Approve ────────────────────────────────────────────────────
router.post('/:id/hall-approve', protect, requireRole('hall_admin'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'PENDING_HALL_ADMIN') return res.status(400).json({ message: 'Request must be pending Hall Admin review.' });
    request.status             = 'APPROVED_BY_HALL_ADMIN';
    request.hall_admin_comment = req.body.comment || '';
    await request.save();
    await logAudit(req.user._id, 'HALL_ADMIN_APPROVED', request._id, 'PENDING_HALL_ADMIN', 'APPROVED_BY_HALL_ADMIN', req.body.comment);
    res.json({ message: 'Approved by Hall Admin.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Hall Admin: Reject ─────────────────────────────────────────────────────
router.post('/:id/hall-reject', protect, requireRole('hall_admin'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'PENDING_HALL_ADMIN') return res.status(400).json({ message: 'Request must be pending Hall Admin review.' });
    if (!req.body.comment?.trim()) return res.status(400).json({ message: 'Rejection reason is required.' });
    request.status             = 'REJECTED_BY_HALL_ADMIN';
    request.hall_admin_comment = req.body.comment;
    await request.save();
    await logAudit(req.user._id, 'HALL_ADMIN_REJECTED', request._id, 'PENDING_HALL_ADMIN', 'REJECTED_BY_HALL_ADMIN', req.body.comment);
    res.json({ message: 'Rejected by Hall Admin.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Dean: Approve ──────────────────────────────────────────────────────────
router.post('/:id/dean-approve', protect, requireRole('dean'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'APPROVED_BY_HALL_ADMIN') return res.status(400).json({ message: 'Request must be approved by Hall Admin first.' });
    request.status       = 'APPROVED_FINAL';
    request.dean_comment = req.body.comment || '';
    await request.save();
    await logAudit(req.user._id, 'DEAN_APPROVED', request._id, 'APPROVED_BY_HALL_ADMIN', 'APPROVED_FINAL', req.body.comment);
    res.json({ message: 'Final approval granted by Dean.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Dean: Reject ───────────────────────────────────────────────────────────
router.post('/:id/dean-reject', protect, requireRole('dean'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'APPROVED_BY_HALL_ADMIN') return res.status(400).json({ message: 'Request must be approved by Hall Admin first.' });
    if (!req.body.comment?.trim()) return res.status(400).json({ message: 'Rejection reason is required.' });
    request.status       = 'REJECTED_BY_DEAN';
    request.dean_comment = req.body.comment;
    await request.save();
    await logAudit(req.user._id, 'DEAN_REJECTED', request._id, 'APPROVED_BY_HALL_ADMIN', 'REJECTED_BY_DEAN', req.body.comment);
    res.json({ message: 'Rejected by Dean.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Security: Check Out ────────────────────────────────────────────────────
router.post('/:id/checkout', protect, requireRole('security'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'APPROVED_FINAL') return res.status(400).json({ message: 'Request must have final approval before check-out.' });
    request.status        = 'CHECKED_OUT';
    request.checkout_time = new Date();
    await request.save();
    await logAudit(req.user._id, 'CHECKED_OUT', request._id, 'APPROVED_FINAL', 'CHECKED_OUT');
    res.json({ message: 'Student checked out.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Security: Check In ─────────────────────────────────────────────────────
router.post('/:id/checkin', protect, requireRole('security'), async (req, res) => {
  try {
    const request = await ExeatRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found.' });
    if (request.status !== 'CHECKED_OUT') return res.status(400).json({ message: 'Student must be checked out before checking in.' });
    request.status       = 'CHECKED_IN';
    request.checkin_time = new Date();
    await request.save();
    await logAudit(req.user._id, 'CHECKED_IN', request._id, 'CHECKED_OUT', 'CHECKED_IN');
    res.json({ message: 'Student checked in.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;