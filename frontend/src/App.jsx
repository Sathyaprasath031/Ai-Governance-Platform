import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
        <div className="relative min-h-screen">
          {/* animated 3D violet background */}
          <Background3D />
          <Navbar />
          <main key="page" className="fade-up relative mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7">
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
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
