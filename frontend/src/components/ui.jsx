// Translucent badge palettes: solid dot + soft tinted pill.
// Dual-mode high contrast: crisp dark text on light surfaces, luminous pastel text in dark mode.
export const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20',
  pending_review: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
  rejected: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/25',
  deployed: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25',
  deprecated: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:border-orange-400/25',
  retired: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-400/10 dark:text-slate-400 dark:border-slate-400/20',
};

export const STATUS_DOTS = {
  draft: 'bg-slate-400',
  pending_review: 'bg-amber-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  deployed: 'bg-sky-500',
  deprecated: 'bg-orange-500',
  retired: 'bg-slate-500',
};

export const RISK_COLORS = {
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
  medium: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
  high: 'bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:border-orange-400/25',
  critical: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-400/15 dark:text-rose-300 dark:border-rose-400/30',
};

export const RISK_DOTS = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  critical: 'bg-rose-500',
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
    <span className={`badge ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[status] || 'bg-slate-400'}`} />
      {status.replace('_', ' ')}
    </span>
  );
}

export function RiskBadge({ tier }) {
  return (
    <span className={`badge ${RISK_COLORS[tier] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOTS[tier] || 'bg-slate-400'}`} />
      {tier} risk
    </span>
  );
}
