const router = require('express').Router();
const ModelVersion = require('../models/ModelVersion');
const Monitoring = require('../models/Monitoring');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');
const { monitorAlert, canTransition } = require('../services/governance');

// Monitoring history for a version
router.get(
  '/:versionId',
  auth,
  asyncHandler(async (req, res) => {
    const snapshots = await Monitoring.find({ version: req.params.versionId })
      .sort({ recordedAt: -1 })
      .limit(100)
      .lean();
    res.json({ snapshots });
  })
);

// Record a production monitoring snapshot (ops role or admin/owner)
router.post(
  '/:versionId',
  auth,
  requireRole('admin', 'model_owner', 'reviewer'),
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.versionId).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    const { accuracy, latencyMs, requestCount, driftScore, note } = req.body;
    const snapshot = await Monitoring.create({
      version: version._id,
      accuracy,
      latencyMs,
      requestCount,
      driftScore,
      note,
      alert: monitorAlert({ accuracy, driftScore }, version.baselineMetrics),
    });
    await audit(req, 'monitoring.record', 'version', version._id, `${version.model.name} v${version.version}`, {
      accuracy,
      driftScore,
      alert: snapshot.alert,
    });
    res.status(201).json({ snapshot });
  })
);

// Drift alert: force version back to review (deployed -> deprecated) when monitoring fails
router.post(
  '/:versionId/flag',
  auth,
  requireRole('admin', 'reviewer'),
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.versionId).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (!canTransition(version.status, 'deprecated')) {
      return res.status(400).json({ error: `Cannot deprecate from status "${version.status}"` });
    }
    version.status = 'deprecated';
    await version.save();
    const Deployment = require('../models/Deployment');
    await Deployment.updateMany({ version: version._id, active: true }, { active: false });
    await audit(req, 'monitoring.flag_deprecated', 'version', version._id, `${version.model.name} v${version.version}`, {
      reason: req.body.reason || 'monitoring alert',
    });
    res.json({ version });
  })
);

module.exports = router;
