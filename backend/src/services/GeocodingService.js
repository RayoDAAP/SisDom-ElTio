/**
 * @module GeocodingService
 * @description Servicio de geolocalización y geocodificación para el Área Metropolitana de Monterrey,
 *              con centro de operaciones en San Nicolás de los Garza, Nuevo León.
 *              Incluye consulta a OpenStreetMap Nominatim y catálogo de contingencia (fallback).
 */
import env from '../config/env.js';

/** Coordenadas centrales por municipio del Área Metropolitana de Monterrey */
export const MUNICIPIOS_COORDINATES = {
  'san nicolas de los garza': { lat: 25.7485, lng: -100.2885 },
  'san nicolas': { lat: 25.7485, lng: -100.2885 },
  'monterrey': { lat: 25.6866, lng: -100.3161 },
  'guadalupe': { lat: 25.6768, lng: -100.2565 },
  'apodaca': { lat: 25.7813, lng: -100.1887 },
  'general escobedo': { lat: 25.7958, lng: -100.3228 },
  'escobedo': { lat: 25.7958, lng: -100.3228 },
  'santa catarina': { lat: 25.6747, lng: -100.4628 },
  'san pedro garza garcia': { lat: 25.6572, lng: -100.4026 },
  'san pedro': { lat: 25.6572, lng: -100.4026 },
  'juarez': { lat: 25.6475, lng: -100.0963 },
  'garcia': { lat: 25.8164, lng: -100.5947 },
  'cadereyta jimenez': { lat: 25.5878, lng: -99.9936 },
  'cadereyta': { lat: 25.5878, lng: -99.9936 },
  'santiago': { lat: 25.4277, lng: -100.1508 },
};

/** Catálogo de colonias frecuentes en San Nicolás y alrededores con coordenadas de referencia */
export const COLONIAS_COORDINATES = {
  'centro': { lat: 25.7485, lng: -100.2885 },
  'anahuac': { lat: 25.7360, lng: -100.3150 },
  'las puentes': { lat: 25.7430, lng: -100.2650 },
  'cuauhtemoc': { lat: 25.7250, lng: -100.3000 },
  'fidel velazquez': { lat: 25.7220, lng: -100.3350 },
  'constituyentes de queretaro': { lat: 25.7280, lng: -100.2450 },
  'la fe': { lat: 25.7280, lng: -100.2250 },
  'industrias del vidrio': { lat: 25.7180, lng: -100.2480 },
  'hacienda los morales': { lat: 25.7190, lng: -100.2300 },
  'valle del mezquital': { lat: 25.7600, lng: -100.2500 },
  'san nicolas centro': { lat: 25.7485, lng: -100.2885 },
  'la talaverna': { lat: 25.7210, lng: -100.2320 },
  'cumbres': { lat: 25.7120, lng: -100.3750 },
  'mitras centro': { lat: 25.6960, lng: -100.3450 },
  'lindavista': { lat: 25.6980, lng: -100.2450 },
};

/**
 * Normaliza nombres para búsqueda en catálogos.
 * @param {string} text
 * @returns {string}
 */
const cleanText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Consulta las coordenadas de una dirección utilizando OpenStreetMap Nominatim.
 * Si falla o no encuentra resultados, recurre al catálogo local de contingencia.
 *
 * @param {object} addressData
 * @param {string} addressData.street - Calle
 * @param {string} addressData.number - Número exterior
 * @param {string} addressData.colonia - Colonia
 * @param {string} addressData.municipio - Municipio (default: San Nicolás de los Garza)
 * @param {string} [addressData.crossStreets] - Entre calles
 * @returns {Promise<{ lat: number, lng: number, displayName: string, isApproximate: boolean }>}
 */
export const geocodeAddress = async ({
  street = '',
  number = '',
  colonia = '',
  municipio = 'San Nicolás de los Garza',
  crossStreets = '',
}) => {
  const cleanMun = cleanText(municipio) || 'san nicolas de los garza';
  const cleanCol = cleanText(colonia);
  const cleanStr = cleanText(street);

  // 1. Intentar geocodificar vía OpenStreetMap Nominatim
  try {
    const fullQueryParts = [];
    if (street) fullQueryParts.push(`${street} ${number}`.trim());
    if (colonia) fullQueryParts.push(`Colonia ${colonia}`);
    if (municipio) fullQueryParts.push(municipio);
    fullQueryParts.push('Nuevo León', 'México');

    const query = fullQueryParts.join(', ');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&countrycodes=mx&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TacosElTio-DeliveryApp/1.0 (contacto@eltio.com)',
      },
    });

    if (response.ok) {
      const results = await response.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        // Validar que esté dentro de los límites razonables de Nuevo León
        if (lat >= 24.5 && lat <= 27.5 && lng >= -101.5 && lng <= -99.0) {
          return {
            lat,
            lng,
            displayName: item.display_name,
            isApproximate: false,
          };
        }
      }
    }
  } catch (err) {
    console.warn('[GeocodingService] Error al consultar Nominatim:', err.message);
  }

  // 2. Fallback inteligente usando catálogo local de colonias o municipios de NL
  let fallbackCoords = null;
  let label = '';

  if (cleanCol && COLONIAS_COORDINATES[cleanCol]) {
    fallbackCoords = COLONIAS_COORDINATES[cleanCol];
    label = `${colonia}, ${municipio}, N.L. (Aproximada por Colonia)`;
  } else if (cleanMun && MUNICIPIOS_COORDINATES[cleanMun]) {
    fallbackCoords = MUNICIPIOS_COORDINATES[cleanMun];
    label = `${municipio}, N.L. (Aproximada por Municipio)`;
  } else {
    // Si nada coincide, usar la sucursal de Tacos El Tío
    fallbackCoords = {
      lat: env.BRANCH_LOCATION.lat,
      lng: env.BRANCH_LOCATION.lng,
    };
    label = `${env.BRANCH_LOCATION.name} (Referencia inicial)`;
  }

  // Generar un pequeño desplazamiento pseudo-aleatorio determinista basado en el número de calle
  // para que dos casas de la misma colonia no queden encimadas en el mapa
  let offsetLat = 0;
  let offsetLng = 0;
  if (number) {
    const num = parseInt(number.replace(/\D/g, ''), 10) || 100;
    offsetLat = ((num % 20) - 10) * 0.00015;
    offsetLng = (((num * 3) % 20) - 10) * 0.00015;
  }

  return {
    lat: fallbackCoords.lat + offsetLat,
    lng: fallbackCoords.lng + offsetLng,
    displayName: label,
    isApproximate: true,
  };
};
