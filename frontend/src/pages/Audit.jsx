import { useEffect, useState } from 'react';
import api from '../api';

const ACTION_COLORS = {
  deployed: 'bg-sky-400/10 text-sky-700 dark:text-sky-300 border-sky-400/25',
  'approval.decide': 'bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 border-emerald-400/25',
  'approval.reject': 'bg-rose-400/10 text-rose-700 dark:text-rose-300 border-rose-400/25',
  'version.submit': 'bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-400/25',
  'compliance.update': 'bg-purple-400/10 text-purple-700 dark:text-purple-300 border-purple-400/25',
  'monitoring.record': 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/20',
};

export default function Audit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    api(`/audit?limit=${limit}`).then((d) => setEntries(d.entries)).catch((e) => setError(e.message));
  }, [limit]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Compliance</p>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-sub">Immutable log of every governance action — who, what, when.</p>
        </div>
        <select className="input w-36" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {[50, 100, 250, 500].map((n) => (
            <option key={n} value={n}>{n} entries</option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card divide-y divide-white/[0.06]">
        {entries.length === 0 && !error && <p className="p-5 text-sm text-slate-500">No audit entries.</p>}
        {entries.map((e) => (
          <div key={e._id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm transition-colors hover:bg-white/[0.03]">
            <span className="w-full font-mono text-[11px] text-slate-500 sm:w-40 sm:shrink-0">
              {new Date(e.createdAt).toLocaleString()}
            </span>
            <span className="w-full truncate font-semibold text-slate-200 sm:w-36 sm:shrink-0">{e.actorName}</span>
            <span className={`badge ${ACTION_COLORS[e.action] || 'bg-slate-400/10 text-slate-300 border-slate-400/20'}`}>
              {e.action}
            </span>
            <span className="text-slate-400">{e.targetLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
