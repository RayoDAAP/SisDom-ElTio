/**
 * @module ClientController
 * @description Controlador HTTP para endpoints de cliente y tarifas por colonia.
 */
import * as ClientService from '../services/ClientService.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * GET /api/clients/search?phone=...
 */
export const searchClient = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return sendError(res, 400, 'El parámetro phone es requerido');
    }
    const client = await ClientService.searchClientByPhone(phone);
    return sendSuccess(res, 200, 'Resultado de búsqueda de cliente', { client });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * GET /api/colonias/shipping?colonia=...
 */
export const getColoniaShipping = async (req, res) => {
  try {
    const { colonia } = req.query;
    if (!colonia) {
      return sendError(res, 400, 'El parámetro colonia es requerido');
    }
    const data = await ClientService.fetchShippingFee(colonia);
    return sendSuccess(res, 200, 'Tarifa de colonia obtenida', data);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
