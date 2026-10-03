/**
 * @module AuthController
 * @description Maneja las peticiones HTTP de autenticación.
 *              Delega la lógica de negocio a AuthService.
 */
import * as AuthService from '../services/AuthService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * POST /api/auth/login
 * Autentica un usuario por username (o email) y retorna un JWT.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const login = async (req, res) => {
  const { username, email, password } = req.body;
  const identifier = username || email;

  if (!identifier || !password) {
    return sendError(res, 400, 'El nombre de usuario y la contraseña son requeridos');
  }

  try {
    const result = await AuthService.login(identifier, password);
    return sendSuccess(res, 200, 'Inicio de sesión exitoso', result);
  } catch (error) {
    return sendError(res, 401, error.message);
  }
};

/**
 * GET /api/auth/me
 * Retorna los datos del usuario autenticado (requiere JWT válido).
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
export const getMe = (req, res) => {
  // req.user es inyectado por authMiddleware
  return sendSuccess(res, 200, 'Usuario autenticado', { user: req.user });
};
