const router = require('express').Router();
const Model = require('../models/Model');
const ModelVersion = require('../models/ModelVersion');
const Compliance = require('../models/Compliance');
const { auth, requireRole, asyncHandler } = require('../middleware/auth');
const { audit } = require('../services/audit');
const { REQUIRED_COMPLIANCE, requiredApprovers } = require('../config');
const { canTransition, evaluateFairness, fairnessPassed } = require('../services/governance');

// Get version detail (includes fairness evaluation + gate status)
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.id)
      .populate('model')
      .populate({ path: 'approvals', model: 'Approval' })
      .lean();
    if (!version) return res.status(404).json({ error: 'Version not found' });
    res.json({ version, fairnessEval: evaluateFairness(version), gate: null });
  })
);

// Create a new draft version
router.post(
  '/',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const { modelId, version, changelog, trainingDataset, algorithm, hyperparameters, evaluations, metrics, fairness } = req.body;
    const model = await Model.findById(modelId);
    if (!model) return res.status(404).json({ error: 'Model not found' });
    if (req.user.role === 'model_owner' && String(model.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the model owner can add versions to this model' });
    }
    const versionDoc = await ModelVersion.create({
      model: model._id,
      version,
      changelog,
      trainingDataset,
      algorithm,
      hyperparameters,
      evaluations,
      metrics,
      fairness,
      status: 'draft',
    });
    // seed compliance checklist per risk tier
    const required = REQUIRED_COMPLIANCE[model.riskTier] || [];
    if (required.length) {
      await Compliance.create({
        version: versionDoc._id,
        items: required.map((key) => ({ key, status: 'missing' })),
      });
    }
    await audit(req, 'version.create', 'version', versionDoc._id, `${model.name} v${versionDoc.version}`, { status: 'draft' });
    res.status(201).json({ version: versionDoc });
  })
);

// Update draft version metadata/metrics (owner only, while draft)
router.patch(
  '/:id',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.id).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (req.user.role === 'model_owner' && String(version.model.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the model owner can edit this version' });
    }
    if (version.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft versions can be edited' });
    }
    const allowed = ['changelog', 'trainingDataset', 'algorithm', 'hyperparameters', 'evaluations', 'metrics', 'fairness'];
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) version[k] = req.body[k];
    });
    await version.save();
    await audit(req, 'version.update', 'version', version._id, `${version.model.name} v${version.version}`, {});
    res.json({ version });
  })
);

// Submit for review: draft -> pending_review
router.post(
  '/:id/submit',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.id).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (req.user.role === 'model_owner' && String(version.model.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only the model owner can submit this version' });
    }
    if (!canTransition(version.status, 'pending_review')) {
      return res.status(400).json({ error: `Cannot submit from status "${version.status}"` });
    }
    version.status = 'pending_review';
    await version.save();
    // auto-open an approval request with the right number of approvers
    const Approval = require('../models/Approval');
    const existing = await Approval.findOne({ version: version._id, status: 'pending' });
    if (!existing) {
      await Approval.create({
        version: version._id,
        model: version.model._id,
        requestedBy: req.user._id,
        riskTier: version.model.riskTier,
        requiredApprovals: requiredApprovers(version.model.riskTier),
        approvals: [],
      });
    }
    await audit(req, 'version.submit', 'version', version._id, `${version.model.name} v${version.version}`, { status: 'pending_review' });
    res.json({ version });
  })
);

// Lifecycle transitions: approve / reject / deploy / deprecate / retire
router.post(
  '/:id/status',
  auth,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const version = await ModelVersion.findById(req.params.id).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });

    // Approve / reject only via reviewer routes; other transitions check roles here.
    if (status === 'approved' || status === 'rejected') {
      return res.status(400).json({ error: 'Use the approvals endpoint to approve or reject' });
    }
    const role = req.user.role;
    const isOwner = role === 'model_owner' && String(version.model.owner) === String(req.user._id);
    if (!['admin', 'model_owner'].includes(role) || (role === 'model_owner' && !isOwner)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    if (!canTransition(version.status, status)) {
      return res.status(400).json({ error: `Invalid transition ${version.status} -> ${status}` });
    }
    if (status === 'deployed') {
      const { deployGate } = require('../services/governance');
      const gate = await deployGate(version);
      if (!gate.ok) return res.status(400).json({ error: 'Deploy gate failed', blockers: gate.blockers });
    }
    version.status = status;
    if (status === 'deployed') {
      version.deployedAt = new Date();
      const Deployment = require('../models/Deployment');
      const env = req.body.environment || 'production';
      // only one active deployment per model+environment
      await Deployment.updateMany(
        { model: version.model._id, environment: env, active: true, version: { $ne: version._id } },
        { active: false }
      );
      await Deployment.create({
        version: version._id,
        model: version.model._id,
        environment: env,
        deployedBy: req.user._id,
        deployerName: req.user.name,
      });
      // baseline metrics for drift/accuracy monitoring
      if (version.metrics && version.metrics.size) {
        version.baselineMetrics = version.metrics;
        await version.save();
      }
    }
    await version.save();
    await audit(req, `version.${status}`, 'version', version._id, `${version.model.name} v${version.version}`, { status });
    res.json({ version });
  })
);

// Backfill baseline metrics for an already-deployed version (admin/owner)
router.post(
  '/:id/baseline',
  auth,
  requireRole('admin', 'model_owner'),
  asyncHandler(async (req, res) => {
    const version = await ModelVersion.findById(req.params.id).populate('model');
    if (!version) return res.status(404).json({ error: 'Version not found' });
    if (req.user.role === 'model_owner' && String(version.model.owner) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Not allowed' });
    }
    version.baselineMetrics = req.body.baseline || version.metrics;
    await version.save();
    await audit(req, 'version.baseline_set', 'version', version._id, `${version.model.name} v${version.version}`, {});
    res.json({ version });
  })
);

module.exports = router;
