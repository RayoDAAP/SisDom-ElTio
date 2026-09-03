/**
 * @module AuthService
 * @description Contiene la lógica de negocio de autenticación.
 *              Desacoplado del controlador para facilitar pruebas y mantenimiento.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { userStore, toPublicUser } from '../models/User.js';

/**
 * Busca un usuario por email en el store.
 * @param {string} email
 * @returns {import('../models/User.js').User | undefined}
 */
const findUserByEmail = (email) =>
  userStore.find((u) => u.email.toLowerCase() === email.toLowerCase());

/**
 * Genera un JSON Web Token firmado para el usuario dado.
 * @param {import('../models/User.js').User} user
 * @returns {string} JWT
 */
const generateToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

/**
 * Autentica un usuario con email y contraseña.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 * @throws {Error} Si las credenciales son inválidas
 */
export const login = async (email, password) => {
  const user = findUserByEmail(email);

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Credenciales inválidas');
  }

  const token = generateToken(user);
  return { token, user: toPublicUser(user) };
};

/**
 * Verifica y decodifica un JWT.
 * @param {string} token
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token es inválido o expiró
 */
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
