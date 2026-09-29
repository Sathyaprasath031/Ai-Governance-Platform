const router = require('express').Router();
const AuditLog = require('../models/AuditLog');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');

// Audit trail: auditors and admins see everything; others see nothing.
router.get(
  '/',
  auth,
  requireRole('admin', 'auditor'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.targetId) filter.targetId = req.query.targetId;
    if (req.query.action) filter.action = req.query.action;
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const entries = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
    res.json({ entries });
  })
);

module.exports = router;
