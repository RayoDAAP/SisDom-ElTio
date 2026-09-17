/**
 * @module OrderController
 * @description Controlador HTTP para gestión de pedidos.
 */
import * as OrderService from '../services/OrderService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * GET /api/orders?range=day|week|month|all
 */
export const getOrders = (req, res) => {
  try {
    const range = req.query.range || 'all';
    const orders = OrderService.getOrders(range);
    return sendSuccess(res, 200, 'Lista de pedidos obtenida', { orders });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * GET /api/orders/:id
 */
export const getOrderById = (req, res) => {
  try {
    const order = OrderService.getOrderById(req.params.id);
    if (!order) {
      return sendError(res, 404, 'Pedido no encontrado');
    }
    return sendSuccess(res, 200, 'Detalle del pedido', { order });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * POST /api/orders
 */
export const createOrder = (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData.client || !orderData.items || !orderData.pricing) {
      return sendError(res, 400, 'Datos del pedido incompletos');
    }

    const createdByName = req.user?.name || 'Trabajador';
    const newOrder = OrderService.createOrder(orderData, createdByName);
    return sendSuccess(res, 201, 'Pedido registrado exitosamente', { order: newOrder });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return sendError(res, 400, 'El estado es requerido');
    }

    const updatedOrder = OrderService.updateOrderStatus(req.params.id, status);
    return sendSuccess(res, 200, 'Estado del pedido actualizado', { order: updatedOrder });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};
