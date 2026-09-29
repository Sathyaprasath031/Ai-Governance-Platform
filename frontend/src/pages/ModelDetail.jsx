import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Rocket, Send, CheckCircle2, XCircle, Archive, ArrowLeft, Activity, FileCheck } from 'lucide-react';
import api from '../api';
import { StatusBadge, RiskBadge, COMPLIANCE_LABELS, FAIRNESS_LABELS } from '../components/ui';
import { useAuth } from '../context/AuthContext';

export default function ModelDetail() {
  const { id } = useParams();
  const { user, can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newVersion, setNewVersion] = useState(null);
  const [compliance, setCompliance] = useState({});
  const [monitoring, setMonitoring] = useState({});

  const load = () =>
    api(`/models/${id}`).then(setData).catch((e) => setError(e.message));

  useEffect(() => { load(); }, [id]);

  const act = async (versionId, status, environment) => {
    setError('');
    setNotice('');
    try {
      await api(`/versions/${versionId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, environment }),
      });
      setNotice(`Version ${status}.`);
      load();
    } catch (e) {
      setError(e.blockers ? `${e.message}: ${e.blockers.join(' · ')}` : e.message);
    }
  };

  const submitVersion = async (versionId) => {
    setError('');
    try {
      await api(`/versions/${versionId}/submit`, { method: 'POST' });
      setNotice('Submitted for review — approval request opened.');
      load();
    } catch (e) { setError(e.message); }
  };

  if (error && !data) return <div className="alert-error">{error}</div>;
  if (!data)
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
      </div>
    );

  const { model, versions, deployments } = data;
  const current = versions.find((v) => v.status === 'deployed') || versions[0];
  const isOwner = user && (user.role === 'admin' || (user.role === 'model_owner' && user.id === model.owner));

  return (
    <div className="space-y-6">
      <Link to="/models" className="inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-brand-300">
        <ArrowLeft size={14} /> Registry
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{model.name}</h1>
            <RiskBadge tier={model.riskTier} />
            {model.regulated && <span className="badge bg-purple-400/10 text-purple-300 border-purple-400/25">regulated</span>}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{model.description}</p>
          {model.intendedUse && (
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-400">Intended use:</span> {model.intendedUse}
            </p>
          )}
        </div>
        <div className="text-sm text-slate-500">
          Owner: <span className="font-semibold text-slate-200">{model.ownerName}</span>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {notice && <div className="alert-success">{notice}</div>}

      {/* New version */}
      {isOwner && (
        <div className="card p-5">
          <button
            className="btn-secondary"
            onClick={() => setNewVersion(newVersion ? null : { version: '', changelog: '', trainingDataset: '', algorithm: '', metrics: { accuracy: '', auc: '' }, fairness: [] })}
          >
            + New version
          </button>
          {newVersion && (
            <form
              className="fade-up mt-4 space-y-3.5 border-t border-white/[0.07] pt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                try {
                  const body = {
                    modelId: id,
                    version: newVersion.version,
                    changelog: newVersion.changelog,
                    trainingDataset: newVersion.trainingDataset,
                    algorithm: newVersion.algorithm,
                    metrics: Object.fromEntries(Object.entries(newVersion.metrics).filter(([, v]) => v !== '')),
                    fairness: newVersion.fairness,
                  };
                  await api('/versions', { method: 'POST', body: JSON.stringify(body) });
                  setNewVersion(null);
                  setNotice('Draft version created.');
                  load();
                } catch (err) { setError(err.message); }
              }}
            >
              <div className="grid gap-3.5 md:grid-cols-4">
                <input className="input" placeholder="Version (e.g. 2.4.0)" value={newVersion.version} onChange={(e) => setNewVersion({ ...newVersion, version: e.target.value })} required />
                <input className="input" placeholder="Algorithm" value={newVersion.algorithm} onChange={(e) => setNewVersion({ ...newVersion, algorithm: e.target.value })} />
                <input className="input" placeholder="Training dataset" value={newVersion.trainingDataset} onChange={(e) => setNewVersion({ ...newVersion, trainingDataset: e.target.value })} />
                <input className="input" placeholder="Accuracy (0-1)" type="number" step="0.001" value={newVersion.metrics.accuracy} onChange={(e) => setNewVersion({ ...newVersion, metrics: { ...newVersion.metrics, accuracy: e.target.value } })} />
              </div>
              <textarea className="input" rows={2} placeholder="Changelog" value={newVersion.changelog} onChange={(e) => setNewVersion({ ...newVersion, changelog: e.target.value })} />
              <button className="btn-primary">Create draft</button>
            </form>
          )}
        </div>
      )}

      {/* Versions */}
      <div className="space-y-4">
        {versions.map((v) => (
          <VersionCard
            key={v._id}
            v={v}
            model={model}
            user={user}
            isOwner={isOwner}
            canReview={can.review}
            onSubmit={() => submitVersion(v._id)}
            onAct={(status) => act(v._id, status)}
            compliance={compliance[v._id]}
            monitoring={monitoring[v._id]}
            onOpenDetails={async () => {
              if (!compliance[v._id]) {
                api(`/compliance/${v._id}`).then((d) => setCompliance((c) => ({ ...c, [v._id]: d }))).catch(() => {});
                api(`/monitoring/${v._id}`).then((d) => setMonitoring((m) => ({ ...m, [v._id]: d.snapshots }))).catch(() => {});
              }
            }}
          />
        ))}
      </div>

      {/* Deployments */}
      {deployments?.length > 0 && (
        <div className="card p-5">
          <h2 className="card-title mb-3">Deployment history</h2>
          <div className="space-y-1.5 text-sm">
            {deployments.map((d) => (
              <div key={d._id} className="flex flex-wrap gap-x-2 gap-y-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
                <span className="w-full font-mono text-[11px] text-slate-500 sm:w-40 sm:shrink-0">{new Date(d.createdAt).toLocaleString()}</span>
                <span className="font-semibold text-slate-200">{d.environment}</span>
                <span className="text-slate-500">
                  by {d.deployerName} {d.active ? '· active' : '· superseded'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionCard({ v, model, user, isOwner, canReview, onSubmit, onAct, compliance, monitoring, onOpenDetails }) {
  const [open, setOpen] = useState(false);
  const toggle = () => { setOpen(!open); if (!open) onOpenDetails(); };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-sm font-semibold text-brand-300">
          v{v.version}
        </span>
        <StatusBadge status={v.status} />
        <span className="text-xs text-slate-500">{v.algorithm}</span>
        <div className="flex-1" />
        <button className="btn-secondary" onClick={toggle}>{open ? 'Hide' : 'Details'}</button>
        {isOwner && v.status === 'draft' && (
          <button className="btn-primary" onClick={onSubmit}><Send size={14} /> Submit for review</button>
        )}
        {canReview && v.status === 'pending_review' && (
          <Link to="/approvals" className="btn-primary">Review queue</Link>
        )}
        {isOwner && v.status === 'approved' && (
          <button className="btn-success" onClick={() => onAct('deployed')}><Rocket size={14} /> Deploy</button>
        )}
        {isOwner && ['deployed', 'approved'].includes(v.status) && (
          <button className="btn-secondary" onClick={() => onAct('deprecated')}><Archive size={14} /> Deprecate</button>
        )}
      </div>

      {v.changelog && <p className="mt-2.5 text-sm text-slate-400">{v.changelog}</p>}

      {open && (
        <div className="fade-up mt-4 space-y-5 border-t border-white/[0.07] pt-4">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <h4 className="eyebrow mb-2">Evaluation metrics</h4>
              <MetricsMap metrics={v.metrics} />
              {v.trainingDataset && <p className="mt-2 text-xs text-slate-500">Data: {v.trainingDataset}</p>}
            </div>
            <div>
              <h4 className="eyebrow mb-2">Fairness assessment</h4>
              {(!v.fairness || v.fairness.length === 0) && <p className="text-sm text-slate-500">No fairness metrics recorded.</p>}
              <div className="space-y-1.5">
                {(v.fairness || []).map((f, i) => (
                  <FairnessRow key={i} f={f} />
                ))}
              </div>
            </div>
          </div>

          {compliance && (
            <div>
              <h4 className="eyebrow mb-2 flex items-center gap-1.5">
                <FileCheck size={13} /> Compliance checklist ({compliance.riskTier} risk requirements)
              </h4>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {compliance.items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-sm">
                    {item.status === 'complete' ? (
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                    ) : item.status === 'pending' ? (
                      <span className="h-[15px] w-[15px] shrink-0 rounded-full border-2 border-amber-400" />
                    ) : (
                      <span className="h-[15px] w-[15px] shrink-0 rounded border-2 border-slate-600" />
                    )}
                    <span className={item.status === 'complete' ? 'text-slate-200' : 'text-slate-400'}>
                      {COMPLIANCE_LABELS[item.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monitoring && monitoring.length > 0 && (
            <div>
              <h4 className="eyebrow mb-2 flex items-center gap-1.5">
                <Activity size={13} /> Production monitoring
              </h4>
              <div className="space-y-1 text-sm">
                {monitoring.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]">
                    <span className="w-full font-mono text-[11px] text-slate-500 sm:w-36 sm:shrink-0">{new Date(s.recordedAt).toLocaleString()}</span>
                    <span className="tabular-nums text-slate-200">accuracy {(s.accuracy * 100).toFixed(1)}%</span>
                    <span className="tabular-nums text-slate-500">drift {s.driftScore?.toFixed(2) ?? '—'}</span>
                    {s.alert !== 'none' && <span className="badge bg-rose-400/15 text-rose-700 dark:text-rose-300 border-rose-400/30">{s.alert.replace('_', ' ')}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricsMap({ metrics }) {
  if (!metrics) return <p className="text-sm text-slate-500">No metrics.</p>;
  const entries = metrics instanceof Map || typeof metrics.entries === 'function'
    ? [...metrics.entries()]
    : Object.entries(metrics);
  if (entries.length === 0) return <p className="text-sm text-slate-500">No metrics.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([k, val]) => (
        <span key={k} className="badge bg-white/[0.05] text-slate-300">
          {k}: <span className="font-mono tabular-nums text-brand-300">{Number(val).toFixed(3)}</span>
        </span>
      ))}
    </div>
  );
}

function FairnessRow({ f }) {
  const pass = f.passed;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{pass ? '✅' : '❌'}</span>
      <span className={pass ? 'text-slate-300 dark:text-slate-300' : 'font-medium text-rose-600 dark:text-rose-300'}>{FAIRNESS_LABELS[f.metric] || f.metric}</span>
      <span className="font-mono text-xs tabular-nums text-slate-500">
        ({Number(f.value).toFixed(3)} vs limit {Number(f.threshold).toFixed(3)}){f.group ? ` · ${f.group}` : ''}
      </span>
    </div>
  );
}
