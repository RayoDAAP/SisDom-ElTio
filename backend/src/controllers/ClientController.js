/**
 * @module ClientController
 * @description Controlador HTTP para endpoints de cliente, tarifas por colonia y geocodificación.
 */
import * as ClientService from '../services/ClientService.js';
import { cleanCalle, cleanColonia } from '../services/GeocodingService.js';
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
    console.error('[ClientController.searchClient] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
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
    console.error('[ClientController.getColoniaShipping] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * GET /api/clients/geocode?street=...&number=...&colonia=...&municipio=...&crossStreets=...
 * Obtiene las coordenadas geográficas de una dirección en el área metropolitana de Monterrey.
 */
export const geocodeAddress = async (req, res) => {
  try {
    const { street, number, colonia, municipio, crossStreets } = req.query;

    const fields = { street, number, colonia, municipio, crossStreets };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        if (typeof value !== 'string' || value.length > 120) {
          return sendError(res, 400, `El campo ${key} debe ser una cadena de texto de máximo 120 caracteres`);
        }
      }
    }

    const cStreet = cleanCalle(street);
    const cColonia = cleanColonia(colonia);
    const hasStreet = Boolean(cStreet && !/^(?:s\/c|sin calle)$/i.test(cStreet));
    const hasColonia = Boolean(cColonia);

    if (!hasStreet && !hasColonia) {
      return sendError(res, 400, 'Ingresa al menos la calle o la colonia');
    }

    const coords = await ClientService.geocodeClientAddress({
      street,
      number,
      colonia,
      municipio: municipio || 'San Nicolás de los Garza',
      crossStreets,
    });
    return sendSuccess(res, 200, 'Coordenadas geocodificadas con éxito', coords);
  } catch (error) {
    console.error('[ClientController.geocodeAddress] Error:', error.message);
    return sendError(res, 500, 'No se pudo geocodificar la dirección');
  }
};
