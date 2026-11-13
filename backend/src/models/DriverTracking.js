/**
 * @module DriverTrackingStore
 * @description Gestión de ubicaciones en vivo y solicitudes de apagado de GPS de repartidores.
 *              Guarda en memoria las coordenadas más recientes de cada chofer recibidas desde su teléfono.
 */

// id -> { lat, lng, speed, heading, updatedAt, isTrackingEnabled, requestPending: { requestedAt, reason } | null }
const driverLocations = new Map();

export const updateDriverLocation = (driverId, { lat, lng, speed = null, heading = null }) => {
  const existing = driverLocations.get(Number(driverId)) || {
    isTrackingEnabled: true,
    requestPending: null,
  };

  const updated = {
    ...existing,
    driverId: Number(driverId),
    lat: Number(lat),
    lng: Number(lng),
    speed,
    heading,
    updatedAt: new Date().toISOString(),
  };

  driverLocations.set(Number(driverId), updated);
  return updated;
};

export const requestDisableTracking = (driverId, reason = '') => {
  const existing = driverLocations.get(Number(driverId)) || {
    driverId: Number(driverId),
    isTrackingEnabled: true,
  };

  existing.requestPending = {
    requestedAt: new Date().toISOString(),
    reason: reason.trim() || 'Fin de turno o descanso',
  };

  driverLocations.set(Number(driverId), existing);
  return existing;
};

export const resolveTrackingRequest = (driverId, approved = true) => {
  const existing = driverLocations.get(Number(driverId));
  if (!existing) return null;

  if (approved) {
    existing.isTrackingEnabled = false;
    existing.requestPending = null;
  } else {
    // Si se rechaza, sigue encendido y se limpia la solicitud
    existing.requestPending = null;
  }

  driverLocations.set(Number(driverId), existing);
  return existing;
};

export const enableTracking = (driverId) => {
  const existing = driverLocations.get(Number(driverId)) || { driverId: Number(driverId) };
  existing.isTrackingEnabled = true;
  existing.requestPending = null;
  driverLocations.set(Number(driverId), existing);
  return existing;
};

export const getDriverStatus = (driverId) => {
  return driverLocations.get(Number(driverId)) || {
    driverId: Number(driverId),
    isTrackingEnabled: true,
    requestPending: null,
  };
};

export const getAllDriverLocations = () => {
  return Array.from(driverLocations.values());
};
