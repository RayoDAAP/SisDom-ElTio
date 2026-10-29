/**
 * @module authRoutes
 * @description Define las rutas del módulo de autenticación.
 */
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe } from '../controllers/AuthController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Límite de intentos de login: 10 intentos por 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión, intenta más tarde',
  },
});

/**
 * @route  POST /api/auth/login
 * @desc   Autenticar usuario y obtener JWT
 * @access Público
 */
router.post('/login', loginLimiter, login);

/**
 * @route  GET /api/auth/me
 * @desc   Obtener datos del usuario autenticado
 * @access Privado
 */
router.get('/me', authenticate, getMe);

export default router;
