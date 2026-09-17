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
} from '../controllers/OrderController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación de trabajador/admin
router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);

export default router;
