import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  BarChart3,
  FileCheck,
  Users,
  Eye,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthButton from '../components/GoogleAuthButton';

const ROLE_HINT = 'Sign in with your governance account';

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Risk-Tiered Controls',
    description: 'Classify models by risk level and apply proportionate oversight',
    gradient: 'from-rose-500/20 to-amber-500/20 text-rose-700 dark:text-rose-300',
  },
  {
    icon: FileCheck,
    title: 'Approval Workflows',
    description: 'Multi-reviewer sign-off with role-based access control',
    gradient: 'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    icon: Eye,
    title: 'Immutable Audit Trail',
    description: 'Every action logged for compliance and accountability',
    gradient: 'from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-cyan-300',
  },
  {
    icon: GitBranch,
    title: 'Model Versioning',
    description: 'Track every model iteration with full lineage',
    gradient: 'from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-300',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Roles for owners, reviewers, auditors, and admins',
    gradient: 'from-indigo-500/20 to-brand-500/20 text-indigo-700 dark:text-indigo-300',
  },
  {
    icon: BarChart3,
    title: 'Performance Monitoring',
    description: 'Track accuracy, fairness, and drift metrics',
    gradient: 'from-amber-500/20 to-orange-500/20 text-amber-800 dark:text-amber-300',
  },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem('gov_last_email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="mx-auto mt-6 grid max-w-4xl overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] shadow-card backdrop-blur-xl sm:mt-10 md:grid-cols-2" style={{ minHeight: 'min(70vh, 520px)' }}>
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600/95 via-brand-700/95 to-fuchsia-700/95 p-8 sm:p-10 lg:p-12 md:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(18rem 12rem at 20% 15%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(16rem 12rem at 85% 85%, rgba(255,255,255,0.12), transparent 55%)',
            }}
          />
          <div className="relative">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
              <ShieldCheck size={22} className="text-onaccent" />
            </span>
            <h2 className="mt-5 text-2xl font-bold leading-snug text-onaccent">
              Govern every model
              <br />
              with confidence.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-indigo-100/90">
              Lifecycle, approvals, fairness and compliance — one control center for your entire AI estate.
            </p>
          </div>
          <div className="relative space-y-2.5 text-sm text-indigo-100/95">
            {['End-to-end lifecycle governance', 'Risk-tiered approval workflows', 'Immutable audit trail'].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Sparkles size={14} className="text-onaccent" /> {t}
              </div>
            ))}
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-white/80 dark:bg-white/[0.04] p-5 sm:p-10 lg:p-12">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">AI Model Governance Platform</p>
          {error && <div className="alert-error mt-4">{error}</div>}

          {/* Google 1-Click Auth */}
          <div className="mt-5">
            <GoogleAuthButton
              text="Continue with Google"
              onSuccess={() => navigate('/')}
              onError={(err) => setError(err)}
            />
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-[#0c081e] dark:text-slate-400">
              or sign in with email
            </span>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button className="btn-primary w-full" disabled={busy}>
              Sign in <ArrowRight size={15} />
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-600 dark:text-slate-400">
            No account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 dark:text-brand-300 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>

      {/* Platform Capabilities & Features */}
      <section className="mx-auto mt-12 max-w-4xl pb-10 sm:mt-16">
        <div className="text-center">
          <p className="eyebrow">Enterprise Ready</p>
          <h2 className="page-title text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Platform Capabilities
          </h2>
          <p className="page-sub mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enterprise-grade governance, monitoring, and compliance for responsible artificial intelligence.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.04] p-5 backdrop-blur-sm transition-all duration-300 hover:border-brand-500/40 hover:bg-white dark:hover:bg-white/[0.06]"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${item.gradient} border border-slate-200/60 dark:border-white/10`}
              >
                <item.icon size={20} />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom Trust Bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-10 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.04] px-4 py-3 sm:px-6 sm:py-4 text-xs font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-brand-600 dark:text-brand-400" />
            <span>SOC 2 Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-brand-600 dark:text-brand-400" />
            <span>GDPR Aligned</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-brand-600 dark:text-brand-400" />
            <span>EU AI Act Compliant</span>
          </div>
        </div>
      </section>
    </>
  );
}
