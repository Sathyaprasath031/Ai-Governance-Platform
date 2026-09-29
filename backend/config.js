// Central governance configuration.
// The lifecycle state machine, compliance requirements per risk tier,
// and approval rules all live here so policy is defined in one place.

const VERSION_STATUSES = [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'deployed',
  'deprecated',
  'retired',
];

const RISK_TIERS = ['low', 'medium', 'high', 'critical'];

const ROLES = ['admin', 'model_owner', 'reviewer', 'auditor', 'viewer'];

// Compliance documentation required before a version may be deployed,
// keyed by the model's risk tier.
const REQUIRED_COMPLIANCE = {
  low: ['model_card'],
  medium: ['model_card', 'datasheet', 'bias_assessment'],
  high: ['model_card', 'datasheet', 'bias_assessment', 'security_review', 'human_oversight'],
  critical: [
    'model_card',
    'datasheet',
    'bias_assessment',
    'security_review',
    'human_oversight',
    'legal_signoff',
    'incident_response_plan',
  ],
};

const COMPLIANCE_LABELS = {
  model_card: 'Model card published',
  datasheet: 'Training data datasheet',
  bias_assessment: 'Bias & fairness assessment',
  security_review: 'Security review',
  human_oversight: 'Human oversight plan',
  legal_signoff: 'Legal / regulatory sign-off',
  incident_response_plan: 'Incident response plan',
};

// Distinct approvers required before a version becomes "approved".
function requiredApprovers(riskTier) {
  return riskTier === 'high' || riskTier === 'critical' ? 2 : 1;
}

// Roles allowed to make decisions on approval requests.
const APPROVER_ROLES = ['reviewer', 'admin'];

// Roles allowed to own/manage models and versions.
const MANAGER_ROLES = ['model_owner', 'admin'];

// Fairness metrics where the raw value must stay BELOW the threshold
// (difference-style metrics). Ratio-style metrics use >= instead.
const DIFFERENCE_METRICS = [
  'demographic_parity_difference',
  'equal_opportunity_difference',
  'equalized_odds_difference',
];

// Production monitoring thresholds.
const MONITORING = {
  accuracyDropAlert: 0.05, // alert if production accuracy drops >5 points vs baseline
  driftScoreAlert: 0.2, // alert if data drift score exceeds this
};

// Evaluate a single fairness entry. Difference-style metrics must stay within
// the threshold (|value| <= threshold); ratio-style metrics must meet it (>=).
function evalFairnessItem(metric, value, threshold) {
  if (value == null || threshold == null) return false;
  if (DIFFERENCE_METRICS.includes(metric)) return Math.abs(value) <= threshold;
  return value >= threshold;
}

module.exports = {
  VERSION_STATUSES,
  RISK_TIERS,
  ROLES,
  REQUIRED_COMPLIANCE,
  COMPLIANCE_LABELS,
  requiredApprovers,
  APPROVER_ROLES,
  MANAGER_ROLES,
  DIFFERENCE_METRICS,
  evalFairnessItem,
  MONITORING,
};
