/**
 * @module ColoniaShipping
 * @description Modelo y catálogo de tarifas de envío fijas por colonia en Supabase.
 */
import { supabase } from '../config/supabase.js';

/**
 * Obtiene la tarifa de envío asociada a una colonia.
 * @param {string} coloniaName
 * @returns {Promise<number|null>} Tarifa en pesos o null si no existe
 */
export const getShippingFeeByColonia = async (coloniaName) => {
  if (!coloniaName) return null;
  const key = coloniaName.trim().toLowerCase();

  const { data, error } = await supabase
    .from('colonia_shipping')
    .select('fee')
    .eq('colonia', key)
    .maybeSingle();

  if (error || !data) return null;
  return Number(data.fee);
};

/**
 * Registra o mantiene la tarifa de envío para una colonia.
 * Si la colonia ya tiene una tarifa guardada, NO se sobrescribe.
 * @param {string} coloniaName
 * @param {number} fee
 * @returns {Promise<void>}
 */
export const saveColoniaShippingFee = async (coloniaName, fee) => {
  if (!coloniaName || fee === undefined || fee === null) return;
  const key = coloniaName.trim().toLowerCase();

  // Verificar si ya existe
  const existing = await getShippingFeeByColonia(key);
  if (existing !== null) return;

  await supabase.from('colonia_shipping').insert({
    colonia: key,
    fee: Number(fee) || 0,
  });
};
