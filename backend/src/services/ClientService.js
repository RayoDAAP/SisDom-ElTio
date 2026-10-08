/**
 * @module ClientService
 * @description Lógica de negocio para búsqueda y gestión de clientes y tarifas por colonia.
 */
import { findClientByPhone, saveOrUpdateClient } from '../models/Client.js';
import { getShippingFeeByColonia, saveColoniaShippingFee } from '../models/ColoniaShipping.js';

export const searchClientByPhone = async (phone) => {
  return await findClientByPhone(phone);
};

export const fetchShippingFee = async (colonia) => {
  const fee = await getShippingFeeByColonia(colonia);
  return { colonia, fee };
};

export const registerClientAndColonia = async (clientData, shippingFee) => {
  if (clientData && clientData.phone) {
    await saveOrUpdateClient(clientData);
  }
  if (clientData && clientData.colonia && shippingFee !== undefined) {
    await saveColoniaShippingFee(clientData.colonia, shippingFee);
  }
};
