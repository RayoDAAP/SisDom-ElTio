/**
 * @module orderRoutes
 * @description Rutas del módulo de pedidos.
 */
import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  assignOrder,
  reportMissingItems,
  updatePaymentStatus,
  getDriverRoute,
} from '../controllers/OrderController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

// Todas las rutas requieren autenticación de trabajador/admin/repartidor
router.use(authenticate);

// Ruta de entrega optimizada para repartidor (debe ir antes de /:id)
router.get('/driver/route', getDriverRoute);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

// Reporte de producto o complemento faltante (repartidor o trabajador)
router.post('/:id/report-missing', reportMissingItems);

// Actualización del estado de transferencia bancaria
router.patch('/:id/payment-status', updatePaymentStatus);

// Solo el administrador puede asignar repartidores a pedidos
router.patch('/:id/assign', authorize(USER_ROLES.ADMIN), assignOrder);

export default router;
