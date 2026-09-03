/**
 * @module User
 * @description Modelo de usuario. Define la estructura de datos y los roles permitidos.
 *              En esta versión usa un store en memoria. Se migrará a DB en futuras iteraciones.
 */

/** @enum {string} Roles disponibles en el sistema */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
};

/**
 * @typedef {Object} User
 * @property {number}  id        - Identificador único
 * @property {string}  name      - Nombre completo
 * @property {string}  email     - Correo electrónico (único)
 * @property {string}  password  - Contraseña hasheada
 * @property {string}  role      - Rol del usuario (admin | user)
 * @property {Date}    createdAt - Fecha de creación
 */

/**
 * Store en memoria — simula una base de datos durante el desarrollo.
 * Las contraseñas están hasheadas con bcrypt (salt rounds: 10).
 *
 * admin123 → $2a$10$...
 * user123  → $2a$10$...
 */
export const userStore = [
  {
    id: 1,
    name: 'Administrador',
    email: 'admin@eltio.com',
    // bcrypt hash de "admin123"
    password: '$2a$10$DF/K0CG1RzOgv/haOhQDSutxHdnUbDP1jUdKSKR3WnwLCFdE7IhjK',
    role: USER_ROLES.ADMIN,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'Usuario Demo',
    email: 'user@eltio.com',
    // bcrypt hash de "user123"
    password: '$2a$10$eWbrnV7d/mggNZJTsNDUP..CPzVbQlT0fkxwhyrJd42z8VTampTHu',
    role: USER_ROLES.USER,
    createdAt: new Date('2024-01-02'),
  },
];

/**
 * Retorna una representación pública del usuario (sin contraseña).
 * @param {User} user
 * @returns {Omit<User, 'password'>}
 */
export const toPublicUser = (user) => {
  const { password, ...publicUser } = user;
  return publicUser;
};
