/**
 * @module UserController
 * @description Controlador HTTP para gestión de cuentas de usuario.
 */
import * as UserService from '../services/UserService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * GET /api/users
 * Retorna la lista de todas las cuentas de usuario.
 */
export const listUsers = async (req, res) => {
  try {
    const users = await UserService.listUsers();
    return sendSuccess(res, 200, 'Lista de usuarios obtenida', { users });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * POST /api/users
 * Registra una nueva cuenta de usuario (auxiliar, repartidor o admin).
 */
export const createUser = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;
    const user = await UserService.createUser({ name, username, password, role });
    return sendSuccess(res, 201, 'Usuario creado exitosamente', { user });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * PATCH /api/users/:id/password
 * Modifica la contraseña de un usuario.
 */
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return sendError(res, 400, 'La nueva contraseña es requerida');
    }

    await UserService.changePassword(Number(req.params.id), newPassword);
    return sendSuccess(res, 200, 'Contraseña actualizada correctamente');
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * PATCH /api/users/:id/status
 * Activa o desactiva la cuenta de un usuario.
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return sendError(res, 400, 'El estado isActive debe ser booleano');
    }

    const updatedUser = await UserService.setUserActiveStatus(Number(req.params.id), isActive);
    return sendSuccess(res, 200, `Usuario ${isActive ? 'activado' : 'desactivado'} exitosamente`, {
      user: updatedUser,
    });
  } catch (error) {
    return sendError(res, 400, error.message);
  }
};

/**
 * GET /api/users/drivers
 * Retorna la lista de repartidores activos disponibles para asignación.
 * Accesible para el rol Administrador.
 */
export const listActiveDrivers = async (req, res) => {
  try {
    const drivers = await UserService.listActiveDrivers();
    return sendSuccess(res, 200, 'Repartidores activos obtenidos', { drivers });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
