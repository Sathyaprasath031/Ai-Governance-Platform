// Translucent badge palettes: solid dot + soft tinted pill.
// Text uses a light-mode tone plus dark: variant for the dark theme.
export const STATUS_COLORS = {
  draft: 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/20',
  pending_review: 'bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-400/25',
  approved: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/25',
  rejected: 'bg-rose-400/10 text-rose-700 dark:text-rose-300 border-rose-400/25',
  deployed: 'bg-sky-400/10 text-sky-700 dark:text-sky-300 border-sky-400/25',
  deprecated: 'bg-orange-400/10 text-orange-700 dark:text-orange-300 border-orange-400/25',
  retired: 'bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/20',
};

export const STATUS_DOTS = {
  draft: 'bg-slate-400',
  pending_review: 'bg-amber-400',
  approved: 'bg-emerald-400',
  rejected: 'bg-rose-400',
  deployed: 'bg-sky-400',
  deprecated: 'bg-orange-400',
  retired: 'bg-slate-500',
};

export const RISK_COLORS = {
  low: 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/25',
  medium: 'bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-400/25',
  high: 'bg-orange-400/10 text-orange-700 dark:text-orange-300 border-orange-400/25',
  critical: 'bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-400/30',
};

export const RISK_DOTS = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-rose-400',
};

export const COMPLIANCE_LABELS = {
  model_card: 'Model card published',
  datasheet: 'Training data datasheet',
  bias_assessment: 'Bias & fairness assessment',
  security_review: 'Security review',
  human_oversight: 'Human oversight plan',
  legal_signoff: 'Legal / regulatory sign-off',
  incident_response_plan: 'Incident response plan',
};

export const FAIRNESS_LABELS = {
  demographic_parity_difference: 'Demographic parity diff',
  equal_opportunity_difference: 'Equal opportunity diff',
  equalized_odds_difference: 'Equalized odds diff',
  disparate_impact_ratio: 'Disparate impact ratio',
  selection_rate_ratio: 'Selection rate ratio',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_COLORS[status] || 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`} />
      {status.replace('_', ' ')}
    </span>
  );
}

export function RiskBadge({ tier }) {
  return (
    <span className={`badge ${RISK_COLORS[tier] || 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOTS[tier] || 'bg-slate-400'}`} />
      {tier} risk
    </span>
  );
}
