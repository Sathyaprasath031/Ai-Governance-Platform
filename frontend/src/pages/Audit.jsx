import { useEffect, useState } from 'react';
import api from '../api';

const ACTION_COLORS = {
  deployed: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:border-sky-400/25',
  'approval.decide': 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/25',
  'approval.reject': 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:border-rose-400/25',
  'version.submit': 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/25',
  'compliance.update': 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-400/10 dark:text-purple-300 dark:border-purple-400/25',
  'monitoring.record': 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20',
};

const ACTION_DEFINITIONS = [
  { action: 'deployed', desc: 'Model deployed to production or staging' },
  { action: 'approval.decide', desc: 'Reviewer decision or approval granted' },
  { action: 'approval.reject', desc: 'Deployment request rejected' },
  { action: 'version.submit', desc: 'New model version registered for review' },
  { action: 'compliance.update', desc: 'Compliance status or policy check updated' },
  { action: 'monitoring.record', desc: 'Performance metric or drift record logged' },
];

export default function Audit() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(100);

  useEffect(() => {
    api(`/audit?limit=${limit}`).then((d) => setEntries(d.entries)).catch((e) => setError(e.message));
  }, [limit]);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Compliance</p>
          <h1 className="page-title">Audit Trail</h1>
          <p className="page-sub">Immutable log of every governance action — who, what, when.</p>
        </div>
        <select className="input w-full sm:w-36" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
          {[50, 100, 250, 500].map((n) => (
            <option key={n} value={n}>{n} entries</option>
          ))}
        </select>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="card divide-y divide-slate-200 dark:divide-white/[0.06]">
        {entries.length === 0 && !error && <p className="p-4 sm:p-5 text-sm text-slate-600 dark:text-slate-400">No audit entries.</p>}
        {entries.map((e) => (
          <div key={e._id} className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-x-3 px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm transition-colors hover:bg-slate-100/70 dark:hover:bg-white/[0.03]">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 sm:w-40 sm:shrink-0">
              {new Date(e.createdAt).toLocaleString()}
            </span>
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
              <span className="font-semibold text-slate-900 dark:text-slate-200 sm:w-32 sm:shrink-0 sm:truncate">{e.actorName}</span>
              <span className={`badge ${ACTION_COLORS[e.action] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-400/10 dark:text-slate-300 dark:border-slate-400/20'}`}>
                {e.action}
              </span>
              <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-400 break-words">{e.targetLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Tracked Actions */}
        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Tracked Actions</h2>
          <div className="space-y-2">
            {ACTION_DEFINITIONS.map(({ action, desc }) => (
              <div key={action} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-400">
                <span className={`badge ${ACTION_COLORS[action]}`}>
                  {action}
                </span>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Why Immutable Audit? */}
        <div className="card p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-200">Why Immutable Audit?</h2>
          <div className="space-y-3">
            <div className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-400">
              <span className="shrink-0">🔒</span>
              <span>Tamper-proof records for regulatory compliance</span>
            </div>
            <div className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-400">
              <span className="shrink-0">📋</span>
              <span>Complete chain of custody for every model version</span>
            </div>
            <div className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-400">
              <span className="shrink-0">🔍</span>
              <span>Instant forensic analysis when issues arise</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
