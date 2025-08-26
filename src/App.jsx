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
import Reuniones from './pages/Reuniones';
import LoadingSpinner from './components/LoadingSpinner';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// 👇 Layout que siempre muestra el Navbar + la página privada
// 👇 PrivateLayout.jsx
function PrivateLayout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      {/* Navbar fija arriba */}
      <AppNavbar className="fixed top-0 left-0 w-full z-50 h-14 md:h-16" />

      {/* Contenido scrollable */}
      <main className="flex-1 overflow-y-auto  md:pt-16 ">
        {children}
      </main>
    </div>
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
            path="/reuniones"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <Reuniones />
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
