/**
 * @module clientService
 * @description Servicio HTTP para búsqueda de clientes por teléfono y tarifas por colonia.
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
 * Busca cliente registrado por teléfono.
 * @param {string} phone
 */
export const searchClientByPhoneRequest = async (phone) => {
  if (!phone) return null;
  const response = await api.get('/clients/search', { params: { phone } });
  return response.data.data.client;
};

/**
 * Obtiene la tarifa de envío guardada para una colonia.
 * @param {string} colonia
 */
export const fetchShippingFeeByColoniaRequest = async (colonia) => {
  if (!colonia) return null;
  const response = await api.get('/colonias/shipping', { params: { colonia } });
  return response.data.data.fee;
};
