/**
 * @module Client
 * @description Modelo y almacén en Supabase para clientes y empresas indexados por teléfono,
 *              incluyendo geolocalización permanente y verificación de dirección.
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
    municipio: row.municipio || 'San Nicolás de los Garza',
    crossStreets: row.cross_streets || '',
    deliveryReferences: row.delivery_references || '',
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : null,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : null,
    isVerified: Boolean(row.is_verified),
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
 * Registra o actualiza la información completa de un cliente por su número de teléfono.
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
    municipio: clientData.municipio || 'San Nicolás de los Garza',
    cross_streets: clientData.crossStreets || '',
    delivery_references: clientData.deliveryReferences || clientData.notes || '',
    lat: clientData.lat !== undefined && clientData.lat !== null ? Number(clientData.lat) : null,
    lng: clientData.lng !== undefined && clientData.lng !== null ? Number(clientData.lng) : null,
    is_verified: Boolean(clientData.isVerified),
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
