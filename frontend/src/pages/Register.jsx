import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = ['viewer', 'model_owner', 'reviewer', 'auditor', 'admin'];

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
    <div className="card mx-auto mt-8 max-w-md p-6 sm:mt-12 sm:p-7">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-fuchsia-500 shadow-glow-sm">
        <ShieldCheck size={21} className="text-onaccent" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-white">Create account</h1>
      <p className="mt-1 text-sm text-slate-400">Join the governance workspace.</p>
      {error && <div className="alert-error mt-4">{error}</div>}
      <form onSubmit={submit} className="mt-5 space-y-3.5">
        <input
          className="input"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
        <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button className="btn-primary w-full" disabled={busy}>
          Register
        </button>
      </form>
      <p className="mt-5 text-sm text-slate-400">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-brand-300 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
