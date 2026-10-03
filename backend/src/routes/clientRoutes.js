/**
 * @module clientRoutes
 * @description Rutas HTTP para clientes y tarifas por colonia.
 */
import { Router } from 'express';
import { searchClient, getColoniaShipping } from '../controllers/ClientController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/clients/search', searchClient);
router.get('/colonias/shipping', getColoniaShipping);

export default router;
