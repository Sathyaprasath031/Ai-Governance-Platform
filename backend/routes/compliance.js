const router = require('express').Router();
const ModelVersion = require('../models/ModelVersion');
const Compliance = require('../models/Compliance');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');
const { REQUIRED_COMPLIANCE, COMPLIANCE_LABELS } = require('../config');
const { complianceStatus } = require('../services/governance');

// Get compliance checklist for a version
router.get(
  '/:versionId',
  auth,
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.versionId).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    const riskTier = version.model.riskTier || 'medium';
    const status = await complianceStatus(version._id, riskTier);
    res.json({
      ...status,
      required: REQUIRED_COMPLIANCE[riskTier],
      labels: COMPLIANCE_LABELS,
      riskTier,
    });
  })
);

// Update a compliance item (owner completes docs; reviewer/admin verifies)
router.patch(
  '/:versionId/items/:key',
  auth,
  requireRole('admin', 'model_owner', 'reviewer'),
  asyncHandler(async (req, res) => {
    const { status, reference } = req.body;
    const version = await ModelVersion.findById(req.params.versionId).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    let compliance = await Compliance.findOne({ version: version._id });
    if (!compliance) {
      compliance = await Compliance.create({
        version: version._id,
        items: (REQUIRED_COMPLIANCE[version.model.riskTier] || []).map((key) => ({ key, status: 'missing' })),
      });
    }
    const item = compliance.items.find((i) => i.key === req.params.key);
    if (!item) return res.status(404).json({ error: 'Unknown compliance item for this risk tier' });
    if (status) item.status = status;
    if (reference !== undefined) item.reference = reference;
    item.updatedBy = req.user._id;
    await compliance.save();
    await audit(req, 'compliance.update', 'compliance', version._id, `${version.model.name} v${version.version} — ${req.params.key}`, {
      key: req.params.key,
      status: item.status,
    });
    res.json({ compliance });
  })
);

module.exports = router;
