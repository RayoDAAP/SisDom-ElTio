/**
 * @module clientService
 * @description Servicio HTTP para búsqueda de clientes por teléfono, geocodificación y tarifas por colonia.
 */
import axios from 'axios';

let rawUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim().replace(/\/+$/, '');
if (!rawUrl.endsWith('/api')) {
  rawUrl += '/api';
}
const API_BASE_URL = rawUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Busca cliente registrado por teléfono.
 * @param {string} phone
 */
export const searchClientByPhoneRequest = async (phone) => {
  if (!phone) return null;
  const response = await api.get('/clients/search', { params: { phone } });
  return response.data.data.client;
};

/**
 * Obtiene la tarifa de envío guardada para una colonia.
 * @param {string} colonia
 */
export const fetchShippingFeeByColoniaRequest = async (colonia) => {
  if (!colonia) return null;
  const response = await api.get('/colonias/shipping', { params: { colonia } });
  return response.data.data.fee;
};

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

// Quita acentos y pasa a minúsculas para comparación normalizada
const normalize = (str) =>
  (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// Limites del área metropolitana de Monterrey
const MTY_BOUNDS = { latMin: 25.40, latMax: 25.95, lngMin: -100.65, lngMax: -99.95 };

const inBounds = (lat, lng) =>
  lat >= MTY_BOUNDS.latMin && lat <= MTY_BOUNDS.latMax &&
  lng >= MTY_BOUNDS.lngMin && lng <= MTY_BOUNDS.lngMax;

// Caché en memoria por URL para evitar peticiones duplicadas
const nominatimCache = new Map();

// Control de rate limit: máximo 1 petición por segundo
let lastNominatimCall = 0;
const waitForNominatimRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastNominatimCall = Date.now();
};

/**
 * Hace una petición a Nominatim con caché y rate-limit.
 * Soporta params estructurados o texto libre (q).
 */
const fetchNominatim = async (params) => {
  const base = 'https://nominatim.openstreetmap.org/search';
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es',
    countrycodes: 'mx',
    limit: '5',
    viewbox: '-100.65,25.95,-99.95,25.40',
    bounded: '1',
    ...params,
  });
  const url = `${base}?${searchParams.toString()}`;

  if (nominatimCache.has(url)) return nominatimCache.get(url);

  await waitForNominatimRateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TacosElTio-App/1.0 (internal-tool)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const result = Array.isArray(data) && data.length > 0 ? data : null;
    nominatimCache.set(url, result);
    return result;
  } catch {
    clearTimeout(timeout);
    return null;
  }
};

/**
 * Si la consulta acotada no da resultados, reintenta sin bounded.
 */
const fetchNominatimUnboundedFallback = async (params) => {
  const base = 'https://nominatim.openstreetmap.org/search';
  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es',
    countrycodes: 'mx',
    limit: '5',
    ...params,
  });
  const url = `${base}?${searchParams.toString()}`;

  if (nominatimCache.has(url)) return nominatimCache.get(url);

  await waitForNominatimRateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'TacosElTio-App/1.0 (internal-tool)' },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const result = Array.isArray(data) && data.length > 0 ? data : null;
    nominatimCache.set(url, result);
    return result;
  } catch {
    clearTimeout(timeout);
    return null;
  }
};

/**
 * Intenta una búsqueda (bounded primero, luego sin bounded).
 */
const tryNominatim = async (params) => {
  let results = await fetchNominatim(params);
  if (!results) {
    results = await fetchNominatimUnboundedFallback(params);
  }
  return results;
};

/**
 * Elige el mejor candidato de la lista de resultados de Nominatim.
 * Lógica de selección: house_number exacto > contiene colonia > primero en rango.
 */
