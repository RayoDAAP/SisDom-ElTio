/**
 * @module OrderService
 * @description Servicio con la lógica de negocio para pedidos conectado a Supabase.
 *              Incluye soporte para métodos de pago (Efectivo/Transferencia),
 *              ítems de tacos/gorditas/tostadas y filtrado por rol.
 */
import { supabase } from '../config/supabase.js';
import { ORDER_STATUS, mapOrderFromDB, generateNextOrderId } from '../models/Order.js';
import { registerClientAndColonia } from './ClientService.js';
import { findUserById, USER_ROLES } from '../models/User.js';

/**
 * Obtiene los pedidos con opción de filtrado por período y rol del usuario solicitante.
 * Si el usuario es Auxiliar, solo tiene visibilidad de las órdenes del día de hoy.
 * Si el usuario es Repartidor, solo tiene visibilidad de las órdenes asignadas a él.
 *
 * @param {'day' | 'week' | 'month' | 'all'} range
 * @param {object} requestingUser
 * @returns {Promise<Array>} Lista de pedidos filtrada y ordenada por prioridad y FIFO
 */
export const getOrders = async (range = 'all', requestingUser = null) => {
  const isAuxiliar = requestingUser?.role === 'auxiliar' || requestingUser?.role === 'user';
  const isRepartidor = requestingUser?.role === 'repartidor';
  const effectiveRange = isAuxiliar ? 'day' : range;

  let query = supabase.from('orders').select('*');

  if (isRepartidor && requestingUser?.id) {
    query = query.eq('assigned_to', requestingUser.id);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error('Error obteniendo pedidos de Supabase:', error?.message);
    return [];
  }

  const now = new Date();
  const orders = data.map(mapOrderFromDB);

  const filtered = orders.filter((order) => {
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
  // 2. Pedidos activos en curso (listo, asignado, en_camino)
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
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
};

/**
 * Busca un pedido por su ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export const getOrderById = async (id) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  return mapOrderFromDB(data);
};

/**
 * Crea un nuevo pedido en Supabase y guarda automáticamente al cliente y la tarifa por colonia.
 * @param {Object} orderData
 * @param {string} createdByName
 * @returns {Promise<object>}
 */
export const createOrder = async (orderData, createdByName) => {
  const newId = await generateNextOrderId();
  const createdAt = new Date().toISOString();

  const payload = {
    id: newId,
    created_at: createdAt,
    status: ORDER_STATUS.READY, // Estatus inicial: 'listo'
    created_by: createdByName || 'Auxiliar de Pedidos',
    client: orderData.client || {},
    items: orderData.items || {},
    pricing: orderData.pricing || {},
    payment: orderData.payment || {},
    notes: orderData.notes || '',
    assigned_to: orderData.assignedTo || null,
    assigned_to_name: orderData.assignedToName || '',
    assigned_at: orderData.assignedTo ? createdAt : null,
    missing_report: null,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al registrar el pedido en base de datos: ${error.message}`);
  }

  // Guardado de cliente y colonia de forma automática
  if (orderData.client) {
    await registerClientAndColonia(orderData.client, orderData.pricing?.shippingFee);
  }

  return mapOrderFromDB(data);
};

/**
 * Actualiza el estado de un pedido.
 * Si el pedido ya está entregado o cancelado, queda bloqueado y no se puede modificar.
 * @param {string} id
 * @param {string} newStatus
 * @returns {Promise<object>}
 */
export const updateOrderStatus = async (id, newStatus) => {
  const order = await getOrderById(id);
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

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al actualizar estado: ${error.message}`);
  }

  return mapOrderFromDB(data);
};

/**
 * Asigna un pedido a un repartidor activo (o desasigna si driverId es nulo).
 * Cuando se asigna, el pedido pasa al estado 'asignado'.
 * Si el pedido ya está entregado o cancelado, no se puede modificar la asignación.
 * @param {string} id - Folio del pedido
 * @param {number|string|null} driverId - ID del repartidor
 * @returns {Promise<object>} Pedido actualizado
 */
export const assignOrder = async (id, driverId) => {
  const order = await getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) {
    throw new Error(`El pedido ${id} ya está ${order.status} y no se puede modificar.`);
  }

  // Si se pasa null, vacío o 0, desasignar
  if (!driverId) {
    const updatePayload = {
      assigned_to: null,
      assigned_to_name: '',
      assigned_at: null,
      status: order.status === ORDER_STATUS.ASSIGNED ? ORDER_STATUS.READY : order.status,
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return mapOrderFromDB(data);
  }

  const driver = await findUserById(driverId);
  if (!driver) {
    throw new Error('El repartidor especificado no existe');
  }

  if (driver.role !== USER_ROLES.REPARTIDOR) {
    throw new Error('El usuario asignado no tiene el rol de repartidor');
  }

  if (driver.isActive === false) {
    throw new Error('No se puede asignar un pedido a una cuenta de repartidor desactivada');
  }

  const updatePayload = {
    assigned_to: driver.id,
    assigned_to_name: driver.name,
    assigned_at: new Date().toISOString(),
    status: order.status === ORDER_STATUS.READY ? ORDER_STATUS.ASSIGNED : order.status,
  };

  const { data, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapOrderFromDB(data);
};

/**
 * Reporta un faltante en el pedido (por ejemplo, reportado por el repartidor).
 * Pone el pedido en el estatus 'incompleto' con máxima prioridad de atención.
 * @param {string} id - Folio del pedido
 * @param {string} missingNote - Descripción de lo que falta
 * @param {object} reportingUser - Usuario que realiza el reporte
 * @returns {Promise<object>} Pedido actualizado con el reporte
 */
export const reportMissingItems = async (id, missingNote, reportingUser = null) => {
  const order = await getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  if (order.status === ORDER_STATUS.DELIVERED || order.status === ORDER_STATUS.CANCELLED) {
    throw new Error(`No se puede reportar faltante en un pedido ${order.status}.`);
  }

  if (!missingNote || !missingNote.trim()) {
    throw new Error('Debes describir qué producto o complemento hace falta en el pedido');
  }

  const missingReport = {
    note: missingNote.trim(),
    reportedAt: new Date().toISOString(),
    reportedBy: reportingUser?.name || 'Repartidor',
  };

  const { data, error } = await supabase
    .from('orders')
    .update({
      status: ORDER_STATUS.MISSING_ITEMS,
      missing_report: missingReport,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapOrderFromDB(data);
};

/**
 * Actualiza el estado de una transferencia bancaria (pendiente / aceptada).
 * @param {string} id - Folio del pedido
 * @param {'pendiente' | 'aceptada'} transferStatus
 * @returns {Promise<object>} Pedido actualizado
 */
export const updatePaymentStatus = async (id, transferStatus) => {
  const order = await getOrderById(id);
  if (!order) {
    throw new Error('Pedido no encontrado');
  }

  const validStatuses = ['pendiente', 'aceptada'];
  if (!validStatuses.includes(transferStatus)) {
    throw new Error('Estado de transferencia no válido. Debe ser pendiente o aceptada.');
  }

  const updatedPayment = {
    ...(order.payment || { method: 'transferencia' }),
    transferStatus,
  };

  const { data, error } = await supabase
    .from('orders')
    .update({ payment: updatedPayment })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapOrderFromDB(data);
};
