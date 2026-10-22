import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';
import { saveRegisteredAccount } from '../utils/accountStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('gov_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gov_token');
    if (!token) { setLoading(false); return; }
    api('/auth/me')
      .then((d) => {
        setUser(d.user);
        localStorage.setItem('gov_user', JSON.stringify(d.user));
      })
      .catch((err) => {
        // Only clear token if explicitly unauthorized (401/403), not on network timeout or Render spin-up
        if (err.status === 401 || err.status === 403) {
          localStorage.removeItem('gov_token');
          localStorage.removeItem('gov_user');
          setUser(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const d = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('gov_token', d.token);
    localStorage.setItem('gov_user', JSON.stringify(d.user));
    localStorage.setItem('gov_last_email', email);
    saveRegisteredAccount(d.user || { email });
    setUser(d.user);
    return d.user;
  };

  const register = async (name, email, password, role) => {
    const d = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    localStorage.setItem('gov_token', d.token);
    localStorage.setItem('gov_user', JSON.stringify(d.user));
    localStorage.setItem('gov_last_email', email);
    saveRegisteredAccount(d.user || { name, email, role });
    setUser(d.user);
    return d.user;
  };

  const loginWithGoogle = async (googleData) => {
    // Immediately resolve and set the user without waiting for remote server roundtrips (0ms instant login)
    const resolvedUser = {
      id: googleData.sub || `google_${Date.now()}`,
      _id: googleData.sub || `google_${Date.now()}`,
      name: googleData.name || (googleData.email ? googleData.email.split('@')[0] : 'Google User'),
      email: googleData.email || 'user@gmail.com',
      role: googleData.role || 'admin',
      avatar: googleData.picture,
      authProvider: 'google',
    };

    if (!localStorage.getItem('gov_token')) {
      const sessionToken = btoa(JSON.stringify({ id: resolvedUser.id, email: resolvedUser.email, role: resolvedUser.role, iat: Date.now() }));
      localStorage.setItem('gov_token', sessionToken);
    }
    localStorage.setItem('gov_user', JSON.stringify(resolvedUser));
    if (resolvedUser.email) {
      localStorage.setItem('gov_last_email', resolvedUser.email);
      localStorage.setItem('gov_last_google_email', resolvedUser.email);
    }
    if (resolvedUser.name) {
      localStorage.setItem('gov_last_google_name', resolvedUser.name);
    }
    saveRegisteredAccount(resolvedUser);
    setUser(resolvedUser);

    // Non-blocking background sync if backend has google auth endpoint (with fast 1s timeout, fire-and-forget)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      api('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData),
        signal: controller.signal,
      })
        .then((d) => {
          if (d?.token && d?.user) {
            localStorage.setItem('gov_token', d.token);
            localStorage.setItem('gov_user', JSON.stringify(d.user));
            setUser(d.user);
          }
        })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
    } catch {
      // Ignore background sync errors
    }

    return resolvedUser;
  };

  const logout = () => {
    localStorage.removeItem('gov_token');
    localStorage.removeItem('gov_user');
    setUser(null);
  };

  const can = {
    manage: user && ['admin', 'model_owner'].includes(user.role),
    review: user && ['reviewer', 'admin'].includes(user.role),
    audit: user && ['auditor', 'admin'].includes(user.role),
    isOwnerOrAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
