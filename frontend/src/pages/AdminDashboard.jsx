/**
 * @module AdminDashboard
 * @description Panel sencillo para administrador.
 */
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Tacos "El Tío" — Panel Admin</h1>
        <button className="dashboard__logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard__body">
        <h2 className="dashboard__welcome">Bienvenido, {user?.name}</h2>
        <p className="dashboard__sub">Rol: Administrador ({user?.email})</p>
      </main>
    </div>
  );
};

export default AdminDashboard;
