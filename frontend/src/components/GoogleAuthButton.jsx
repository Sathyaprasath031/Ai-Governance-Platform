import { useEffect, useState } from 'react';
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

export default function GoogleAuthButton({ text = 'Continue with Google', role = 'admin', onSuccess, onError }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showManualGoogle, setShowManualGoogle] = useState(false);
  const [googleEmail, setGoogleEmail] = useState(() => localStorage.getItem('gov_last_google_email') || localStorage.getItem('gov_last_email') || '');
  const [googleName, setGoogleName] = useState(() => localStorage.getItem('gov_last_google_name') || '');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
                if (payload?.email) {
                  localStorage.setItem('gov_last_google_email', payload.email);
                }
                if (payload?.name) {
                  localStorage.setItem('gov_last_google_name', payload.name);
                }
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

  const handleGoogleClick = async () => {
    // If Google GIS is active and client ID is configured
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.warn('Google prompt fallback:', err);
      }
    }

    // Fast 1-click Google Auth when already remembered
    const rememberedEmail = localStorage.getItem('gov_last_google_email') || localStorage.getItem('gov_last_email');
    const rememberedName = localStorage.getItem('gov_last_google_name');

    if (rememberedEmail && !showManualGoogle) {
      setLoading(true);
      try {
        const user = await loginWithGoogle({
          email: rememberedEmail,
          name: rememberedName || rememberedEmail.split('@')[0],
          role,
        });
        onSuccess?.(user);
        return;
      } catch (err) {
        onError?.(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Otherwise show quick Google account selection
    setShowManualGoogle(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail) return;
    setLoading(true);
    try {
      localStorage.setItem('gov_last_google_email', googleEmail);
      if (googleName) localStorage.setItem('gov_last_google_name', googleName);
      const user = await loginWithGoogle({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
        role,
      });
      setShowManualGoogle(false);
      onSuccess?.(user);
    } catch (err) {
      onError?.(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleGoogleClick}
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

        <span>{loading ? 'Authenticating with Google...' : text}</span>
      </button>

      {/* Quick Google Account Dialog (for instant 1-click Google access) */}
      {showManualGoogle && (
        <div className="fade-up mt-3 rounded-xl border border-brand-200 bg-brand-50/80 p-3.5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Select Google Account
            </span>
            <button
              type="button"
              onClick={() => setShowManualGoogle(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleManualSubmit} className="mt-2.5 space-y-2">
            <input
              type="email"
              className="input !py-1.5 !text-xs"
              placeholder="yourname@gmail.com"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              required
              autoFocus
            />
            <input
              type="text"
              className="input !py-1.5 !text-xs"
              placeholder="Your Name (Optional)"
              value={googleName}
              onChange={(e) => setGoogleName(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary !py-1.5 !text-xs w-full justify-center"
              >
                Sign in as {googleEmail.split('@')[0] || 'Google User'}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
              Account will be saved for instant 1-click login on future visits.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
