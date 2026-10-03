/**
 * @module userService
 * @description Peticiones HTTP para la administración de usuarios y cuentas.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Obtiene la lista completa de usuarios (admin only).
 */
export const fetchUsers = async () => {
  const response = await axios.get(`${API_URL}/users`, {
    headers: authHeader(),
  });
  return response.data.data.users;
};

/**
 * Crea un nuevo usuario.
 * @param {{ name: string, username: string, password: string, role: string }} userData
 */
export const createUserRequest = async (userData) => {
  const response = await axios.post(`${API_URL}/users`, userData, {
    headers: authHeader(),
  });
  return response.data.data.user;
};

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} userId
 * @param {string} newPassword
 */
export const updateUserPasswordRequest = async (userId, newPassword) => {
  const response = await axios.patch(
    `${API_URL}/users/${userId}/password`,
    { newPassword },
    { headers: authHeader() }
  );
  return response.data;
};

/**
 * Activa o desactiva la cuenta de un usuario.
 * @param {number} userId
 * @param {boolean} isActive
 */
export const toggleUserStatusRequest = async (userId, isActive) => {
  const response = await axios.patch(
    `${API_URL}/users/${userId}/status`,
    { isActive },
    { headers: authHeader() }
  );
  return response.data.data.user;
};
