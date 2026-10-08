/**
 * @module User
 * @description Modelo de usuario y repositorio conectado a Supabase.
 *              Soporta roles de Administrador, Auxiliar y Repartidor,
 *              autenticación por nombre de usuario y control de activación.
 */
import { supabase } from '../config/supabase.js';

/** @enum {string} Roles disponibles en el sistema */
export const USER_ROLES = {
  ADMIN: 'admin',
  AUXILIAR: 'auxiliar',
  REPARTIDOR: 'repartidor',
  USER: 'auxiliar', // Alias de compatibilidad hacia atrás
};

/**
 * Normaliza un registro de base de datos a formato de la aplicación (camelCase).
 * @param {object} row
 * @returns {object|null}
 */
export const mapUserFromDB = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    password: row.password,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
};

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
 * @returns {Promise<object | null>}
 */
export const findUserByUsername = async (identifier) => {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`username.ilike.${clean},email.ilike.${clean}`)
    .maybeSingle();

  if (error || !data) return null;
  return mapUserFromDB(data);
};

/**
 * Busca un usuario por ID numérico.
 * @param {number} id
 * @returns {Promise<object | null>}
 */
export const findUserById = async (id) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', Number(id))
    .maybeSingle();

  if (error || !data) return null;
  return mapUserFromDB(data);
};

/**
 * Retorna todos los usuarios en formato seguro.
 * @returns {Promise<Array<object>>}
 */
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('id', { ascending: true });

  if (error || !data) return [];
  return data.map(mapUserFromDB).map(toPublicUser);
};

/**
 * Crea un nuevo usuario en la base de datos Supabase.
 * @param {object} data
 * @returns {Promise<object>} Usuario público creado
 */
export const createUserInStore = async (data) => {
  const payload = {
    name: data.name.trim(),
    username: data.username.trim().toLowerCase(),
    email: `${data.username.trim().toLowerCase()}@eltio.com`,
    password: data.password, // Ya hasheada
    role: data.role,
    is_active: true,
  };

  const { data: inserted, error } = await supabase
    .from('users')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear usuario en base de datos: ${error.message}`);
  }

  return toPublicUser(mapUserFromDB(inserted));
};

/**
 * Actualiza la contraseña de un usuario.
 * @param {number} id
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const updateUserPasswordInStore = async (id, hashedPassword) => {
  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', Number(id));

  return !error;
};

/**
 * Cambia el estado de activación de un usuario.
 * @param {number} id
 * @param {boolean} isActive
 * @returns {Promise<object | null>}
 */
export const toggleUserStatusInStore = async (id, isActive) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive })
    .eq('id', Number(id))
    .select()
    .single();

  if (error || !data) return null;
  return toPublicUser(mapUserFromDB(data));
};
