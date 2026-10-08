/**
 * @module Order
 * @description Modelo de Pedidos conectado a Supabase para Tacos El Tío.
 *              Guarda información del cliente, desgloses de Barbacoa, Menudo, Extras y Totales.
 */
import { supabase } from '../config/supabase.js';

export const ORDER_STATUS = {
  MISSING_ITEMS: 'incompleto', // Máxima prioridad por reporte de faltante
  READY: 'listo',
  ASSIGNED: 'asignado', // Asignado a repartidor
  ON_THE_WAY: 'en_camino',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
};

/**
 * Mapea una fila de Supabase a formato camelCase de la aplicación.
 * @param {object} row
 * @returns {object|null}
 */
export const mapOrderFromDB = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    createdBy: row.created_by || '',
    client: row.client || {},
    items: row.items || {},
    pricing: row.pricing || {},
    payment: row.payment || {},
    notes: row.notes || '',
    assignedTo: row.assigned_to,
    assignedToName: row.assigned_to_name || '',
    assignedAt: row.assigned_at,
    missingReport: row.missing_report || null,
  };
};

/**
 * Genera el siguiente ID secuencial para pedidos (PED-1001, etc.).
 * @returns {Promise<string>}
 */
export const generateNextOrderId = async () => {
  const { data } = await supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return 'PED-1001';
  }
  const lastId = data[0].id;
  const match = lastId.match(/PED-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PED-${nextNum}`;
  }
  return `PED-${Date.now().toString().slice(-4)}`;
};
