/**
 * @module AccountsView
 * @description Módulo de administración de cuentas de usuario para Tacos El Tío.
 *              Permite a los administradores:
 *              - Consultar cuentas registradas en el sistema.
 *              - Crear nuevas cuentas con roles: Auxiliar y Repartidor (o Administrador).
 *              - Modificar contraseñas de cualquier cuenta.
 *              - Activar y desactivar el acceso de usuarios.
 */
import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Key,
  ShieldCheck,
  User,
  Bike,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  fetchUsers,
  createUserRequest,
  updateUserPasswordRequest,
  toggleUserStatusRequest,
} from '../../services/userService';
import { USER_ROLES } from '../../models/user.model';

const AccountsView = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estado para modal de creación
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    password: '',
    role: USER_ROLES.AUXILIAR,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Estado para modal de cambio de contraseña
  const [selectedUserForPassword, setSelectedUserForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al cargar las cuentas de usuario');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.username || !createForm.password) {
      setErrorMsg('Por favor completa todos los campos para crear la cuenta');
      return;
    }

    setIsCreating(true);
    setErrorMsg('');
    try {
      const newUser = await createUserRequest(createForm);
      setUsers((prev) => [...prev, newUser]);
      setShowCreateModal(false);
      setCreateForm({ name: '', username: '', password: '', role: USER_ROLES.AUXILIAR });
      setSuccessMsg(`Cuenta @${newUser.username} creada exitosamente`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setIsCreating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setIsUpdatingPassword(true);
    setErrorMsg('');
    try {
      await updateUserPasswordRequest(selectedUserForPassword.id, newPassword);
      setSelectedUserForPassword(null);
      setNewPassword('');
      setSuccessMsg('Contraseña actualizada correctamente');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al actualizar contraseña');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.role === USER_ROLES.ADMIN && user.isActive) {
      alert('No es posible desactivar una cuenta de Administrador principal');
      return;
    }

    try {
      const updated = await toggleUserStatusRequest(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: updated.isActive } : u))
      );
      setSuccessMsg(`Cuenta @${user.username} ${updated.isActive ? 'activada' : 'desactivada'}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <ShieldCheck className="w-3 h-3 text-purple-600" />
            Administrador
          </span>
        );
      case USER_ROLES.REPARTIDOR:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Bike className="w-3 h-3 text-sky-600" />
            Repartidor
          </span>
        );
      case USER_ROLES.AUXILIAR:
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <User className="w-3 h-3 text-amber-600" />
            Auxiliar
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acción */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-red" />
            <span>Control de Cuentas y Accesos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administra roles, contraseñas y permisos del personal operativo
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setErrorMsg('');
            setShowCreateModal(true);
          }}
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Nueva Cuenta</span>
        </Button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800 font-medium">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
            <span>Cargando cuentas...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Nombre</th>
                  <th className="p-3.5">Usuario</th>
                  <th className="p-3.5">Rol</th>
                  <th className="p-3.5">Estado</th>
                  <th className="p-3.5">Fecha Registro</th>
                  <th className="p-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3.5 font-mono text-slate-600">@{u.username}</td>
                    <td className="p-3.5">{getRoleBadge(u.role)}</td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactivo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserForPassword(u);
                          setNewPassword('');
                        }}
                      >
                        <Key className="w-3.5 h-3.5 mr-1" />
                        <span>Contraseña</span>
                      </Button>

                      {u.role !== USER_ROLES.ADMIN && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            u.isActive
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Crear Nueva Cuenta */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 my-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-red">
                Seguridad y Accesos
              </span>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Crear Nueva Cuenta de Usuario
              </h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <Input
                id="create-name"
                name="name"
                label="Nombre completo"
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ej. Juan Pérez"
                icon={User}
                required
              />

              <Input
                id="create-username"
                name="username"
                label="Nombre de usuario"
                type="text"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="juanp"
                required
              />

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rol del usuario
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value={USER_ROLES.AUXILIAR}>Auxiliar (Captura de pedidos)</option>
                  <option value={USER_ROLES.REPARTIDOR}>Repartidor (App móvil)</option>
                  <option value={USER_ROLES.ADMIN}>Administrador General</option>
                </select>
              </div>

              <Input
                id="create-password"
                name="password"
                label="Contraseña"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 4 caracteres"
                icon={Lock}
                required
              />

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isCreating}
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  <span>Crear Cuenta</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Contraseña */}
      {selectedUserForPassword && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedUserForPassword(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 my-auto p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-red">
                Seguridad
              </span>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Cambiar Contraseña: @{selectedUserForPassword.username}
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                id="change-password-input"
                name="newPassword"
                label="Nueva Contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva clave"
                icon={Lock}
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUserForPassword(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isUpdatingPassword}
                >
                  <Key className="w-3.5 h-3.5 mr-1" />
                  <span>Actualizar Clave</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsView;
