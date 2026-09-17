/**
 * @module User
 * @description Modelo de usuario. Define la estructura de datos y los roles permitidos.
 */

/** @enum {string} Roles disponibles en el sistema */
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user', // Auxiliar / Trabajador
};

export const userStore = [
  {
    id: 1,
    name: 'Administrador General',
    email: 'admin@eltio.com',
    password: '$2a$10$DF/K0CG1RzOgv/haOhQDSutxHdnUbDP1jUdKSKR3WnwLCFdE7IhjK', // admin123
    role: USER_ROLES.ADMIN,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    name: 'Auxiliar de Pedidos',
    email: 'user@eltio.com',
    password: '$2a$10$eWbrnV7d/mggNZJTsNDUP..CPzVbQlT0fkxwhyrJd42z8VTampTHu', // user123
    role: USER_ROLES.USER,
    createdAt: new Date('2024-01-02'),
  },
];

export const toPublicUser = (user) => {
  const { password, ...publicUser } = user;
  return publicUser;
};
