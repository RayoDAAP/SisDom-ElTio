/**
 * @module ClientService
 * @description Lógica de negocio para búsqueda y gestión de clientes y tarifas por colonia.
 */
import { findClientByPhone, saveOrUpdateClient } from '../models/Client.js';
import { getShippingFeeByColonia, saveColoniaShippingFee } from '../models/ColoniaShipping.js';

export const searchClientByPhone = (phone) => {
  return findClientByPhone(phone);
};

export const fetchShippingFee = (colonia) => {
  const fee = getShippingFeeByColonia(colonia);
  return { colonia, fee };
};

export const registerClientAndColonia = (clientData, shippingFee) => {
  if (clientData && clientData.phone) {
    saveOrUpdateClient(clientData);
  }
  if (clientData && clientData.colonia && shippingFee !== undefined) {
    saveColoniaShippingFee(clientData.colonia, shippingFee);
  }
};
