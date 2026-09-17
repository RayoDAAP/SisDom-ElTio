/**
 * @module OrderService
 * @description Servicio con la lógica de negocio para pedidos.
 */
import { orderStore, ORDER_STATUS } from '../models/Order.js';

let orderCounter = 1004;

/**
 * Obtiene todos los pedidos con opción de filtrado por período.
 * @param {'day' | 'week' | 'month' | 'all'} range
 * @returns {Array} Lista de pedidos filtrada y ordenada por fecha descendente
 */
export const getOrders = (range = 'all') => {
  const now = new Date();
  
  const filtered = orderStore.filter((order) => {
    if (range === 'all') return true;

    const orderDate = new Date(order.createdAt);
    const diffTime = Math.abs(now - orderDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (range === 'day') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (range === 'week') {
      return diffDays <= 7;
    }
    if (range === 'month') {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }

    return true;
  });

  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

/**
 * Busca un pedido por su ID.
 * @param {string} id
 */
export const getOrderById = (id) => {
  return orderStore.find((o) => o.id === id);
};

/**
 * Crea un nuevo pedido.
 * @param {Object} orderData
 * @param {string} createdByName
 */
export const createOrder = (orderData, createdByName) => {
  const newOrder = {
    id: `PED-${orderCounter++}`,
    createdAt: new Date().toISOString(),
    status: ORDER_STATUS.PENDING,
    createdBy: createdByName || 'Trabajador',
    ...orderData,
  };

  orderStore.unshift(newOrder);
  return newOrder;
};

/**
 * Actualiza el estado de un pedido.
 * @param {string} id
 * @param {string} newStatus
 */
export const updateOrderStatus = (id, newStatus) => {
  const order = getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new Error('Estado de pedido inválido');
  }

  order.status = newStatus;
  return order;
};
