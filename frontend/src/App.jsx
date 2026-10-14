import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Background3D from './components/Background3D';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Models from './pages/Models';
import ModelDetail from './pages/ModelDetail';
import Approvals from './pages/Approvals';
import Audit from './pages/Audit';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-brand-400" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative flex min-h-screen flex-col">
          {/* animated 3D violet background */}
          <Background3D />
          <Navbar />
          <main key="page" className="fade-up relative mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-4 sm:py-7">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Protected><Dashboard /></Protected>} />
              <Route path="/models" element={<Protected><Models /></Protected>} />
              <Route path="/models/:id" element={<Protected><ModelDetail /></Protected>} />
              <Route path="/approvals" element={<Protected><Approvals /></Protected>} />
              <Route path="/audit" element={<Protected><Audit /></Protected>} />
            </Routes>
          </main>
          {/* Rich multi-column footer */}
          <footer className="relative mt-auto border-t border-white/[0.06] bg-white/[0.02] py-8 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-3 sm:px-4">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Column 1: Platform branding */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-brand-400" />
                    <span>AI Governance Control Center</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    End-to-end lifecycle governance, risk-tiered approval workflows, and immutable audit logs for responsible AI systems.
                  </p>
                  <p className="text-xs text-slate-600">
                    © {new Date().getFullYear()} AI Governance Platform · Built with transparency in mind
                  </p>
                </div>

                {/* Column 2: Platform links */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-300">Governance Modules</h3>
                  <ul className="space-y-1.5 text-xs text-slate-500">
                    <li>• Model Registry & Lifecycle Management</li>
                    <li>• Multi-Tier Approval Workflows</li>
                    <li>• Cryptographic Audit Logging</li>
                    <li>• Bias & Fairness Performance Drift</li>
                  </ul>
                </div>

                {/* Column 3: Compliance text list */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-300">Compliance & Trust</h3>
                  <ul className="space-y-1.5 text-xs text-slate-500">
                    <li>• EU AI Act Readiness Framework</li>
                    <li>• NIST AI Risk Management Framework (AI RMF)</li>
                    <li>• SOC 2 Type II Aligned</li>
                    <li>• GDPR & Fair Lending Compliance</li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
