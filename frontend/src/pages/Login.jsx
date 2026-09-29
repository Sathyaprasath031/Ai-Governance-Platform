import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_HINT = 'Sign in with your governance account';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
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
    <div className="mx-auto mt-6 grid min-h-[60vh] max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-card backdrop-blur-xl sm:mt-10 md:min-h-[calc(100vh-9rem)] md:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600/90 via-brand-700/90 to-fuchsia-700/90 p-8 sm:p-10 lg:p-12 md:flex">
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
          <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">
            Lifecycle, approvals, fairness and compliance — one control center for your entire AI estate.
          </p>
        </div>
        <div className="relative space-y-2.5 text-sm text-indigo-100/90">
          {['End-to-end lifecycle governance', 'Risk-tiered approval workflows', 'Immutable audit trail'].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <Sparkles size={14} className="text-onaccent/90" /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col justify-center bg-white/[0.04] p-8 sm:p-10 lg:p-12">
        <h1 className="text-xl font-bold text-white">Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">AI Model Governance Platform</p>
        {error && <div className="alert-error mt-4">{error}</div>}
        <form onSubmit={submit} className="mt-6 space-y-4">
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

        <p className="mt-5 text-sm text-slate-400">
          No account?{' '}
          <Link to="/register" className="font-semibold text-brand-300 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
