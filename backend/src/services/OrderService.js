/**
 * @module OrderService
 * @description Servicio con la lógica de negocio para pedidos.
 *              Incluye soporte para métodos de pago (Efectivo/Transferencia),
 *              ítems de tacos/gorditas/tostadas y filtrado por rol (Auxiliar solo ve órdenes de su turno/día).
 */
import { orderStore, ORDER_STATUS } from '../models/Order.js';
import { registerClientAndColonia } from './ClientService.js';
import { findUserById, USER_ROLES } from '../models/User.js';

let orderCounter = 1004;

/**
 * Obtiene los pedidos con opción de filtrado por período y rol del usuario solicitante.
 * Si el usuario es Auxiliar, solo tiene visibilidad de las órdenes del día de hoy.
 * Si el usuario es Repartidor, solo tiene visibilidad de las órdenes asignadas a él.
 *
 * @param {'day' | 'week' | 'month' | 'all'} range
 * @param {object} requestingUser
 * @returns {Array} Lista de pedidos filtrada y ordenada por fecha descendente
 */
export const getOrders = (range = 'all', requestingUser = null) => {
  const now = new Date();
  const isAuxiliar = requestingUser?.role === 'auxiliar' || requestingUser?.role === 'user';
  const isRepartidor = requestingUser?.role === 'repartidor';
  const effectiveRange = isAuxiliar ? 'day' : range;

  const filtered = orderStore.filter((order) => {
    // Si el usuario solicitante es repartidor, solo puede ver pedidos asignados a él
    if (isRepartidor) {
      if (
        order.assignedTo !== requestingUser.id &&
        String(order.assignedTo) !== String(requestingUser.id)
      ) {
        return false;
      }
    }

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

  // Prioridad: 
  // 1. Pedidos con reporte de faltante (ORDER_STATUS.MISSING_ITEMS = 'incompleto') tienen máxima prioridad
  // 2. Pedidos activos en curso (pendiente, listo, asignado, en_camino)
  // 3. Pedidos finalizados (entregado, cancelado)
  // Dentro del mismo grupo: ordenados del MÁS VIEJO al MÁS NUEVO (ascendente por createdAt)
  const getPriorityWeight = (order) => {
    if (order.status === ORDER_STATUS.MISSING_ITEMS) return 0; // Máxima prioridad absoluta
    if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) return 2;
    return 1;
  };

  return filtered.sort((a, b) => {
    const weightA = getPriorityWeight(a);
    const weightB = getPriorityWeight(b);
    if (weightA !== weightB) return weightA - weightB;
    // Del más viejo al más nuevo (FIFO)
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
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
    assignedTo: orderData.assignedTo || null,
    assignedToName: orderData.assignedToName || '',
    assignedAt: orderData.assignedTo ? new Date().toISOString() : null,
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
 * Si el pedido ya está entregado o cancelado, queda bloqueado y no se puede modificar.
 * @param {string} id
 * @param {string} newStatus
 */
export const updateOrderStatus = (id, newStatus) => {
  const order = getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  // Regla: Una vez entregado o cancelado, su estado queda bloqueado permanentemente
  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) {
    throw new Error(`El pedido ${id} ya está ${order.status} y no se puede modificar su estado.`);
  }

  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    throw new Error('Estado de pedido inválido');
  }

  order.status = newStatus;
  return order;
};

/**
 * Asigna un pedido a un repartidor activo (o desasigna si driverId es nulo).
 * Cuando se asigna, el pedido pasa al estado 'asignado'.
 * Si el pedido ya está entregado o cancelado, no se puede modificar la asignación.
 * @param {string} id - Folio del pedido
 * @param {number|string|null} driverId - ID del repartidor
 * @returns {object} Pedido actualizado
 */
export const assignOrder = (id, driverId) => {
  const order = getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) {
    throw new Error(`El pedido ${id} ya está ${order.status} y no se puede modificar.`);
  }

  // Si se pasa null, vacio o 0, desasignar
  if (!driverId) {
    order.assignedTo = null;
    order.assignedToName = '';
    order.assignedAt = null;
    if (order.status === ORDER_STATUS.ASSIGNED) {
      order.status = ORDER_STATUS.PENDING;
    }
    return order;
  }

  const driver = findUserById(driverId);
  if (!driver) {
    throw new Error('El repartidor especificado no existe');
  }

  if (driver.role !== USER_ROLES.REPARTIDOR) {
    throw new Error('El usuario asignado no tiene el rol de repartidor');
  }

  if (driver.isActive === false) {
    throw new Error('No se puede asignar un pedido a una cuenta de repartidor desactivada');
  }

  order.assignedTo = driver.id;
  order.assignedToName = driver.name;
  order.assignedAt = new Date().toISOString();

  // Asignar el nuevo estatus 'asignado' si estaba pendiente o listo
  if (order.status === ORDER_STATUS.PENDING || order.status === ORDER_STATUS.READY) {
    order.status = ORDER_STATUS.ASSIGNED;
  }

  return order;
};

/**
 * Reporta un faltante en el pedido (por ejemplo, reportado por el repartidor).
 * Pone el pedido en el estatus 'incompleto' con máxima prioridad de atención.
 * @param {string} id - Folio del pedido
 * @param {string} missingNote - Descripción de lo que falta
 * @param {object} reportingUser - Usuario que realiza el reporte
 * @returns {object} Pedido actualizado con el reporte
 */
export const reportMissingItems = (id, missingNote, reportingUser = null) => {
  const order = getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) {
    throw new Error(`No se puede reportar faltante en un pedido ${order.status}.`);
  }

  if (!missingNote || !missingNote.trim()) {
    throw new Error('Debes describir qué producto o complemento hace falta en el pedido');
  }

  order.status = ORDER_STATUS.MISSING_ITEMS;
  order.missingReport = {
    note: missingNote.trim(),
    reportedAt: new Date().toISOString(),
    reportedBy: reportingUser?.name || 'Repartidor',
  };

  return order;
};

/**
 * Actualiza el estado de una transferencia bancaria (pendiente / aceptada).
 * @param {string} id - Folio del pedido
 * @param {'pendiente' | 'aceptada'} transferStatus
 * @returns {object} Pedido actualizado
 */
export const updatePaymentStatus = (id, transferStatus) => {
  const order = getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  const validStatuses = ['pendiente', 'aceptada'];
  if (!validStatuses.includes(transferStatus)) {
    throw new Error('Estado de transferencia no válido. Debe ser pendiente o aceptada.');
  }

  if (!order.payment) {
    order.payment = { method: 'transferencia' };
  }

  order.payment.transferStatus = transferStatus;
  return order;
};
