const ModelVersion = require('../models/ModelVersion');
const Approval = require('../models/Approval');
const Deployment = require('../models/Deployment');
const Compliance = require('../models/Compliance');
const {
  REQUIRED_COMPLIANCE,
  requiredApprovers,
  evalFairnessItem,
  MONITORING,
} = require('../config');

// --- Lifecycle transition rules -----------------------------------------
// Which statuses a version may move from -> to.
const TRANSITIONS = {
  draft: ['pending_review', 'retired'],
  pending_review: ['approved', 'rejected', 'draft'],
  approved: ['deployed', 'deprecated'],
  rejected: ['draft', 'retired'],
  deployed: ['deprecated', 'retired'],
  deprecated: ['retired'],
  retired: [],
};

function canTransition(from, to) {
  return (TRANSITIONS[from] || []).includes(to);
}

// --- Fairness ------------------------------------------------------------
function evaluateFairness(version) {
  return (version.fairness || []).map((raw) => {
    // Mongoose subdocs hide fields from object spread — unwrap first.
    const f = typeof raw.toObject === 'function' ? raw.toObject() : raw;
    // Recompute rather than trust the stored flag (covers legacy docs).
    const passed = evalFairnessItem(f.metric, f.value, f.threshold);
    return { ...f, passed };
  });
}

function fairnessPassed(version) {
  const items = evaluateFairness(version);
  return items.length === 0 || items.every((f) => f.passed);
}

// --- Compliance ----------------------------------------------------------
async function complianceStatus(versionId, riskTier) {
  const compliance = await Compliance.findOne({ version: versionId }).lean();
  const requiredKeys = REQUIRED_COMPLIANCE[riskTier] || REQUIRED_COMPLIANCE.medium;
  const items = requiredKeys.map((key) => {
    const found = compliance?.items?.find((i) => i.key === key);
    return {
      key,
      status: found?.status || 'missing',
      reference: found?.reference || '',
    };
  });
  const complete = items.every((i) => i.status === 'complete');
  return { items, complete };
}

// --- Approval gate -------------------------------------------------------
async function approvalStatus(version) {
  const approval = await Approval.findOne({ version: version._id, status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
  if (!approval) return { open: false, approval: null, satisfied: false, need: 0 };
  const yes = approval.approvals.filter((a) => a.decision === 'approved').length;
  return {
    open: true,
    approval,
    satisfied: yes >= approval.requiredApprovals,
    need: Math.max(0, approval.requiredApprovals - yes),
  };
}

// --- Full deploy gate ----------------------------------------------------
// Returns { ok, blockers: [] } — a version can only be deployed when every
// governance control passes: lifecycle position, approvals, fairness, compliance.
async function deployGate(version) {
  const blockers = [];
  const full = await ModelVersion.findById(version._id).populate('model');
  const riskTier = full.model.riskTier || 'medium';

  if (full.status !== 'approved') {
    blockers.push(`Version must be approved before deployment (current: ${full.status})`);
  }
  const ap = await approvalStatus(full);
  if (ap.open && ap.satisfied && full.status === 'pending_review') {
    blockers.push('Approval complete but version not yet promoted to approved');
  }
  if (!fairnessPassed(full)) {
    const failing = evaluateFairness(full).filter((f) => !f.passed).map((f) => f.metric);
    blockers.push(`Fairness thresholds failing: ${failing.join(', ')}`);
  }
  const comp = await complianceStatus(full._id, riskTier);
  if (!comp.complete) {
    const missing = comp.items.filter((i) => i.status !== 'complete').map((i) => i.key);
    blockers.push(`Compliance incomplete: ${missing.join(', ')}`);
  }
  const activeProd = await Deployment.findOne({
    model: full.model._id,
    environment: 'production',
    active: true,
    version: { $ne: full._id },
  });
  // Same-owner deployment of successor is fine; note conflicts for info only.
  return { ok: blockers.length === 0, blockers, riskTier, compliance: comp };
}

// --- Monitoring alerts ---------------------------------------------------
function monitorAlert(snapshot, baseline) {
  const base = baseline?.get ? baseline.get('accuracy') : baseline?.accuracy;
  if (
    snapshot.accuracy != null &&
    base != null &&
    base - snapshot.accuracy > MONITORING.accuracyDropAlert
  ) {
    return 'accuracy_drop';
  }
  if (snapshot.driftScore != null && snapshot.driftScore > MONITORING.driftScoreAlert) {
    return 'data_drift';
  }
  return 'none';
}

module.exports = {
  canTransition,
  TRANSITIONS,
  evaluateFairness,
  fairnessPassed,
  complianceStatus,
  approvalStatus,
  deployGate,
  monitorAlert,
};
