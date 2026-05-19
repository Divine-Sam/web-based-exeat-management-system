const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  request_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ExeatRequest', default: null },
  old_status: { type: String, default: null },
  new_status: { type: String, default: null },
  notes: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('AuditLog', auditLogSchema);
