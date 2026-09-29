const router = require('express').Router();
const ModelVersion = require('../models/ModelVersion');
const Approval = require('../models/Approval');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');
const { APPROVER_ROLES } = require('../config');

// List open approvals (review queue)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const approvals = await Approval.find({ status: 'pending' })
      .populate('version')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: 1 })
      .lean();
    // filter out versions that have moved on
    const open = approvals.filter((a) => a.version && a.version.status === 'pending_review');
    res.json({ approvals: open });
  })
);

// Decide on an approval (approve / reject). Separation of duties: requester cannot decide.
router.post(
  '/:id/decide',
  auth,
  requireRole(...APPROVER_ROLES),
  asyncHandler(async (req, res) => {
    const { decision, comment } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'decision must be "approved" or "rejected"' });
    }
    const approval = await Approval.findById(req.params.id).populate('version');
    if (!approval) return res.status(404).json({ error: 'Approval request not found' });
    const version = await ModelVersion.findById(approval.version._id).populate('model');
    if (!version || version.status !== 'pending_review') {
      return res.status(400).json({ error: 'This version is no longer pending review' });
    }
    if (String(approval.requestedBy) === String(req.user._id)) {
      return res.status(403).json({ error: 'Separation of duties: the requester cannot decide their own approval' });
    }
    const already = approval.approvals.find((a) => String(a.reviewer) === String(req.user._id));
    if (already) return res.status(400).json({ error: 'You have already decided on this request' });

    approval.approvals.push({
      reviewer: req.user._id,
      reviewerName: req.user.name,
      decision,
      comment: comment || '',
      decidedAt: new Date(),
    });
    const yes = approval.approvals.filter((a) => a.decision === 'approved').length;
    const no = approval.approvals.filter((a) => a.decision === 'rejected').length;
    if (no > 0) {
      approval.status = 'rejected';
      approval.decidedAt = new Date();
      version.status = 'rejected';
      await Promise.all([approval.save(), version.save()]);
    } else if (yes >= approval.requiredApprovals) {
      approval.status = 'approved';
      approval.decidedAt = new Date();
      version.status = 'approved';
      await Promise.all([approval.save(), version.save()]);
    } else {
      await approval.save();
    }
    await audit(req, 'approval.decide', 'approval', approval._id, `${version.model.name} v${version.version} — ${decision}`, {
      decision,
      comment,
      approvalsSoFar: yes,
      required: approval.requiredApprovals,
    });
    res.json({ approval, versionStatus: version.status });
  })
);

module.exports = router;
