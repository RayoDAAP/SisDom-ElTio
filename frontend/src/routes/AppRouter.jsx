/**
 * @module AppRouter
 * @description Define todas las rutas de la aplicación con protección por autenticación y rol.
 *              Usa HashRouter para compatibilidad universal en servidores estáticos (Render, Vercel, GitHub Pages)
 *              evitando errores 404 al recargar la página.
 */
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import UserDashboard from '../pages/UserDashboard';
import { USER_ROLES } from '../models/user.model';

/**
 * Ruta protegida — redirige a /login si no está autenticado.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

/**
 * Ruta protegida con restricción por rol.
 */
const RoleRoute = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    return <Navigate to={user.role === USER_ROLES.ADMIN ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

/**
 * Ruta pública — redirige al dashboard si ya está autenticado.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (isAuthenticated) {
    return <Navigate to={user?.role === USER_ROLES.ADMIN ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

const AppRouter = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute role={USER_ROLES.ADMIN}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute role={USER_ROLES.USER}>
              <UserDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter>
);

export default AppRouter;
