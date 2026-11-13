/**
 * @module trackingRoutes
 * @description Rutas para el rastreo satelital en vivo de choferes y control de permisos de ubicación.
 */
import { Router } from 'express';
import {
  reportLocation,
  getMyStatus,
  requestTurnOff,
  turnOnTracking,
  listAllDriverTracking,
  handleApproveRequest,
} from '../controllers/DriverTrackingController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Rutas accesibles por el repartidor (desde el móvil)
router.post('/location', reportLocation);
router.get('/status', getMyStatus);
router.post('/request-off', requestTurnOff);
router.post('/turn-on', turnOnTracking);

// Rutas exclusivas para el Administrador (desde el panel web)
router.get('/drivers', authorize('admin'), listAllDriverTracking);
router.post('/drivers/:id/approve-off', authorize('admin'), handleApproveRequest);

export default router;
