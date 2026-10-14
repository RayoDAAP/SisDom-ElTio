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
 * Limpia y normaliza prefijos comunes de calle/colonia/número (idéntico a INE Scanner).
 * @param {string} str
 * @returns {string}
 */
const cleanPrefixes = (str) => {
  if (!str) return '';
  return str
    .replace(/^COL\.?\s*|^COLONIA\s+/i, '')
    .replace(/^C\.?\s*|^CALLE\s+/i, '')
    .replace(/^NO\.?\s*|^NUM\.?\s*|^#\s*/i, '')
    .replace(/interior.*$/i, '')
    .replace(/int.*$/i, '')
    .trim();
};

/**
 * Normaliza nombres para búsqueda en catálogos locales.
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

let lastRequestTime = 0;

/**
 * Consulta directa a Nominatim con limit 1, control de frecuencia y reintentos ante rate-limit.
 * @param {string} query
 * @returns {Promise<{ lat: number, lng: number, displayName: string } | null>}
 */
const queryNominatim = async (query) => {
  try {
    // Respetar política de uso de Nominatim (mínimo 800ms entre consultas consecutivas)
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 800) {
      await new Promise((resolve) => setTimeout(resolve, 800 - elapsed));
    }
    lastRequestTime = Date.now();

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1&countrycodes=mx`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TacosElTio-DeliveryApp/1.0 (contacto@eltio.com)',
      },
    });

    if (response.status === 429) {
      // Si nos pide esperar, aguardar 1.2 segundos y reintentar 1 vez
      await new Promise((resolve) => setTimeout(resolve, 1200));
      lastRequestTime = Date.now();
      const retryRes = await fetch(url, {
        headers: { 'User-Agent': 'TacosElTio-DeliveryApp/1.0 (contacto@eltio.com)' },
      });
      if (!retryRes.ok) return null;
      const data = await retryRes.json();
      if (data && data.length > 0) {
        let lat = parseFloat(data[0].lat);
        let lon = parseFloat(data[0].lon);
        if (lon > 0) lon = -lon;
        if (lat >= 24.0 && lat <= 28.0 && lon >= -101.5 && lon <= -99.0) {
          return {
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lon.toFixed(6)),
            displayName: data[0].display_name,
          };
        }
      }
      return null;
    }

    if (!response.ok) return null;
    const data = await response.json();

    if (data && data.length > 0) {
      let lat = parseFloat(data[0].lat);
      let lon = parseFloat(data[0].lon);
      if (lon > 0) lon = -lon; // Asegurar signo negativo en longitud para México

      // Validar que esté dentro de límites de Nuevo León / México
      if (lat >= 24.0 && lat <= 28.0 && lon >= -101.5 && lon <= -99.0) {
        return {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lon.toFixed(6)),
          displayName: data[0].display_name,
        };
      }
    }
  } catch (err) {
    console.warn('[GeocodingService] Query error for:', query, err.message);
  }
  return null;
};

/**
 * Geocodifica una dirección con algoritmo de aproximación progresiva idéntico al de INE Scanner:
 * 1. Calle + Número + Colonia + Municipio + NL
 * 2. Calle + Número + Municipio + NL
 * 3. Calle + Municipio + NL
 * 4. Colonia + Municipio + NL
 * 5. Municipio + NL
 * 6. Fallback a catálogo local o sucursal
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
  const cCalle = cleanPrefixes(street);
  const cNumero = cleanPrefixes(number);
  const cColonia = cleanPrefixes(colonia);
  const mun = municipio?.trim() || 'San Nicolás de los Garza';

  // Intento 1: Dirección completa (Calle + Número + Colonia + Municipio + NL)
  if (cCalle && cColonia) {
    const q1 = `${cCalle} ${cNumero}, ${cColonia}, ${mun}, Nuevo León, México`.replace(/\s+,/g, ',').trim();
    const r1 = await queryNominatim(q1);
    if (r1) return { ...r1, isApproximate: false };
  }

  // Intento 2: Calle + Número + Municipio + NL
  if (cCalle && cNumero) {
    const q2 = `${cCalle} ${cNumero}, ${mun}, Nuevo León, México`.trim();
    const r2 = await queryNominatim(q2);
    if (r2) return { ...r2, isApproximate: false };
  }

  // Intento 3: Calle sola + Municipio + NL (idéntico a INE Scanner)
  if (cCalle) {
    const q3 = `${cCalle}, ${mun}, Nuevo León, México`.trim();
    const r3 = await queryNominatim(q3);
    if (r3) return { ...r3, isApproximate: false };
  }

  // Intento 4: Colonia + Municipio + NL
  if (cColonia) {
    const q4 = `${cColonia}, ${mun}, Nuevo León, México`.trim();
    const r4 = await queryNominatim(q4);
    if (r4) return { ...r4, isApproximate: true };
  }

  // Intento 5: Municipio + NL
  const q5 = `${mun}, Nuevo León, México`.trim();
  const r5 = await queryNominatim(q5);
  if (r5) return { ...r5, isApproximate: true };

  // Fallback a catálogos locales si no hay conexión externa
  const cleanCol = cleanText(colonia);
  const cleanMun = cleanText(municipio);

  if (cleanCol && COLONIAS_COORDINATES[cleanCol]) {
    const c = COLONIAS_COORDINATES[cleanCol];
    return {
      lat: c.lat,
      lng: c.lng,
      displayName: `${colonia}, ${mun}, N.L. (Catálogo Colonia)`,
      isApproximate: true,
    };
  }

  if (cleanMun && MUNICIPIOS_COORDINATES[cleanMun]) {
    const c = MUNICIPIOS_COORDINATES[cleanMun];
    return {
      lat: c.lat,
      lng: c.lng,
      displayName: `${mun}, N.L. (Centro Municipal)`,
      isApproximate: true,
    };
  }

  return {
    lat: env.BRANCH_LOCATION.lat,
    lng: env.BRANCH_LOCATION.lng,
    displayName: `${env.BRANCH_LOCATION.name} (Referencia Sucursal)`,
    isApproximate: true,
  };
};