const chooseBestCandidate = (candidates, targetNumber, targetColonia) => {
  if (!candidates || candidates.length === 0) return null;

  const normTarget = normalize(targetNumber);
  const normColonia = normalize(targetColonia);

  // Filtrar candidatos dentro del área metropolitana
  const inRange = candidates.filter((c) => {
    let lat = parseFloat(c.lat);
    let lon = parseFloat(c.lon);
    if (lon > 0) lon = -lon;
    return inBounds(lat, lon);
  });

  if (inRange.length === 0) return null;

  // Normalizar número pedido (quitar prefijos "No.", "#", espacios)
  const cleanNum = normTarget
    .replace(/^no\.?\s*/i, '')
    .replace(/^#\s*/i, '')
    .replace(/\s/g, '');

  // i) Casa exacta: house_number coincide
  if (cleanNum) {
    const exactMatch = inRange.find((c) => {
      const hn = normalize(c.address?.house_number || '')
        .replace(/\s/g, '');
      return hn === cleanNum;
    });
    if (exactMatch) return { candidate: exactMatch, precision: 'exact' };
  }

  // ii) Prefiere candidato cuyo display_name (normalizado) contenga la colonia
  if (normColonia) {
    const coloniaMatch = inRange.find((c) =>
      normalize(c.display_name).includes(normColonia)
    );
    if (coloniaMatch) {
      const isHighway = coloniaMatch.class === 'highway';
      return { candidate: coloniaMatch, precision: isHighway ? 'street' : 'street' };
    }
  }

  // iii) Primer resultado en rango
  const first = inRange[0];
  const isHighway = first.class === 'highway';
  return { candidate: first, precision: isHighway ? 'street' : 'street' };
};

/**
 * Geocodifica una dirección usando Nominatim con estrategia en cascada.
 * Retorna { lat, lng, displayName, isApproximate, precision }
 * precision: "exact" | "street" | "colonia" | "municipio"
 */
export const geocodeAddressRequest = async ({ street, number, colonia, municipio, crossStreets }) => {
  const cCalle = cleanPrefixes(street);
  const cNumero = cleanPrefixes(number);
  const cColonia = cleanPrefixes(colonia);
  const mun = municipio?.trim() || 'San Nicolas de los Garza';

  const buildResult = (candidate, precision) => {
    let lat = parseFloat(candidate.lat);
    let lon = parseFloat(candidate.lon);
    if (lon > 0) lon = -lon;
    return {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lon.toFixed(6)),
      displayName: candidate.display_name,
      precision,
      isApproximate: precision !== 'exact',
    };
  };

  // a) Búsqueda estructurada con número
  if (cCalle && cNumero) {
    const params = { street: `${cNumero} ${cCalle}`, city: mun, state: 'Nuevo León' };
    const results = await tryNominatim(params);
    const best = chooseBestCandidate(results, cNumero, cColonia);
    if (best) return buildResult(best.candidate, best.precision);
  }

  // b) Búsqueda estructurada solo con calle
  if (cCalle) {
    const params = { street: cCalle, city: mun, state: 'Nuevo León' };
    const results = await tryNominatim(params);
    const best = chooseBestCandidate(results, cNumero, cColonia);
    if (best) return buildResult(best.candidate, 'street');
  }

  // c) Texto libre: calle + colonia + municipio
  if (cCalle) {
    const q = `${cCalle}, ${cColonia ? cColonia + ', ' : ''}${mun}, Nuevo León, México`;
    const results = await tryNominatim({ q });
    const best = chooseBestCandidate(results, cNumero, cColonia);
    if (best) return buildResult(best.candidate, 'street');
  }

  // d) Texto libre: solo colonia + municipio (precision "colonia")
  if (cColonia) {
    const q = `${cColonia}, ${mun}, Nuevo León, México`;
    const results = await tryNominatim({ q });
    const best = chooseBestCandidate(results, '', cColonia);
    if (best) return buildResult(best.candidate, 'colonia');
  }

  // e) Texto libre: solo municipio (precision "municipio")
  if (mun) {
    const q = `${mun}, Nuevo León, México`;
    const results = await tryNominatim({ q });
    const best = chooseBestCandidate(results, '', '');
    if (best) return buildResult(best.candidate, 'municipio');
  }

  // f) Fallback al backend
  const response = await api.get('/clients/geocode', {
    params: { street, number, colonia, municipio, crossStreets },
  });
  const backendResult = response.data.data;
  if (backendResult) {
    return {
      ...backendResult,
      precision: backendResult.isApproximate ? 'municipio' : 'exact',
      isApproximate: backendResult.isApproximate ?? true,
    };
  }

  throw new Error('No se pudo geocodificar la dirección');
};
