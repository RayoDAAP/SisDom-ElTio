/**
 * @module UserDashboard
 * @description Panel sencillo para usuario.
 */
import useAuth from '../hooks/useAuth';

const UserDashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1 className="dashboard__title">Tacos "El Tío" — Panel Usuario</h1>
        <button className="dashboard__logout" onClick={logout}>
          Cerrar sesión
        </button>
      </header>

      <main className="dashboard__body">
        <h2 className="dashboard__welcome">Bienvenido, {user?.name}</h2>
        <p className="dashboard__sub">Rol: Cliente ({user?.email})</p>
      </main>
    </div>
  );
};

export default UserDashboard;
