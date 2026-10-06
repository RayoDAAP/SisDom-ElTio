/**
 * @module userRoutes
 * @description Rutas para la administración de cuentas de usuario.
 *              Acceso exclusivo para el rol de Administrador.
 */
import { Router } from 'express';
import {
  listUsers,
  createUser,
  changePassword,
  toggleUserStatus,
  listActiveDrivers,
} from '../controllers/UserController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

// Todas las rutas requieren sesión activa y rol de Administrador
router.use(authenticate, authorize(USER_ROLES.ADMIN));

// Debe ir ANTES de la ruta /:id para que no se interprete como un ID
router.get('/drivers', listActiveDrivers);

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:id/password', changePassword);
router.patch('/:id/status', toggleUserStatus);

export default router;
