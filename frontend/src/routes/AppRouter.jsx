/**
 * @module AppRouter
 * @description Define todas las rutas de la aplicación con protección por autenticación y rol.
 *              Usa React Router v6 con rutas anidadas y guardas de acceso.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoginPage from '../pages/LoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import UserDashboard from '../pages/UserDashboard';
import { USER_ROLES } from '../models/user.model';

/**
 * Ruta protegida — redirige a /login si no está autenticado.
 * @param {{ children: React.ReactNode }} props
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

/**
 * Ruta protegida con restricción por rol.
 * @param {{ children: React.ReactNode, role: string }} props
 */
const RoleRoute = ({ children, role }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="loading-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) {
    // Redirige al dashboard correcto si tiene otro rol
    return <Navigate to={user.role === USER_ROLES.ADMIN ? '/admin' : '/dashboard'} replace />;
  }

  return children;
};

/**
 * Ruta pública — redirige al dashboard si ya está autenticado.
 * @param {{ children: React.ReactNode }} props
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
  <BrowserRouter>
    <Routes>
      {/* Ruta raíz — redirige según estado */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Ruta pública */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Dashboard de administrador */}
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

      {/* Dashboard de usuario */}
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

      {/* Ruta no encontrada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
