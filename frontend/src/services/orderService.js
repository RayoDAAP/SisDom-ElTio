/**
 * @module orderService
 * @description Servicio HTTP para peticiones relacionadas con pedidos.
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

export const fetchOrders = async (range = 'all') => {
  const response = await api.get('/orders', { params: { range } });
  return response.data.data.orders;
};

export const createOrderRequest = async (orderData) => {
  const response = await api.post('/orders', orderData);
  return response.data.data.order;
};

export const updateOrderStatusRequest = async (id, status) => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data.data.order;
};
