/**
 * @module authMiddleware
 * @description Middleware de autenticación y autorización por roles.
 */
import * as AuthService from '../services/AuthService.js';
import { findUserById } from '../models/User.js';
import { sendError } from '../utils/responseHelper.js';

/**
 * Verifica que la petición incluya un Bearer Token JWT válido.
 * Inyecta `req.user` con el payload decodificado si es válido y la cuenta está activa.
 *
 * @type {import('express').RequestHandler}
 */
export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token de autenticación requerido');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = AuthService.verifyToken(token);
  } catch {
    return sendError(res, 401, 'Token inválido o expirado');
  }

  try {
    const usuario = await findUserById(decoded.id);
    if (!usuario || !usuario.isActive) {
      return sendError(res, 401, 'Sesión inválida');
    }
    req.user = { ...decoded, role: usuario.role };
    next();
  } catch {
    return sendError(res, 401, 'Sesión inválida');
  }
};

/**
 * Fábrica de middleware que restringe el acceso a roles específicos.
 * Debe usarse DESPUÉS de `authenticate`.
 *
 * @param {...string} roles - Roles permitidos
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/admin-only', authenticate, authorize('admin'), handler)
 */
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return sendError(res, 403, 'No tienes permisos para acceder a este recurso');
  }
  next();
};
