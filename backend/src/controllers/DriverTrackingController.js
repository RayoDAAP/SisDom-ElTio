/**
 * @module DriverTrackingController
 * @description Endpoints para transmisión y consulta de GPS de repartidores,
 *              así como flujo de solicitud y aprobación de apagado de ubicación.
 */
import {
  updateDriverLocation,
  requestDisableTracking,
  resolveTrackingRequest,
  enableTracking,
  getDriverStatus,
  getAllDriverLocations,
} from '../models/DriverTracking.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * POST /api/tracking/location
 * Envía la posición GPS actual del repartidor desde el móvil.
 */
export const reportLocation = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { lat, lng, speed, heading } = req.body;

    if (lat === undefined || lng === undefined) {
      return sendError(res, 400, 'Coordenadas lat y lng son obligatorias');
    }

    const currentStatus = getDriverStatus(driverId);
    if (currentStatus.isTrackingEnabled === false) {
      return sendSuccess(res, 200, 'Ubicación apagada por aprobación', {
        isTrackingEnabled: false,
        requestPending: null,
      });
    }

    const updated = updateDriverLocation(driverId, { lat, lng, speed, heading });
    return sendSuccess(res, 200, 'Ubicación actualizada', updated);
  } catch (error) {
    console.error('[DriverTracking.reportLocation] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * GET /api/tracking/status
 * Consulta el estado actual de tracking del repartidor autenticado.
 */
export const getMyStatus = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const status = getDriverStatus(driverId);
    return sendSuccess(res, 200, 'Estado de rastreo obtenido', status);
  } catch (error) {
    console.error('[DriverTracking.getMyStatus] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * POST /api/tracking/request-off
 * El repartidor solicita apagar su ubicación GPS (requiere visto bueno del admin).
 */
export const requestTurnOff = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { reason } = req.body;
    const updated = requestDisableTracking(driverId, reason);
    return sendSuccess(res, 200, 'Solicitud de apagado enviada al administrador', updated);
  } catch (error) {
    console.error('[DriverTracking.requestTurnOff] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * POST /api/tracking/turn-on
 * El repartidor reactiva su ubicación GPS directamente.
 */
export const turnOnTracking = async (req, res) => {
  try {
    const driverId = req.user?.id;
    const updated = enableTracking(driverId);
    return sendSuccess(res, 200, 'Ubicación encendida correctamente', updated);
  } catch (error) {
    console.error('[DriverTracking.turnOnTracking] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * GET /api/tracking/drivers (Solo Admin)
 * Retorna la lista con las últimas ubicaciones y solicitudes pendientes de todos los choferes.
 */
export const listAllDriverTracking = async (req, res) => {
  try {
    const locations = getAllDriverLocations();
    return sendSuccess(res, 200, 'Ubicaciones de repartidores obtenidas', { locations });
  } catch (error) {
    console.error('[DriverTracking.listAllDriverTracking] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};

/**
 * POST /api/tracking/drivers/:id/approve-off (Solo Admin)
 * El administrador aprueba o rechaza la solicitud de apagado de ubicación.
 */
export const handleApproveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body; // boolean
    const updated = resolveTrackingRequest(id, approved !== false);
    return sendSuccess(
      res,
      200,
      approved !== false ? 'Solicitud de apagado aprobada' : 'Solicitud rechazada',
      updated
    );
  } catch (error) {
    console.error('[DriverTracking.handleApproveRequest] Error:', error);
    return sendError(res, 500, 'Error interno del servidor');
  }
};
