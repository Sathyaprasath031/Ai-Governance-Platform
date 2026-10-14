import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  X,
  ArrowUpRight,
  ArrowRight,
  CreditCard,
  ShieldAlert,
  MessageSquare,
  Eye,
  TrendingUp,
  Sparkles,
  Box,
  Search,
  Filter,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import api from '../api';
import { StatusBadge, RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', description: '', domain: 'other', riskTier: 'medium', intendedUse: '', regulated: false };

const LIFECYCLE_STAGES = [
  { label: 'Draft', badge: 'border-slate-300 dark:border-slate-500/20 bg-slate-100/80 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  { label: 'Pending Review', badge: 'border-amber-300 dark:border-amber-400/25 bg-amber-50/80 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  { label: 'Approved', badge: 'border-emerald-300 dark:border-emerald-400/25 bg-emerald-50/80 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { label: 'Deployed', badge: 'border-sky-300 dark:border-sky-400/25 bg-sky-50/80 dark:bg-sky-400/10 text-sky-800 dark:text-sky-300', dot: 'bg-sky-500' },
  { label: 'Deprecated', badge: 'border-rose-300 dark:border-rose-400/25 bg-rose-50/80 dark:bg-rose-400/10 text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
];

const SUPPORTED_DOMAINS = [
  { key: 'credit_risk', label: 'Credit Risk', icon: CreditCard, badge: 'border-amber-300/80 dark:border-amber-400/20 bg-amber-50/80 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300', iconColor: 'text-amber-600 dark:text-amber-400' },
  { key: 'fraud', label: 'Fraud', icon: ShieldAlert, badge: 'border-rose-300/80 dark:border-rose-400/20 bg-rose-50/80 dark:bg-rose-400/10 text-rose-800 dark:text-rose-300', iconColor: 'text-rose-600 dark:text-rose-400' },
  { key: 'nlp', label: 'NLP', icon: MessageSquare, badge: 'border-sky-300/80 dark:border-sky-400/20 bg-sky-50/80 dark:bg-sky-400/10 text-sky-800 dark:text-sky-300', iconColor: 'text-sky-600 dark:text-sky-400' },
  { key: 'vision', label: 'Vision', icon: Eye, badge: 'border-purple-300/80 dark:border-purple-400/20 bg-purple-50/80 dark:bg-purple-400/10 text-purple-800 dark:text-purple-300', iconColor: 'text-purple-600 dark:text-purple-400' },
  { key: 'forecasting', label: 'Forecasting', icon: TrendingUp, badge: 'border-emerald-300/80 dark:border-emerald-400/20 bg-emerald-50/80 dark:bg-emerald-400/10 text-emerald-800 dark:text-emerald-300', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'recommendation', label: 'Recommendation', icon: Sparkles, badge: 'border-fuchsia-300/80 dark:border-fuchsia-400/20 bg-fuchsia-50/80 dark:bg-fuchsia-400/10 text-fuchsia-800 dark:text-fuchsia-300', iconColor: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { key: 'other', label: 'Other', icon: Box, badge: 'border-slate-300/80 dark:border-slate-400/20 bg-slate-50/80 dark:bg-slate-400/10 text-slate-700 dark:text-slate-300', iconColor: 'text-slate-600 dark:text-slate-400' },
];

const GOVERNANCE_TIPS = [
  'Assign risk tiers early for proper oversight',
  'Add detailed changelogs for every version',
  'Document intended use cases for compliance',
  'Schedule regular fairness audits',
];

export default function Models() {
  const { can } = useAuth();
  const [models, setModels] = useState([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  const load = () => api('/models').then((d) => setModels(d.models)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/models', { method: 'POST', body: JSON.stringify(form) });
      setShow(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredModels = models.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(search.toLowerCase())) ||
      (m.ownerName && m.ownerName.toLowerCase().includes(search.toLowerCase()));
    const matchesDomain = domainFilter === 'all' || m.domain === domainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Registry</p>
          <h1 className="page-title">Model Registry</h1>
          <p className="page-sub">Every AI system under governance, with its current lifecycle state.</p>
        </div>
        {can.manage && (
          <button className="btn-primary w-full sm:w-auto justify-center" onClick={() => setShow(!show)}>
            {show ? <><X size={15} /> Cancel</> : <><Plus size={16} /> Register model</>}
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Glassmorphic Registration Drawer/Card */}
      {show && (
        <form onSubmit={submit} className="card-glass fade-up space-y-4 p-4 sm:p-6 lg:p-7">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white shadow-glow-sm">
              <Plus size={16} />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Register a New AI Model</h2>
          </div>

          <div className="grid gap-3.5 md:grid-cols-2">
            <input
              className="input"
              placeholder="Model name (e.g. CreditRisk-Scorer-v2)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <select
              className="input"
              value={form.riskTier}
              onChange={(e) => setForm({ ...form, riskTier: e.target.value })}
            >
              {['low', 'medium', 'high', 'critical'].map((t) => (
                <option key={t} value={t}>{t} risk</option>
              ))}
            </select>
            <select
              className="input"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
            >
              {['credit_risk', 'fraud', 'nlp', 'vision', 'forecasting', 'recommendation', 'other'].map((d) => (
                <option key={d} value={d}>{d.replace('_', ' ')}</option>
              ))}
            </select>
            <label className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] px-3.5 py-2 sm:py-0 text-sm text-slate-800 dark:text-slate-300 backdrop-blur-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-600 rounded"
                checked={form.regulated}
                onChange={(e) => setForm({ ...form, regulated: e.target.checked })}
              />
              Regulated domain (subject to external compliance)
            </label>
          </div>
          <textarea
            className="input"
            rows={2}
            placeholder="Brief description of the model architecture, purpose, and stakeholders"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <textarea
            className="input"
            rows={2}
            placeholder="Intended use case, target populations, and operational constraints"
            value={form.intendedUse}
            onChange={(e) => setForm({ ...form, intendedUse: e.target.value })}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5 pt-1">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={() => setShow(false)}>Cancel</button>
            <button className="btn-primary w-full sm:w-auto" disabled={busy}>Register Model</button>
          </div>
        </form>
      )}

      {/* Glassmorphic Filter & Search Bar */}
      <div className="card-glass flex flex-col gap-3 p-3 sm:p-4">
        {/* Search Input */}
        <div className="relative w-full">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200/90 bg-white/70 pl-9 pr-3.5 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100 dark:placeholder:text-slate-500 backdrop-blur-sm transition-colors"
            placeholder="Filter models by name, owner, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Domain Filter Pills: horizontally scrollable on mobile, wrap on desktop */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hidden lg:inline mr-1 shrink-0">Domain:</span>
          <button
            onClick={() => setDomainFilter('all')}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
              domainFilter === 'all'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200/80 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]'
            }`}
          >
            All ({models.length})
          </button>
          {SUPPORTED_DOMAINS.map((d) => {
            const count = models.filter((m) => m.domain === d.key).length;
            if (count === 0 && domainFilter !== d.key) return null;
            return (
              <button
                key={d.key}
                onClick={() => setDomainFilter(domainFilter === d.key ? 'all' : d.key)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all ${
                  domainFilter === d.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'border border-slate-200/80 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]'
                }`}
              >
                <span>{d.label}</span>
                <span className="text-[10px] opacity-75 tabular-nums">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Glassmorphic Model Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredModels.map((m) => {
          const domainInfo = SUPPORTED_DOMAINS.find((d) => d.key === m.domain) || { label: m.domain, icon: Box };
          const DomainIcon = domainInfo.icon;

          return (
            <Link
              key={m._id}
              to={`/models/${m._id}`}
              className="card-glass card-hover group relative flex flex-col justify-between p-4 sm:p-5"
            >
              {/* Card top: Name & Risk tier */}
              <div>
                <div className="mb-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-brand-600 dark:text-slate-50 dark:group-hover:text-brand-300">
                      {m.name}
                    </h3>
                  </div>
                  <RiskBadge tier={m.riskTier} />
                </div>

                {/* Tags row */}
                <div className="mb-3 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/80 bg-white/60 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 backdrop-blur-sm">
                    <DomainIcon size={12} className="text-brand-600 dark:text-brand-400" />
                    {domainInfo.label}
                  </span>
                  {m.regulated && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50/80 px-2 py-0.5 text-[11px] font-semibold text-purple-800 dark:border-purple-400/25 dark:bg-purple-400/10 dark:text-purple-300 backdrop-blur-sm">
                      <ShieldCheck size={11} /> Regulated
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {m.description || 'No description provided for this model candidate.'}
                </p>
              </div>

              {/* Card middle: Owner & Versions */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="truncate">
                    Owner: <span className="font-semibold text-slate-800 dark:text-slate-200">{m.ownerName || 'unassigned'}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-slate-100/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/[0.05] dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.06]">
                    {m.versionCount} version{m.versionCount === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Current Version Bar */}
                {m.currentVersion && (
                  <div className="mt-2.5 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 dark:border-white/10 dark:bg-white/[0.03] backdrop-blur-sm">
                    <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300">
                      v{m.currentVersion.version}
                    </span>
                    <StatusBadge status={m.currentVersion.status} />
                  </div>
                )}

                {/* Bottom link callout */}
                <div className="mt-3 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-all duration-300 group-hover:translate-x-1 dark:text-brand-300">
                    Open model <ArrowUpRight size={13} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Empty state when no models match search */}
        {filteredModels.length === 0 && !error && (
          <div className="card-glass col-span-full grid place-items-center p-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 mb-3">
              <Layers size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No models found</h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-sm">
              {search || domainFilter !== 'all'
                ? 'Try adjusting your search criteria or resetting filters to view all governed AI models.'
                : 'No AI systems have been registered yet. Get started by clicking "+ Register model".'}
            </p>
            {(search || domainFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setDomainFilter('all'); }}
                className="btn-secondary mt-4 !text-xs !py-1.5"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Spacer to push remaining space down */}
      <div className="flex-1" />

      {/* Bottom 3 Glassmorphic Information Cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Card 1: Model Lifecycle */}
        <div className="card-glass p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Model Lifecycle Pipeline</h3>
            <div className="flex flex-wrap items-center gap-1.5 py-1">
              {LIFECYCLE_STAGES.map((stage, idx) => (
                <div key={stage.label} className="flex items-center gap-1.5">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${stage.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                    {stage.label}
                  </span>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <ArrowRight size={12} className="shrink-0 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            Every stage transition is cryptographically logged in the immutable audit trail.
          </p>
        </div>

        {/* Card 2: Supported Domains */}
        <div className="card-glass p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Supported Domains</h3>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_DOMAINS.map((domain) => {
                const Icon = domain.icon;
                return (
                  <span
                    key={domain.key}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${domain.badge}`}
                  >
                    <Icon size={13} className={domain.iconColor} />
                    {domain.label}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            Tailored compliance policies and drift metrics apply to each domain.
          </p>
        </div>

        {/* Card 3: Governance Tips */}
        <div className="card-glass p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Governance Tips</h3>
            <div className="space-y-2">
              {GOVERNANCE_TIPS.map((tip) => (
                <p key={tip} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <span className="shrink-0">💡</span>
                  <span>{tip}</span>
                </p>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/[0.04]">
            Maintained under EU AI Act and NIST AI Risk Management Framework standards.
          </p>
        </div>
      </div>
    </div>
  );
}
