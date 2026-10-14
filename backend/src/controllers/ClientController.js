/**
 * @module ClientController
 * @description Controlador HTTP para endpoints de cliente, tarifas por colonia y geocodificación.
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

/**
 * GET /api/clients/geocode?street=...&number=...&colonia=...&municipio=...&crossStreets=...
 * Obtiene las coordenadas geográficas de una dirección en el área metropolitana de Monterrey.
 */
export const geocodeAddress = async (req, res) => {
  try {
    const { street, number, colonia, municipio, crossStreets } = req.query;
    const coords = await ClientService.geocodeClientAddress({
      street,
      number,
      colonia,
      municipio: municipio || 'San Nicolás de los Garza',
      crossStreets,
    });
    return sendSuccess(res, 200, 'Coordenadas geocodificadas con éxito', coords);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};
