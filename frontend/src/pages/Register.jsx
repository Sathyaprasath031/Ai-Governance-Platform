import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Boxes,
  ClipboardCheck,
  Eye,
  Info,
  Check,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    key: 'viewer',
    label: 'Viewer',
    badge: 'border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-400/20 dark:bg-slate-500/10 dark:text-slate-300',
    icon: Info,
    desc: 'Read-only access to view registered models, risk classifications, and queue progress.',
    capabilities: ['Browse model registry', 'Inspect risk classifications', 'Track approval statuses'],
  },
  {
    key: 'model_owner',
    label: 'Model Owner',
    badge: 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300',
    icon: Boxes,
    desc: 'Register new AI models, upload version artifacts, and submit models into the approval queue.',
    capabilities: ['Register new models', 'Create release candidates', 'Submit versions for sign-off'],
  },
  {
    key: 'reviewer',
    label: 'Reviewer',
    badge: 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
    icon: ClipboardCheck,
    desc: 'Inspect governance checklists, review bias/drift metrics, and approve or reject releases.',
    capabilities: ['Approve or reject versions', 'Leave official feedback', 'Enforce risk-tier gates'],
  },
  {
    key: 'auditor',
    label: 'Auditor',
    badge: 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300',
    icon: Eye,
    desc: 'Verify regulatory compliance, inspect immutable audit trails, and export proof logs.',
    capabilities: ['Access immutable audit logs', 'Inspect all actor activities', 'Ensure EU AI Act readiness'],
  },
  {
    key: 'admin',
    label: 'Administrator',
    badge: 'border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-300',
    icon: ShieldCheck,
    desc: 'Full administrative access across model registration, approvals, policies, and audit logs.',
    capabilities: ['Full platform permissions', 'Emergency approval override', 'Manage all organizational models'],
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-4 sm:py-6">
      {/* Top Banner */}
      <div className="text-center">
        <p className="eyebrow">Onboarding</p>
        <h1 className="page-title text-3xl">Create Governance Account</h1>
        <p className="page-sub">Select your organizational role to configure proper access controls.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form panel */}
        <div className="card p-5 sm:p-8 lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 shadow-glow-sm text-white">
              <ShieldCheck size={20} className="text-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account Details</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">Join your team's control workspace.</p>
            </div>
          </div>

          {error && <div className="alert-error mt-4">{error}</div>}

          <form onSubmit={submit} className="mt-5 space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</label>
              <input
                className="input"
                placeholder="Ada Lovelace"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
              <input
                className="input"
                type="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Platform Role</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary mt-2 w-full" disabled={busy}>
              Register Account <ArrowRight size={15} />
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600 dark:text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-300 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Roles Explorer & Guide */}
        <div className="space-y-3 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">Select Role Responsibilities</h3>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Click a role to select</span>
          </div>

          <div className="space-y-2.5">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = form.role === r.key;
              return (
                <div
                  key={r.key}
                  onClick={() => setForm({ ...form, role: r.key })}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/90 shadow-sm dark:border-brand-400/50 dark:bg-gradient-to-r dark:from-brand-500/15 dark:to-fuchsia-500/10 dark:shadow-[0_0_20px_-6px_rgba(139,92,246,0.35)]'
                      : 'border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/20 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`grid h-8 w-8 place-items-center rounded-lg border ${r.badge}`}>
                        <Icon size={16} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.label}</span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 dark:bg-brand-400/20 px-2 py-0.5 text-[10px] font-semibold text-brand-800 dark:text-brand-300">
                              <Check size={10} /> Active Choice
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{r.desc}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-white/[0.04]">
                    {r.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-400"
                      >
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
