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

/**
 * Asigna (o desasigna) un repartidor activo a un pedido.
 * @param {string} orderId
 * @param {number|null} driverId - null para desasignar
 */
export const assignOrderRequest = async (orderId, driverId) => {
  const response = await api.patch(`/orders/${orderId}/assign`, { driverId });
  return response.data.data.order;
};

/**
 * Actualiza el estado de una transferencia bancaria (pendiente / aceptada).
 * @param {string} orderId
 * @param {'pendiente' | 'aceptada'} transferStatus
 */
export const updatePaymentStatusRequest = async (orderId, transferStatus) => {
  const response = await api.patch(`/orders/${orderId}/payment-status`, { transferStatus });
  return response.data.data.order;
};

/**
 * Reporta un faltante en el pedido (estatus 'incompleto').
 * @param {string} orderId
 * @param {string} note
 */
export const reportMissingRequest = async (orderId, note) => {
  const response = await api.post(`/orders/${orderId}/report-missing`, { note });
  return response.data.data.order;
};

