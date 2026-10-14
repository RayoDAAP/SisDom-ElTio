/**
 * @module clientRoutes
 * @description Rutas HTTP para clientes, tarifas por colonia y geocodificación.
 */
import { Router } from 'express';
import { searchClient, getColoniaShipping, geocodeAddress } from '../controllers/ClientController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/clients/search', searchClient);
router.get('/clients/geocode', geocodeAddress);
router.get('/colonias/shipping', getColoniaShipping);

export default router;
