/**
 * @module UserService
 * @description Lógica de negocio para la administración de cuentas de usuario.
 */
import bcrypt from 'bcryptjs';
import {
  getAllUsers,
  createUserInStore,
  updateUserPasswordInStore,
  toggleUserStatusInStore,
  findUserByUsername,
  findUserById,
  USER_ROLES,
} from '../models/User.js';

/**
 * Obtiene todas las cuentas del sistema.
 * @returns {Array<object>}
 */
export const listUsers = () => {
  return getAllUsers();
};

/**
 * Registra una nueva cuenta de usuario.
 * @param {object} data - { name, username, password, role }
 * @returns {Promise<object>}
 */
export const createUser = async ({ name, username, password, role }) => {
  if (!name || !name.trim()) {
    throw new Error('El nombre completo es requerido');
  }

  if (!username || !username.trim()) {
    throw new Error('El nombre de usuario es requerido');
  }

  if (!password || password.length < 4) {
    throw new Error('La contraseña debe tener al menos 4 caracteres');
  }

  const validRoles = [USER_ROLES.ADMIN, USER_ROLES.AUXILIAR, USER_ROLES.REPARTIDOR];
  if (!validRoles.includes(role)) {
    throw new Error('Rol no válido. Debe ser admin, auxiliar o repartidor.');
  }

  const existing = findUserByUsername(username);
  if (existing) {
    throw new Error('El nombre de usuario ya está registrado en el sistema');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return createUserInStore({
    name,
    username,
    password: hashedPassword,
    role,
  });
};

/**
 * Actualiza la contraseña de un usuario existente.
 * @param {number} userId
 * @param {string} newPassword
 * @returns {Promise<boolean>}
 */
export const changePassword = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres');
  }

  const user = findUserById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return updateUserPasswordInStore(userId, hashedPassword);
};

/**
 * Activa o desactiva la cuenta de un usuario.
 * @param {number} userId
 * @param {boolean} isActive
 * @returns {object}
 */
export const setUserActiveStatus = (userId, isActive) => {
  const user = findUserById(userId);
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Prevenir que el admin se desactive a sí mismo accidentalmente
  if (user.role === USER_ROLES.ADMIN && isActive === false) {
    throw new Error('No es posible desactivar una cuenta de Administrador principal');
  }

  return toggleUserStatusInStore(userId, isActive);
};
