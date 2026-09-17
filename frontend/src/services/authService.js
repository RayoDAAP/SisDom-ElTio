/**
 * @module authService
 * @description Capa de servicio para comunicarse con la API de autenticación.
 */
import axios from 'axios';

// Normalizar VITE_API_URL para asegurar que siempre incluya el prefijo /api
let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl += '/api';
}
const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginRequest = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data.data;
};

export const getMeRequest = async () => {
  const response = await api.get('/auth/me');
  return response.data.data.user;
};
