/**
 * @module AuthService
 * @description Lógica de negocio de autenticación con JWT y bcrypt.
 *              Soporta inicio de sesión mediante nombre de usuario y verificación de estado activo.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findUserByUsername, toPublicUser } from '../models/User.js';

/**
 * Genera un JSON Web Token firmado para el usuario dado.
 * @param {object} user
 * @returns {string} JWT
 */
const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

/**
 * Autentica un usuario con nombre de usuario (o email) y contraseña.
 * Valida también que la cuenta esté activa.
 * @param {string} usernameOrEmail
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export const login = async (usernameOrEmail, password) => {
  const user = findUserByUsername(usernameOrEmail);

  if (!user) {
    throw new Error('Credenciales inválidas');
  }

  if (user.isActive === false) {
    throw new Error('Esta cuenta ha sido desactivada. Contacte al administrador.');
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
 */
export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);
