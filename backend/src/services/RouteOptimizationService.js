/**
 * @module RouteOptimizationService
 * @description Algoritmo de optimización de rutas de entrega para repartidores.
 *              Calcula la secuencia más eficiente partiendo de la sucursal de Tacos El Tío
 *              (San Nicolás de los Garza), considerando distancias geográficas,
 *              antigüedad/folio del pedido (FIFO) y prioridad extrema de faltantes urgentes.
 */
import env from '../config/env.js';

/**
 * Calcula la distancia en kilómetros entre dos coordenadas usando la fórmula de Haversine.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distancia en kilómetros
 */
export const calculateHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // 2 decimales
};

/**
 * Optimiza la secuencia de entrega para un conjunto de pedidos asignados.
 *
 * Criterio de costo ponderado:
 * Costo = Distancia (km) - BonoPorAntigüedad (km equiv.) - BonoFaltanteUrgente (km equiv.)
 *
 * @param {Array<object>} orders - Pedidos asignados al repartidor
 * @returns {object} Ruta calculada con paradas ordenadas y métricas
 */
export const optimizeDeliveryRoute = (orders = []) => {
  const origin = {
    name: env.BRANCH_LOCATION.name,
    lat: env.BRANCH_LOCATION.lat,
    lng: env.BRANCH_LOCATION.lng,
    address: env.BRANCH_LOCATION.address,
    municipio: env.BRANCH_LOCATION.municipio,
  };

  if (!orders || orders.length === 0) {
    return {
      origin,
      stops: [],
      totalOrders: 0,
      totalDistanceKm: 0,
      totalEstimatedDurationMins: 0,
      googleMapsUrl: '',
      generatedAt: new Date().toISOString(),
    };
  }

  const now = Date.now();

  // Preparar lista de nodos pendientes por visitar
  const unvisited = orders.map((order) => {
    const client = order.client || {};
    // Asegurar coordenadas (si no tiene, usar fallback de la sucursal)
    const lat = client.lat || order.lat || origin.lat;
    const lng = client.lng || order.lng || origin.lng;

    // Calcular minutos transcurridos desde que se creó el pedido
    const createdAtMs = order.createdAt ? new Date(order.createdAt).getTime() : now;
    const waitMinutes = Math.max(0, Math.floor((now - createdAtMs) / 60000));

    const isUrgent = order.status === 'incompleto';

    return {
      order,
      orderId: order.id,
      clientName: client.name || 'Cliente',
      phone: client.phone || '',
      address: `Calle ${client.street || ''} #${client.number || ''}, Col. ${client.colonia || ''}`,
      municipio: client.municipio || 'San Nicolás de los Garza',
      crossStreets: client.crossStreets || '',
      deliveryReferences: client.deliveryReferences || client.notes || order.notes || '',
      lat,
      lng,
      isVerified: Boolean(client.isVerified),
      status: order.status,
      isUrgent,
      waitMinutes,
      itemsSummary: order.items || {},
      total: order.pricing?.total || 0,
      paymentMethod: order.payment?.method || 'efectivo',
    };
  });

  // Algoritmo de Vecino Más Cercano Ponderado (Weighted Nearest Neighbor)
  // Empezando desde la sucursal
  const stops = [];
  let currentLat = origin.lat;
  let currentLng = origin.lng;
  let cumulativeDistanceKm = 0;
  let cumulativeDurationMins = 0;

  const AVERAGE_SPEED_KMH = 26; // Velocidad promedio de reparto urbano en San Nicolás/Mty
  const STOP_HANDOVER_MINS = 4; // Minutos promedio de entrega en domicilio

  while (unvisited.length > 0) {
    let bestIndex = 0;
    let minCost = Infinity;
    let bestDistance = 0;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const distance = calculateHaversineDistanceKm(
        currentLat,
        currentLng,
        candidate.lat,
        candidate.lng
      );

      // Penalización / Bono por antigüedad: cada 10 min esperando reduce el costo virtual en 1.5 km
      const ageBonusKm = (candidate.waitMinutes / 10) * 1.5;

      // Bono extremo si es faltante urgente: -100 km virtuales para garantizar que sea la próxima parada
      const urgencyBonusKm = candidate.isUrgent ? 100 : 0;

      const weightedCost = distance - ageBonusKm - urgencyBonusKm;

      if (weightedCost < minCost) {
        minCost = weightedCost;
        bestIndex = i;
        bestDistance = distance;
      }
    }

    const nextStop = unvisited.splice(bestIndex, 1)[0];

    // Estimar tiempo de traslado para este tramo en minutos
    const legDurationMins = Math.max(
      2,
      Math.round((bestDistance / AVERAGE_SPEED_KMH) * 60)
    );

    cumulativeDistanceKm += bestDistance;
    cumulativeDurationMins += legDurationMins + STOP_HANDOVER_MINS;

    // URL individual de navegación directa a esta parada (Google Maps)
    const singleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${nextStop.lat},${nextStop.lng}`;

    const stopIndex = stops.length;
    const routeStatus = stopIndex === 0 ? 'En curso' : stopIndex === 1 ? 'Siguiente' : null;

    stops.push({
      stopNumber: stopIndex + 1,
      ...nextStop,
      routeStatus,
      distanceFromPrevKm: bestDistance,
      cumulativeDistanceKm: Math.round(cumulativeDistanceKm * 10) / 10,
      estimatedLegDurationMins: legDurationMins,
      estimatedArrivalMinsFromNow: cumulativeDurationMins,
      navigationUrl: singleNavUrl,
    });

    currentLat = nextStop.lat;
    currentLng = nextStop.lng;
  }

  // Tramo de regreso a la sucursal (D-r1-r2...-D)
  let returnDistanceKm = 0;
  let returnDurationMins = 0;
  if (stops.length > 0) {
    const lastStop = stops[stops.length - 1];
    returnDistanceKm = calculateHaversineDistanceKm(lastStop.lat, lastStop.lng, origin.lat, origin.lng);
    returnDurationMins = Math.max(2, Math.round((returnDistanceKm / AVERAGE_SPEED_KMH) * 60));
  }

  const grandTotalDistanceKm = Math.round((cumulativeDistanceKm + returnDistanceKm) * 10) / 10;
  const grandTotalDurationMins = cumulativeDurationMins + returnDurationMins;

  // Generar URL universal de Google Maps con circuito cerrado: sale de la sucursal, visita paradas y regresa a la sucursal
  let googleMapsUrl = '';
  if (stops.length === 1) {
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${origin.lat},${origin.lng}&waypoints=${stops[0].lat},${stops[0].lng}`;
  } else if (stops.length > 1) {
    const waypoints = stops.map((s) => `${s.lat},${s.lng}`).join('|');
    googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${origin.lat},${origin.lng}&waypoints=${encodeURIComponent(
      waypoints
    )}`;
  }

  return {
    origin,
    stops,
    totalOrders: stops.length,
    deliveriesDistanceKm: Math.round(cumulativeDistanceKm * 10) / 10,
    returnDistanceKm: Math.round(returnDistanceKm * 10) / 10,
    totalDistanceKm: grandTotalDistanceKm,
    totalEstimatedDurationMins: grandTotalDurationMins,
    googleMapsUrl,
    generatedAt: new Date().toISOString(),
  };
};
