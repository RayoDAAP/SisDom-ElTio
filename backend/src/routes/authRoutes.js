/**
 * @module authRoutes
 * @description Define las rutas del módulo de autenticación.
 */
import { Router } from 'express';
import { login, getMe } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route  POST /api/auth/login
 * @desc   Autenticar usuario y obtener JWT
 * @access Público
 */
router.post('/login', login);

/**
 * @route  GET /api/auth/me
 * @desc   Obtener datos del usuario autenticado
 * @access Privado
 */
router.get('/me', authenticate, getMe);

export default router;
