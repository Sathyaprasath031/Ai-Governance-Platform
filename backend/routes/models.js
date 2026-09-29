const router = require('express').Router();
const mongoose = require('mongoose');
const Model = require('../models/Model');
const ModelVersion = require('../models/ModelVersion');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');
const { complianceStatus, approvalStatus, evaluateFairness } = require('../services/governance');

// List all models with their current version summary.
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const models = await Model.find({ archived: false }).sort({ updatedAt: -1 }).lean();
    const modelIds = models.map((m) => m._id);
    const versions = await ModelVersion.find({ model: { $in: modelIds } })
      .sort({ createdAt: -1 })
      .lean();

    const summary = models.map((m) => {
      const vs = versions.filter((v) => String(v.model) === String(m._id));
      const current = vs.find((v) => v.status === 'deployed') || vs[0];
      return {
        ...m,
        versionCount: vs.length,
        currentVersion: current
          ? { id: current._id, version: current.version, status: current.status }
          : null,
      };
    });
    res.json({ models: summary });
  })
);

// List archived models (auditors / admins).
router.get(
  '/archived',
  auth,
  asyncHandler(async (req, res) => {
    const models = await Model.find({ archived: true }).sort({ updatedAt: -1 }).lean();
    res.json({ models });
  })
);

router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const model = await Model.findById(req.params.id).lean();
    if (!model) return res.status(404).json({ error: 'Model not found' });
    const versions = (await ModelVersion.find({ model: model._id }).sort({ createdAt: -1 }).lean())
      .map((v) => ({ ...v, fairness: evaluateFairness(v) }));
    const deployments = await mongoose.model('Deployment').find({ model: model._id }).sort({ createdAt: -1 }).limit(10).lean();
    res.json({ model, versions, deployments });
  })
);

router.post(
  '/',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const { name, description, domain, riskTier, intendedUse, regulated } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = await Model.findOne({ slug });
    if (exists) return res.status(409).json({ error: 'A model with this name already exists' });
    const model = await Model.create({
      name,
      slug,
      description,
      domain,
      riskTier,
      intendedUse,
      regulated: !!regulated,
      owner: req.user._id,
      ownerName: req.user.name,
    });
    await audit(req, 'model.create', 'model', model._id, model.name, { riskTier, domain });
    res.status(201).json({ model });
  })
);

router.patch(
  '/:id',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const model = await Model.findById(req.params.id);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    if (req.user.role === 'model_owner' && String(model.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the model owner or an admin can edit this model' });
    }
    const allowed = ['description', 'domain', 'riskTier', 'intendedUse', 'regulated', 'archived'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) model[k] = req.body[k];
    });
    await model.save();
    await audit(req, 'model.update', 'model', model._id, model.name, req.body);
    res.json({ model });
  })
);

module.exports = router;
