const AuditLog = require('../models/AuditLog');

// Append-only audit helper. Never throws into request flow.
async function audit(req, action, targetType, targetId, targetLabel, details = {}) {
  try {
    await AuditLog.create({
      actor: req?.user?._id,
      actorName: req?.user?.name || 'system',
      action,
      targetType,
      targetId: targetId ? String(targetId) : '',
      targetLabel: targetLabel || '',
      details,
    });
  } catch (err) {
    console.error('Audit write failed:', err.message);
  }
}

module.exports = { audit };
