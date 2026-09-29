import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gov_token');
    if (!token) { setLoading(false); return; }
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem('gov_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const d = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('gov_token', d.token);
    setUser(d.user);
    return d.user;
  };

  const register = async (name, email, password, role) => {
    const d = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
    localStorage.setItem('gov_token', d.token);
    setUser(d.user);
    return d.user;
  };

  const logout = () => {
    localStorage.removeItem('gov_token');
    setUser(null);
  };

  const can = {
    manage: user && ['admin', 'model_owner'].includes(user.role),
    review: user && ['reviewer', 'admin'].includes(user.role),
    audit: user && ['auditor', 'admin'].includes(user.role),
    isOwnerOrAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
