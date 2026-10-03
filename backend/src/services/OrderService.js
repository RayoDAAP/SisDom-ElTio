/**
 * @module OrderService
 * @description Servicio con la lógica de negocio para pedidos.
 *              Incluye soporte para métodos de pago (Efectivo/Transferencia),
 *              ítems de tacos/gorditas/tostadas y filtrado por rol (Auxiliar solo ve órdenes de su turno/día).
 */
import { orderStore, ORDER_STATUS } from '../models/Order.js';
import { registerClientAndColonia } from './ClientService.js';

let orderCounter = 1004;

/**
 * Obtiene los pedidos con opción de filtrado por período y rol del usuario solicitante.
 * Si el usuario es Auxiliar, solo tiene visibilidad de las órdenes del día de hoy.
 *
 * @param {'day' | 'week' | 'month' | 'all'} range
 * @param {object} requestingUser
 * @returns {Array} Lista de pedidos filtrada y ordenada por fecha descendente
 */
export const getOrders = (range = 'all', requestingUser = null) => {
  const now = new Date();
  const isAuxiliar = requestingUser?.role === 'auxiliar' || requestingUser?.role === 'user';
  const effectiveRange = isAuxiliar ? 'day' : range;

  const filtered = orderStore.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const diffTime = Math.abs(now - orderDate);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (effectiveRange === 'day') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (effectiveRange === 'week') {
      return diffDays <= 7;
    }
    if (effectiveRange === 'month') {
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
 * Crea un nuevo pedido y guarda automáticamente al cliente y la tarifa por colonia.
 * @param {Object} orderData
 * @param {string} createdByName
 */
export const createOrder = (orderData, createdByName) => {
  const newOrder = {
    id: `PED-${orderCounter++}`,
    createdAt: new Date().toISOString(),
    status: ORDER_STATUS.PENDING,
    createdBy: createdByName || 'Auxiliar de Pedidos',
    ...orderData,
  };

  orderStore.unshift(newOrder);

  // Guardado de cliente y colonia de forma automática
  if (orderData.client) {
    registerClientAndColonia(orderData.client, orderData.pricing?.shippingFee);
  }

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
