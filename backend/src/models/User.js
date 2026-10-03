/**
 * @module User
 * @description Modelo de usuario y repositorio en memoria.
 *              Soporta roles de Administrador, Auxiliar y Repartidor,
 *              autenticación por nombre de usuario y control de activación.
 */

/** @enum {string} Roles disponibles en el sistema */
export const USER_ROLES = {
  ADMIN: 'admin',
  AUXILIAR: 'auxiliar',
  REPARTIDOR: 'repartidor',
  USER: 'auxiliar', // Alias de compatibilidad hacia atrás
};

/**
 * Store en memoria con usuarios por defecto.
 * Contraseñas hasheadas con bcryptjs (10 rondas):
 * - admin: admin123
 * - auxiliar: user123
 * - repartidor: rep123
 */
export const userStore = [
  {
    id: 1,
    name: 'Administrador General',
    username: 'admin',
    email: 'admin@eltio.com',
    password: '$2a$10$XKjNEER1kO7oZ.0hmxW.RewjtgFl2w2J5el7fV5Q62xFqrS1Ppul.', // admin123
    role: USER_ROLES.ADMIN,
    isActive: true,
    createdAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 2,
    name: 'Auxiliar de Pedidos',
    username: 'auxiliar',
    email: 'auxiliar@eltio.com',
    password: '$2a$10$69Qf0PGdmUQwivptGvO0Yezi8ppvcuDNeYOffBk.W/QRl6s4oSqty', // user123
    role: USER_ROLES.AUXILIAR,
    isActive: true,
    createdAt: new Date('2024-01-02').toISOString(),
  },
  {
    id: 3,
    name: 'Repartidor Principal',
    username: 'repartidor',
    email: 'repartidor@eltio.com',
    password: '$2a$10$AH9bILCFta0FKRE6sWLr3Oa4GsqhgEfaGwq7BCx20Ew1H9bgTSj6C', // rep123
    role: USER_ROLES.REPARTIDOR,
    isActive: true,
    createdAt: new Date('2024-01-03').toISOString(),
  },
];

let nextUserId = 4;

/**
 * Filtra el campo sensible password antes de responder al cliente.
 * @param {object} user
 * @returns {object} Usuario público
 */
export const toPublicUser = (user) => {
  if (!user) return null;
  const { password, ...publicUser } = user;
  return publicUser;
};

/**
 * Busca un usuario por nombre de usuario (o email como alternativa).
 * @param {string} identifier
 * @returns {object | undefined}
 */
export const findUserByUsername = (identifier) => {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  return userStore.find(
    (u) =>
      u.username?.toLowerCase() === clean ||
      u.email?.toLowerCase() === clean
  );
};

/**
 * Busca un usuario por ID numérico.
 * @param {number} id
 * @returns {object | undefined}
 */
export const findUserById = (id) => userStore.find((u) => u.id === Number(id));

/**
 * Retorna todos los usuarios en formato seguro.
 * @returns {Array<object>}
 */
export const getAllUsers = () => userStore.map(toPublicUser);

/**
 * Crea un nuevo usuario en el store.
 * @param {object} data
 * @returns {object} Usuario público creado
 */
export const createUserInStore = (data) => {
  const newUser = {
    id: nextUserId++,
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    email: `${data.username.trim().toLowerCase()}@eltio.com`,
    password: data.password, // Ya debe venir hasheada
    role: data.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  userStore.push(newUser);
  return toPublicUser(newUser);
};

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} id
 * @param {string} hashedPassword
 * @returns {boolean}
 */
export const updateUserPasswordInStore = (id, hashedPassword) => {
  const user = findUserById(id);
  if (!user) return false;
  user.password = hashedPassword;
  return true;
};

/**
 * Cambia el estado de activación de un usuario.
 * @param {number} id
 * @param {boolean} isActive
 * @returns {object | null}
 */
export const toggleUserStatusInStore = (id, isActive) => {
  const user = findUserById(id);
  if (!user) return null;
  user.isActive = isActive;
  return toPublicUser(user);
};
