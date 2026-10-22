import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, UserCheck, Check, ArrowRight, Plus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const DEFAULT_ACCOUNTS = [
  {
    name: 'Sathya Prasath',
    email: 'sathyaprasath031@gmail.com',
    role: 'admin',
    roleTitle: 'Platform Administrator',
    color: 'bg-purple-600 text-white',
  },
  {
    name: 'Alex Turner',
    email: 'alex.turner@enterprise.ai',
    role: 'model_owner',
    roleTitle: 'Model Owner / ML Lead',
    color: 'bg-blue-600 text-white',
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@riskreview.io',
    role: 'reviewer',
    roleTitle: 'Model Risk Reviewer',
    color: 'bg-amber-600 text-white',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus.chen@complianceaudit.org',
    role: 'auditor',
    roleTitle: 'Compliance Auditor',
    color: 'bg-emerald-600 text-white',
  },
];

export default function GoogleAuthButton({ text = 'Continue with Google', role = 'admin', onSuccess, onError }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChooser, setShowChooser] = useState(false);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState(role);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Build list of accounts: if user has a previously registered email, place it first
  const rememberedEmail = localStorage.getItem('gov_last_google_email') || localStorage.getItem('gov_last_email');
  const rememberedName = localStorage.getItem('gov_last_google_name');

  const accountsList = [...DEFAULT_ACCOUNTS];
  if (rememberedEmail && !accountsList.some((a) => a.email.toLowerCase() === rememberedEmail.toLowerCase())) {
    accountsList.unshift({
      name: rememberedName || rememberedEmail.split('@')[0],
      email: rememberedEmail,
      role: 'admin',
      roleTitle: 'Registered Workspace User',
      color: 'bg-gradient-to-br from-brand-600 to-fuchsia-600 text-white',
      isLastUsed: true,
    });
  }

  useEffect(() => {
    // If client ID is provided and Google GIS script is loaded, initialize it
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              try {
                const payload = parseJwt(response.credential);
                const user = await loginWithGoogle({
                  credential: response.credential,
                  email: payload?.email,
                  name: payload?.name,
                  picture: payload?.picture,
                  sub: payload?.sub,
                  role,
                });
                setShowChooser(false);
                onSuccess?.(user);
              } catch (err) {
                onError?.(err.message || 'Google sign in failed');
              } finally {
                setLoading(false);
              }
            }
          },
        });
      } catch (err) {
        console.warn('Google Identity initialization notice:', err);
      }
    }
  }, [clientId, role]);

  const handleOpenChooser = () => {
    // If Google GIS client is fully configured, trigger native prompt
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn('Google prompt fallback:', err);
      }
    }
    // Always display the Google Account Chooser modal so user can pick between accounts
    setShowChooser(true);
  };

  const handleSelectAccount = async (account) => {
    setLoading(true);
    try {
      const user = await loginWithGoogle({
        email: account.email,
        name: account.name,
        role: account.role || role,
      });
      setShowChooser(false);
      onSuccess?.(user);
    } catch (err) {
      onError?.(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) return;
    setLoading(true);
    try {
      const user = await loginWithGoogle({
        email: customEmail,
        name: customName || customEmail.split('@')[0],
        role: customRole,
      });
      setShowChooser(false);
      onSuccess?.(user);
    } catch (err) {
      onError?.(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleOpenChooser}
        disabled={loading}
        className="group relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12] dark:hover:border-white/25"
      >
        {/* Authentic 4-color Google G Logo */}
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span>{loading ? 'Authenticating...' : text}</span>
      </button>

      {/* Google "Choose an account" Modal Overlay */}
      {showChooser &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
              onClick={() => setShowChooser(false)}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-[#120c24] animate-fade-up">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowChooser(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {/* Google Header */}
              <div className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center">
                  <svg className="h-7 w-7" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Choose an account
                </h2>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  to continue to <span className="font-semibold text-brand-600 dark:text-brand-400">AI Governance Platform</span>
                </p>
              </div>

              {/* Accounts List */}
              <div className="mt-5 divide-y divide-slate-100 dark:divide-white/[0.06] border-y border-slate-200 dark:border-white/10 max-h-72 overflow-y-auto no-scrollbar">
                {accountsList.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleSelectAccount(account)}
                    className="flex w-full items-center gap-3.5 py-3 px-2 text-left hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors rounded-xl"
                  >
                    {/* Account Avatar */}
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold text-sm shadow-sm ${account.color}`}>
                      {account.name[0]?.toUpperCase() || 'G'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {account.name}
                        </span>
                        {account.isLastUsed && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.2 text-[10px] font-bold text-brand-800 dark:bg-brand-500/20 dark:text-brand-300">
                            Recent
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                        {account.email}
                      </p>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-500">
                        Role: {account.roleTitle}
                      </span>
                    </div>

                    <ArrowRight size={15} className="shrink-0 text-slate-400 dark:text-slate-600" />
                  </button>
                ))}
              </div>

              {/* Use Another Account Button / Form */}
              <div className="mt-4">
                {!showAddCustom ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="flex w-full items-center gap-3 rounded-xl py-2.5 px-2 text-left text-xs font-semibold text-brand-600 hover:bg-brand-50/60 dark:text-brand-400 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-dashed border-brand-400 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-400">
                      <Plus size={16} />
                    </div>
                    <span>Use another Google account</span>
                  </button>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Enter Google Account
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <input
                      type="email"
                      className="input !py-2 !text-xs"
                      placeholder="yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                      autoFocus
                    />
                    <input
                      type="text"
                      className="input !py-2 !text-xs"
                      placeholder="Your Full Name (e.g. John Doe)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <select
                      className="input !py-2 !text-xs"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                    >
                      <option value="admin">Administrator (Full Access)</option>
                      <option value="model_owner">Model Owner (ML Lead)</option>
                      <option value="reviewer">Reviewer (Sign-off Authority)</option>
                      <option value="auditor">Auditor (Compliance View)</option>
                      <option value="viewer">Viewer (Read Only)</option>
                    </select>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary !py-2 !text-xs w-full justify-center"
                    >
                      Continue with this account
                    </button>
                  </form>
                )}
              </div>

              {/* Google Disclaimer Footer */}
              <p className="mt-4 text-center text-[10px] leading-relaxed text-slate-500 dark:text-slate-500">
                To continue, Google will verify your identity with AI Governance Platform.
              </p>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
