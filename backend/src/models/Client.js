/**
 * @module Client
 * @description Modelo y almacén en Supabase para clientes y empresas indexados por teléfono.
 */
import { supabase } from '../config/supabase.js';

export const mapClientFromDB = (row) => {
  if (!row) return null;
  return {
    phone: row.phone,
    name: row.name,
    type: row.type,
    companyName: row.company_name || '',
    street: row.street || '',
    number: row.number || '',
    colonia: row.colonia || '',
  };
};

/**
 * Busca un cliente en Supabase por su número de teléfono.
 * @param {string} phone
 * @returns {Promise<Object|null>}
 */
export const findClientByPhone = async (phone) => {
  if (!phone) return null;
  const cleanedPhone = phone.trim();

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('phone', cleanedPhone)
    .maybeSingle();

  if (error || !data) return null;
  return mapClientFromDB(data);
};

/**
 * Registra o actualiza la información de un cliente por su número de teléfono.
 * @param {Object} clientData
 * @returns {Promise<Object|null>}
 */
export const saveOrUpdateClient = async (clientData) => {
  if (!clientData || !clientData.phone) return null;
  const payload = {
    phone: clientData.phone.trim(),
    name: clientData.name || '',
    type: clientData.type || 'particular',
    company_name: clientData.companyName || '',
    street: clientData.street || '',
    number: clientData.number || '',
    colonia: clientData.colonia || '',
  };

  const { data, error } = await supabase
    .from('clients')
    .upsert(payload, { onConflict: 'phone' })
    .select()
    .single();

  if (error) {
    console.error('Error guardando cliente en Supabase:', error.message);
    return null;
  }
  return mapClientFromDB(data);
};
