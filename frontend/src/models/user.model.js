/**
 * @module user.model
 * @description Define la estructura de datos del usuario en el frontend.
 *              Actúa como contrato entre la API y los componentes.
 */

/**
 * @typedef {Object} User
 * @property {number} id       - Identificador único
 * @property {string} name     - Nombre completo
 * @property {string} username - Nombre de usuario para login
 * @property {string} email    - Correo electrónico
 * @property {string} role     - Rol ('admin' | 'auxiliar' | 'repartidor')
 * @property {boolean} isActive - Si la cuenta está activa
 */

/**
 * @typedef {Object} AuthResponse
 * @property {string} token - JWT de acceso
 * @property {User}   user  - Datos públicos del usuario
 */

/** @enum {string} */
export const USER_ROLES = {
  ADMIN: 'admin',
  AUXILIAR: 'auxiliar',
  REPARTIDOR: 'repartidor',
  USER: 'auxiliar', // Alias para compatibilidad
};

/**
 * Crea un objeto de usuario con valores por defecto.
 * @param {Partial<User>} overrides
 * @returns {User}
 */
export const createUser = (overrides = {}) => ({
  id: null,
  name: '',
  username: '',
  email: '',
  role: USER_ROLES.AUXILIAR,
  isActive: true,
  ...overrides,
});
