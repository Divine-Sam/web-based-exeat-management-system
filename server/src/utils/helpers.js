const AuditLog = require('../models/AuditLog');

function getCurrentAcademicSession() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

async function logAudit(userId, action, requestId = null, oldStatus = null, newStatus = null, notes = null) {
  try {
    await AuditLog.create({ user_id: userId, action, request_id: requestId, old_status: oldStatus, new_status: newStatus, notes });
  } catch (e) {
    console.error('Audit log error:', e.message);
  }
}

module.exports = { getCurrentAcademicSession, logAudit };
