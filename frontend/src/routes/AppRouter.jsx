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
import RepartidorView from '../pages/RepartidorView';
import { USER_ROLES } from '../models/user.model';

/**
 * Determina la ruta por defecto según el rol del usuario.
 */
const getDefaultRouteForRole = (role) => {
  if (role === USER_ROLES.ADMIN) return '/admin';
  if (role === USER_ROLES.REPARTIDOR) return '/repartidor';
  return '/dashboard'; // Auxiliar / Trabajador
};

/**
 * Ruta protegida — redirige a /login si no está autenticado.
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Cargando sistema...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

/**
 * Ruta protegida con restricción por rol específico.
 */
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Cargando sistema...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
};

/**
 * Ruta pública — redirige al dashboard del rol correspondiente si ya está autenticado.
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Cargando sistema...
      </div>
    );
  }
  if (isAuthenticated && user) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
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
            <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
              <AdminDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[USER_ROLES.AUXILIAR, 'user']}>
              <UserDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/repartidor"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={[USER_ROLES.REPARTIDOR]}>
              <RepartidorView />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </HashRouter>
);

export default AppRouter;
