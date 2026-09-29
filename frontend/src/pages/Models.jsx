import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, ArrowUpRight } from 'lucide-react';
import api from '../api';
import { StatusBadge, RiskBadge } from '../components/ui';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', description: '', domain: 'other', riskTier: 'medium', intendedUse: '', regulated: false };

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
    <div className="space-y-5">
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
    </div>
  );
}
