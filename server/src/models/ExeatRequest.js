const mongoose = require('mongoose');

const exeatRequestSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true, trim: true },
  reason_description: { type: String, required: true, trim: true },
  reason_category: {
    type: String,
    enum: ['Medical', 'Family Emergency', 'Official', 'Personal', 'Academic'],
    required: true,
  },
  // ── Parent Contact ──────────────────────────────
  parent_name: { type: String, required: true, trim: true },
  parent_phone: { type: String, required: true, trim: true },
  parent_relationship: { type: String, required: true, trim: true },
  // ─────────────────────────────────────────────────
  supporting_document_path: { type: String, default: null },
  supporting_document_name: { type: String, default: null },
  departure_date: { type: String, required: true },
  return_date: { type: String, required: true },
  total_days: { type: Number, required: true },
  academic_session: { type: String, required: true },
  status: {
    type: String,
    enum: [
      'PENDING_HALL_ADMIN',
      'APPROVED_BY_HALL_ADMIN',
      'REJECTED_BY_HALL_ADMIN',
      'APPROVED_FINAL',
      'REJECTED_BY_DEAN',
      'CHECKED_OUT',
      'CHECKED_IN',
    ],
    default: 'PENDING_HALL_ADMIN',
  },
  hall_admin_comment: { type: String, default: null },
  dean_comment: { type: String, default: null },
  checkout_time: { type: Date, default: null },
  checkin_time: { type: Date, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('ExeatRequest', exeatRequestSchema);