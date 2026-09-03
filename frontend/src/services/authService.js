/**
 * @module authService
 * @description Capa de servicio para comunicarse con la API de autenticación.
 *              Encapsula todas las peticiones HTTP relacionadas con auth.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Interceptor: inyecta el token JWT en cada petición protegida.
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Envía las credenciales al backend y retorna el token y datos del usuario.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('../models/user.model.js').AuthResponse>}
 */
export const loginRequest = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data; // { token, user }
};

/**
 * Obtiene los datos del usuario actualmente autenticado.
 * @returns {Promise<import('../models/user.model.js').User>}
 */
export const getMeRequest = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
