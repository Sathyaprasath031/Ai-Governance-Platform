import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function useTheme() {
  const [dark, setDark] = useState(!document.documentElement.classList.contains('light'));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    if (next) {
      el.classList.add('dark');
      el.classList.remove('light');
    } else {
      el.classList.add('light');
      el.classList.remove('dark');
    }
    localStorage.setItem('gov_theme', next ? 'dark' : 'light');
  };
  return [dark, toggle];
}

export default function Navbar() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();
  const [dark, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const go = (fn) => () => { fn(); close(); };

  const link = ({ isActive }) =>
    `flex items-center rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
      isActive
        ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-sm dark:bg-gradient-to-r dark:from-brand-500/30 dark:to-fuchsia-500/20 dark:text-white dark:border-brand-400/30 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white'
    }`;

  const navLinks = (
    <>
      <NavLink to="/" end className={link} onClick={close}>Dashboard</NavLink>
      <NavLink to="/models" className={link} onClick={close}>Registry</NavLink>
      <NavLink to="/approvals" className={link} onClick={close}>Approvals</NavLink>
      {can.audit && <NavLink to="/audit" className={link} onClick={close}>Audit Trail</NavLink>}
    </>
  );

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090616]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-4">
        <NavLink to="/" className="group flex min-w-0 items-center gap-2.5 font-bold text-slate-900 dark:text-white" onClick={close}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-fuchsia-600 shadow-glow-sm transition-shadow group-hover:shadow-glow text-white">
            <ShieldCheck size={19} className="text-white" />
          </span>
          <span className="min-w-0 truncate tracking-tight">
            AI&nbsp;Governance
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-slate-400 sm:block">
              Control Center
            </span>
          </span>
        </NavLink>

        {/* Desktop links */}
        <div className="hidden flex-1 items-center gap-1.5 md:flex">{navLinks}</div>
        <div className="flex-1 md:hidden" />

        {user ? (
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.05] py-1.5 pl-1.5 pr-3.5 shadow-sm dark:shadow-none">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-fuchsia-600 text-xs font-bold text-white shadow-sm">
                {user.name?.[0]?.toUpperCase() || '?'}
              </span>
              <div className="leading-tight">
                <div className="max-w-[9rem] truncate whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                <div className="whitespace-nowrap text-[11px] font-medium text-slate-500 dark:text-slate-400">{user.role.replace('_', ' ')}</div>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        ) : (
          <NavLink to="/login" className="btn-primary hidden md:inline-flex">Sign in</NavLink>
        )}

        <button
          className="btn-secondary shrink-0 h-9 w-9 sm:h-10 sm:w-10 !p-0 grid place-items-center"
          onClick={toggleTheme}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle color theme"
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Hamburger (mobile only) */}
        <button
          className="btn-secondary shrink-0 h-9 w-9 !p-0 grid place-items-center md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={17} /> : <Menu size={17} />}
        </button>
      </div>

      {/* Left slide-in drawer, portaled to <body> so fixed positioning works */}
      {open &&
        createPortal(
          <div className="md:hidden">
            <div
              className="fixed inset-0 z-40 bg-slate-950/40 dark:bg-night-950/60 backdrop-blur-sm"
              onClick={close}
              aria-hidden
            />
            <aside className="animate-slide-in-left fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-[300px] flex-col border-r border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#090616]/95 shadow-card backdrop-blur-2xl">
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 px-4 py-3.5">
                <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-fuchsia-600 shadow-glow-sm text-white">
                    <ShieldCheck size={16} className="text-white" />
                  </span>
                  <span className="text-sm tracking-tight">AI&nbsp;Governance</span>
                </div>
                <button className="btn-secondary !px-2" onClick={close} aria-label="Close menu">
                  <X size={15} />
                </button>
              </div>

              {/* Links */}
              <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">{navLinks}</div>

              {/* Footer / user */}
              <div className="border-t border-slate-200 dark:border-white/10 p-3">
                {user ? (
                  <div className="space-y-2.5">
                    <div className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-white/[0.05] p-2.5 shadow-sm dark:shadow-none">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-600 to-fuchsia-600 text-xs font-bold text-white shadow-sm">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</div>
                        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{user.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <button className="btn-secondary w-full justify-center" onClick={go(() => { logout(); navigate('/login'); })}>
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                ) : (
                  <NavLink to="/login" className="btn-primary w-full justify-center" onClick={close}>
                    Sign in
                  </NavLink>
                )}
              </div>
            </aside>
          </div>,
          document.body
        )}
    </nav>
  );
}
