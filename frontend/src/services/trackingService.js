/**
 * @module trackingService
 * @description Peticiones al backend para monitoreo y control de ubicación GPS de choferes.
 */
import axios from 'axios';

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

/**
 * Obtiene todas las ubicaciones y solicitudes de apagado de los choferes.
 */
export const fetchDriverLocations = async () => {
  const response = await api.get('/tracking/drivers');
  return response.data.data.locations || [];
};

/**
 * Resuelve la solicitud de apagado de GPS (aprobar o rechazar).
 * @param {number|string} driverId
 * @param {boolean} approved
 */
export const resolveDriverTrackingRequest = async (driverId, approved = true) => {
  const response = await api.post(`/tracking/drivers/${driverId}/approve-off`, {
    approved,
  });
  return response.data.data;
};
