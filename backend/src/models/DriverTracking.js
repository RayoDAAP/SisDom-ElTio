/**
 * @module DriverTrackingStore
 * @description Gestión de ubicaciones en vivo y solicitudes de apagado de GPS de repartidores.
 *              Guarda en memoria las coordenadas más recientes de cada chofer recibidas desde su teléfono.
 *              En entorno local, sincroniza automáticamente con el backend en la nube (Render)
 *              para que los datos transmitidos desde el celular físico se reflejen de inmediato en local.
 */

// id -> { lat, lng, speed, heading, updatedAt, isTrackingEnabled, requestPending: { requestedAt, reason } | null }
const driverLocations = new Map();

const REMOTE_API = 'https://backend-eltio.onrender.com/api';
const isDev = process.env.NODE_ENV !== 'production';

let cachedToken = null;
const getCloudToken = async () => {
  if (cachedToken) return cachedToken;
  try {
    const res = await fetch(`${REMOTE_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin2', password: 'admin12345' }),
    });
    const data = await res.json();
    if (data.data?.token) {
      cachedToken = data.data.token;
      return cachedToken;
    }
  } catch {
    // Silencioso si falla la conexión
  }
  return null;
};

/**
 * Sincroniza ubicaciones y solicitudes pendientes con la nube (Render) en desarrollo local.
 */
export const syncWithCloud = async () => {
  if (!isDev) return;
  try {
    const token = await getCloudToken();
    if (!token) return;
    const res = await fetch(`${REMOTE_API}/tracking/drivers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const cloudLocations = data?.data?.locations || [];

    cloudLocations.forEach((cloudLoc) => {
      const id = Number(cloudLoc.driverId);
      const local = driverLocations.get(id);
      if (!local) {
        driverLocations.set(id, { ...cloudLoc, driverId: id });
      } else {
        // Si la nube tiene solicitud pendiente y local no, actualizar
        if (cloudLoc.requestPending && !local.requestPending) {
          local.requestPending = cloudLoc.requestPending;
        } else if (!cloudLoc.requestPending && local.requestPending) {
          // Si en la nube ya se resolvió, limpiar en local
          local.requestPending = null;
        }

        if (cloudLoc.isTrackingEnabled !== undefined) {
          local.isTrackingEnabled = cloudLoc.isTrackingEnabled;
        }

        // Si las coordenadas de la nube son más recientes
        if (new Date(cloudLoc.updatedAt) > new Date(local.updatedAt || 0)) {
          local.lat = cloudLoc.lat;
          local.lng = cloudLoc.lng;
          local.speed = cloudLoc.speed;
          local.heading = cloudLoc.heading;
          local.updatedAt = cloudLoc.updatedAt;
        }
        driverLocations.set(id, local);
      }
    });
  } catch {
    // Silencioso en caso de falla momentánea de red
  }
};

// En desarrollo sincronizar automáticamente cada 3.5 segundos con la nube
if (isDev) {
  syncWithCloud();
  setInterval(syncWithCloud, 3500);
}

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

export const resolveTrackingRequest = async (driverId, approved = true) => {
  const existing = driverLocations.get(Number(driverId));
  if (existing) {
    if (approved) {
      existing.isTrackingEnabled = false;
      existing.requestPending = null;
    } else {
      existing.requestPending = null;
    }
    driverLocations.set(Number(driverId), existing);
  }

  // Reenviar resolución al backend en la nube para que el celular del chofer lo reciba
  if (isDev) {
    try {
      const token = await getCloudToken();
      if (token) {
        await fetch(`${REMOTE_API}/tracking/drivers/${driverId}/approve-off`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approved }),
        });
      }
    } catch {
      // Silencioso
    }
  }

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

export const getAllDriverLocations = async () => {
  if (isDev) {
    await syncWithCloud();
  }
  return Array.from(driverLocations.values());
};
