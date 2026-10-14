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
} from 'lucide-react';
import api from '../api';
import { StatusBadge, RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', description: '', domain: 'other', riskTier: 'medium', intendedUse: '', regulated: false };

const LIFECYCLE_STAGES = [
  { label: 'Draft', badge: 'border-slate-500/20 bg-slate-500/10 text-slate-300', dot: 'bg-slate-400' },
  { label: 'Pending Review', badge: 'border-amber-400/25 bg-amber-400/10 text-amber-300', dot: 'bg-amber-400' },
  { label: 'Approved', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300', dot: 'bg-emerald-400' },
  { label: 'Deployed', badge: 'border-sky-400/25 bg-sky-400/10 text-sky-300', dot: 'bg-sky-400' },
  { label: 'Deprecated', badge: 'border-rose-400/25 bg-rose-400/10 text-rose-300', dot: 'bg-rose-400' },
];

const SUPPORTED_DOMAINS = [
  { key: 'credit_risk', label: 'Credit Risk', icon: CreditCard, badge: 'border-amber-400/20 bg-amber-400/10 text-amber-300', iconColor: 'text-amber-400' },
  { key: 'fraud', label: 'Fraud', icon: ShieldAlert, badge: 'border-rose-400/20 bg-rose-400/10 text-rose-300', iconColor: 'text-rose-400' },
  { key: 'nlp', label: 'NLP', icon: MessageSquare, badge: 'border-sky-400/20 bg-sky-400/10 text-sky-300', iconColor: 'text-sky-400' },
  { key: 'vision', label: 'Vision', icon: Eye, badge: 'border-purple-400/20 bg-purple-400/10 text-purple-300', iconColor: 'text-purple-400' },
  { key: 'forecasting', label: 'Forecasting', icon: TrendingUp, badge: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300', iconColor: 'text-emerald-400' },
  { key: 'recommendation', label: 'Recommendation', icon: Sparkles, badge: 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300', iconColor: 'text-fuchsia-400' },
  { key: 'other', label: 'Other', icon: Box, badge: 'border-slate-400/20 bg-slate-400/10 text-slate-300', iconColor: 'text-slate-400' },
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

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Registry</p>
          <h1 className="page-title">Model Registry</h1>
          <p className="page-sub">Every AI system under governance, with its current lifecycle state.</p>
        </div>
        {can.manage && (
          <button className="btn-primary" onClick={() => setShow(!show)}>
            {show ? <><X size={15} /> Cancel</> : <><Plus size={16} /> Register model</>}
          </button>
        )}
      </div>

      {error && <div className="alert-error">{error}</div>}

      {show && (
        <form onSubmit={submit} className="card fade-up space-y-3.5 p-5">
          <h2 className="card-title">Register a new model</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            <input className="input" placeholder="Model name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select className="input" value={form.riskTier} onChange={(e) => setForm({ ...form, riskTier: e.target.value })}>
              {['low', 'medium', 'high', 'critical'].map((t) => <option key={t} value={t}>{t} risk</option>)}
            </select>
            <select className="input" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })}>
              {['credit_risk', 'fraud', 'nlp', 'vision', 'forecasting', 'recommendation', 'other'].map((d) => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
            <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-night-950/50 px-3.5 text-sm text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 accent-brand-500"
                checked={form.regulated}
                onChange={(e) => setForm({ ...form, regulated: e.target.checked })}
              />
              Regulated domain (subject to external compliance)
            </label>
          </div>
          <textarea className="input" rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <textarea className="input" rows={2} placeholder="Intended use" value={form.intendedUse} onChange={(e) => setForm({ ...form, intendedUse: e.target.value })} />
          <button className="btn-primary" disabled={busy}>Register</button>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {models.map((m) => (
          <Link key={m._id} to={`/models/${m._id}`} className="card card-hover group p-5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight text-slate-50 transition-colors group-hover:text-brand-200">{m.name}</h3>
              <RiskBadge tier={m.riskTier} />
            </div>
            <p className="mb-4 line-clamp-2 text-sm text-slate-400">{m.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Owner: <span className="text-slate-400">{m.ownerName}</span></span>
              <span>{m.versionCount} version{m.versionCount === 1 ? '' : 's'}</span>
            </div>
            {m.currentVersion && (
              <div className="mt-3.5 flex items-center justify-between border-t border-white/[0.07] pt-3.5">
                <span className="font-mono text-sm font-semibold text-brand-300">v{m.currentVersion.version}</span>
                <StatusBadge status={m.currentVersion.status} />
              </div>
            )}
            <span className="mt-3 inline-flex translate-x-0 items-center gap-1 text-xs font-semibold text-transparent transition-all duration-300 group-hover:translate-x-1 group-hover:text-brand-300">
              Open model <ArrowUpRight size={12} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
        {models.length === 0 && !error && <p className="text-sm text-slate-500">No models registered yet.</p>}
      </div>

      {/* Fill remaining space with useful info */}
      <div className="flex-1" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Card 1: Model Lifecycle */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-5 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Model Lifecycle</h3>
          <div className="flex flex-wrap items-center gap-1.5 py-1">
            {LIFECYCLE_STAGES.map((stage, idx) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${stage.badge}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${stage.dot}`} />
                  {stage.label}
                </span>
                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <ArrowRight size={12} className="shrink-0 text-slate-600" />
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Each transition is logged in the audit trail</p>
        </div>

        {/* Card 2: Supported Domains */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-5 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Supported Domains</h3>
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

        {/* Card 3: Governance Tips */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-5 py-5 backdrop-blur-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">Governance Tips</h3>
          <div className="space-y-2">
            {GOVERNANCE_TIPS.map((tip) => (
              <p key={tip} className="flex items-start gap-2 text-sm text-slate-500">
                <span className="shrink-0">💡</span>
                <span>{tip}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
