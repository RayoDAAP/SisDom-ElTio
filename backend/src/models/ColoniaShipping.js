/**
 * @module ColoniaShipping
 * @description Modelo y catálogo de tarifas de envío fijas por colonia.
 */

export const coloniaShippingStore = {
  'centro': 40,
  'complejo industrial': 50,
  'santa rosa': 35,
};

/**
 * Obtiene la tarifa de envío asociada a una colonia.
 * @param {string} coloniaName
 * @returns {number|null} Tarifa en pesos o null si no existe
 */
export const getShippingFeeByColonia = (coloniaName) => {
  if (!coloniaName) return null;
  const key = coloniaName.trim().toLowerCase();
  return coloniaShippingStore[key] ?? null;
};

/**
 * Registra o mantiene la tarifa de envío para una colonia.
 * Si la colonia ya tiene una tarifa guardada, NO se sobrescribe.
 * @param {string} coloniaName
 * @param {number} fee
 */
export const saveColoniaShippingFee = (coloniaName, fee) => {
  if (!coloniaName || fee === undefined || fee === null) return;
  const key = coloniaName.trim().toLowerCase();
  
  if (coloniaShippingStore[key] === undefined) {
    coloniaShippingStore[key] = Number(fee) || 0;
  }
};
