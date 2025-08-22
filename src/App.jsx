// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Asistencia from './pages/Asistencia';
import Miembros from './pages/Miembros';
import ProfileSettings from './pages/ProfileSettings'; // 👈 Nueva página de perfil
import AppNavbar from './components/AppNavbar';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Cargando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 👇 Layout que siempre muestra el Navbar + la página privada
function PrivateLayout({ children }) {
  return (
    <>
      <AppNavbar />
      <div className="p-4">{children}</div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ==================== RUTAS PÚBLICAS ==================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ==================== RUTAS PRIVADAS ==================== */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <Home />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/asistencia"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <Asistencia />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <AdminPage />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/miembros"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <Miembros />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />

          {/* Configurar perfil */}
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <ProfileSettings />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================== CATCH ALL ==================== */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
