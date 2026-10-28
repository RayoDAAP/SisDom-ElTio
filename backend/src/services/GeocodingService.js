/**
 * @module GeocodingService
 * @description Servicio de geocodificación en cascada para el Área Metropolitana de Monterrey.
 *              Nivel 1: Mapbox Geocoding v6 (si MAPBOX_TOKEN está configurado).
 *              Nivel 2: OpenStreetMap Nominatim con rate limit.
 *              Nivel 3: Catálogo local de colonias y municipios.
 *              Nivel 4: Sucursal central (último recurso).
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

// ─── Funciones de Limpieza de Texto ──────────────────────────────────────────

const stripEdges = (s) => s.replace(/^[,\s.\-]+|[,\s.\-]+$/g, '').trim();

export const cleanCalle = (v) => {
  if (!v) return '';
  const s = String(v).trim()
    .replace(/^\s*(?:calle|c\.)\s+/i, '')
    .replace(/\bC\.?P\.?\s*\d{5}\b/gi, '')
    .replace(/\b\d{5}\b/g);
  return stripEdges(s);
};

export const cleanColonia = (v) => {
  if (!v) return '';
  const s = String(v).trim()
    .replace(/^\s*(?:colonia|col\.)\s+/i, '')
    .replace(/\bC\.?P\.?\s*\d{5}\b/gi, '')
    .replace(/\bC\.?P\.?\b/gi, '')
    .replace(/\b\d{5}\b/g, '')
    .replace(/\b(?:SEC|SECT|SECTOR|ETAPA|MZA|LT|MZ)\.?\s*\d+\b/gi, '');
  return stripEdges(s);
};

export const cleanNumero = (v) => {
  if (!v) return '';
  const s = String(v).trim()
    .replace(/^\s*(?:no\.?|num\.?|núm\.?|#)\s*(?=\d)/i, '')
    .replace(/\s+(?:int(?:erior)?\.?|depto\.?|dpto\.?)\s*\S*$/i, '');
  return stripEdges(s);
};

const normalize = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const isSinCalle = (calle) => !calle || /^(?:s\/c|sin calle)$/i.test(calle.trim());

// ─── Límites Geográficos Monterrey ───────────────────────────────────────────

const MTY_BBOX = {
  latMin: 25.40,
  latMax: 25.95,
  lngMin: -100.65,
  lngMax: -99.95,
};

const isInMtyBbox = (lat, lng) =>
  lat >= MTY_BBOX.latMin &&
  lat <= MTY_BBOX.latMax &&
  lng >= MTY_BBOX.lngMin &&
  lng <= MTY_BBOX.lngMax;

// ─── Clasificación de Features de Mapbox ─────────────────────────────────────

export const classifyFeature = (feature, requestedNumber = '') => {
  if (!feature || typeof feature !== 'object') return 'municipio';

  const featureType = feature?.properties?.feature_type || feature?.feature_type || '';
  const matchCode = feature?.properties?.match_code?.address_number;
  const accuracy = feature?.properties?.coordinates?.accuracy;

  if (featureType === 'address') {
    const isMatched = matchCode === 'matched';
    if (isMatched) {
      if (accuracy === 'interpolated') {
        return 'interpolated';
      }
      return 'exact';
    }

    const cleanReqNum = cleanNumero(requestedNumber);
    const houseNum = feature?.properties?.house_number || feature?.address || '';
    if (cleanReqNum && houseNum && String(houseNum).trim() === cleanReqNum) {
      if (accuracy === 'interpolated') {
        return 'interpolated';
      }
      return 'exact';
    }
    return 'street';
  }

  if (featureType === 'street') {
    return 'street';
  }

  if (['neighborhood', 'locality', 'district'].includes(featureType)) {
    return 'colonia';
  }

  return 'municipio';
};

const PRECISION_SCORE = {
  exact: 5,
  interpolated: 4,
  street: 3,
  colonia: 2,
  municipio: 1,
};

// ─── Caché en Memoria (24 horas, máx 500 entradas) ───────────────────────────

const geocodeCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

const getFromCache = (key) => {
  const entry = geocodeCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    geocodeCache.delete(key);
    return null;
  }
  return entry.result;
};

const setInCache = (key, result) => {
  if (geocodeCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = geocodeCache.keys().next().value;
    if (oldestKey) geocodeCache.delete(oldestKey);
  }
  geocodeCache.set(key, { result, timestamp: Date.now() });
};

// ─── Mapbox Geocoding v6 ─────────────────────────────────────────────────────

let mapboxDisabledUntil = 0;

const queryMapboxForward = async (queryText, types, proximity) => {
  if (!env.MAPBOX_TOKEN || Date.now() < mapboxDisabledUntil) {
    return null;
  }

  const doFetch = async (useTypes = true) => {
    const params = new URLSearchParams({
      q: queryText,
      access_token: env.MAPBOX_TOKEN,
      country: 'mx',
      language: 'es',
      limit: '5',
      autocomplete: 'false',
      bbox: '-100.65,25.40,-99.95,25.95',
      proximity,
    });

    if (useTypes && types) {
      params.set('types', types);
    }

    const url = `https://api.mapbox.com/search/geocode/v6/forward?${params.toString()}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.status === 401 || res.status === 403) {
        console.warn(`[GeocodingService] Mapbox auth error: status ${res.status}. Disabling Mapbox for 10 minutes.`);
        mapboxDisabledUntil = Date.now() + 10 * 60 * 1000;
        return null;
      }

      if (res.status === 429) {
        console.warn('[GeocodingService] Mapbox rate limit (429). Skipping to next fallback.');
        return null;
      }

      if (res.status === 422 && useTypes) {
        // Reintentar una vez sin el parámetro types
        return await doFetch(false);
      }

      if (!res.ok) {
        console.warn(`[GeocodingService] Mapbox error: status ${res.status}`);
        return null;
      }

      const data = await res.json();
      return Array.isArray(data?.features) ? data.features : [];
    } catch (err) {
      clearTimeout(timeout);
      if (err.name !== 'AbortError') {
        console.warn('[GeocodingService] Mapbox fetch error:', err.message);
      }
      return null;
    }
  };

  return await doFetch(true);
};

const pickBestMapboxCandidate = (validCandidates, requestedNumber, requestedColonia) => {
  if (!validCandidates || validCandidates.length === 0) return null;

  const normColonia = normalize(requestedColonia);

  let best = null;
  let bestScore = -1;
  let bestHasColonia = false;

  for (const item of validCandidates) {
    const precision = classifyFeature(item.feat, requestedNumber);
    const score = PRECISION_SCORE[precision] || 0;
    const fullText = normalize(
      item.feat?.properties?.full_address ||
      item.feat?.properties?.name ||
      item.feat?.place_name ||
      ''
    );
    const hasColonia = normColonia ? fullText.includes(normColonia) : false;

    if (
      score > bestScore ||
      (score === bestScore && !bestHasColonia && hasColonia)
    ) {
      best = { ...item, precision };
      bestScore = score;
      bestHasColonia = hasColonia;
    }
  }

  return best;
};

const runMapboxCascade = async ({ calle, numero, colonia, municipio }) => {
  if (!env.MAPBOX_TOKEN || Date.now() < mapboxDisabledUntil) {
    return null;
  }

  const normMun = normalize(municipio);
  const munCoords = MUNICIPIOS_COORDINATES[normMun] || MUNICIPIOS_COORDINATES['san nicolas de los garza'];
  const proximity = `${munCoords.lng},${munCoords.lat}`;

  const hasCalle = !isSinCalle(calle);
  const hasNumero = Boolean(numero);
  const hasColonia = Boolean(colonia);

  const levels = [];

  // N1 (si hay calle y número)
  if (hasCalle && hasNumero) {
    const parts = [
      `${calle} ${numero}`,
      hasColonia ? colonia : null,
      municipio,
      'Nuevo León',
    ].filter(Boolean);
    levels.push({
      q: parts.join(', '),
      types: 'address,street',
      stopCondition: (prec) => ['exact', 'interpolated', 'street'].includes(prec),
    });
  }

  // N2 (si hay calle)
  if (hasCalle) {
    const parts = [
      calle,
      hasColonia ? colonia : null,
      municipio,
      'Nuevo León',
    ].filter(Boolean);
    levels.push({
      q: parts.join(', '),
      types: 'address,street',
      stopCondition: (prec) => ['exact', 'interpolated', 'street'].includes(prec),
    });
  }

  // N3 (si hay calle)
  if (hasCalle) {
    levels.push({
      q: `${calle}, ${municipio}, Nuevo León`,
      types: 'address,street',
      stopCondition: (prec) => ['exact', 'interpolated', 'street'].includes(prec),
    });
  }

  // N4 (si hay colonia)
  if (hasColonia) {
    levels.push({
      q: `${colonia}, ${municipio}, Nuevo León`,
      types: 'neighborhood,locality',
      forcedPrecision: 'colonia',
      stopCondition: () => true,
    });
  }

  // N5 (municipio)
  levels.push({
    q: `${municipio}, Nuevo León`,
    types: 'place,locality',
    forcedPrecision: 'municipio',
    stopCondition: () => true,
  });

  for (const lvl of levels) {
    const features = await queryMapboxForward(lvl.q, lvl.types, proximity);
    if (!features || features.length === 0) continue;

    const validInBbox = features
      .map((feat) => {
        const coords = feat?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        let [candLng, candLat] = coords;
        candLat = parseFloat(candLat);
        candLng = parseFloat(candLng);
        if (candLng > 0) candLng = -candLng;
        if (!isInMtyBbox(candLat, candLng)) return null;
        return { feat, lat: candLat, lng: candLng };
      })
      .filter(Boolean);

    if (validInBbox.length === 0) continue;

    const chosen = pickBestMapboxCandidate(validInBbox, numero, colonia);
    if (!chosen) continue;

    const precision = lvl.forcedPrecision || chosen.precision;
    if (lvl.stopCondition(precision)) {
      const displayName =
        chosen.feat?.properties?.full_address ||
        chosen.feat?.properties?.name ||
        `${calle || ''} ${numero || ''}, ${colonia || ''}, ${municipio}`.replace(/\s+,/g, ',').trim();

      return {
        lat: parseFloat(chosen.lat.toFixed(6)),
        lng: parseFloat(chosen.lng.toFixed(6)),
        displayName,
        precision,
        isApproximate: precision !== 'exact',
        source: 'mapbox',
      };
    }
  }

  return null;
};

// ─── Respaldo OpenStreetMap Nominatim ────────────────────────────────────────

let lastNominatimRequestTime = 0;

const waitForNominatimRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastNominatimRequestTime;
  if (elapsed < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastNominatimRequestTime = Date.now();
};

const fetchNominatimQuery = async (params, useBounded = true) => {
  await waitForNominatimRateLimit();

  const searchParams = new URLSearchParams({
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'es',
    countrycodes: 'mx',
    limit: '5',
    ...params,
  });

  if (useBounded) {
    searchParams.set('viewbox', '-100.65,25.95,-99.95,25.40');
    searchParams.set('bounded', '1');
  }

  const url = `https://nominatim.openstreetmap.org/search?${searchParams.toString()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TacosElTio-DeliveryApp/1.0 (contacto@eltio.com)',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name !== 'AbortError') {
      console.warn('[GeocodingService] Nominatim fetch error:', err.message);
    }
    return null;
  }
};

const queryNominatimWithFallback = async (params) => {
  let results = await fetchNominatimQuery(params, true);
  if (!results) {
    results = await fetchNominatimQuery(params, false);
  }
  return results;
};

const runNominatimFallback = async ({ calle, numero, colonia, municipio }) => {
  const hasCalle = !isSinCalle(calle);
  const hasNumero = Boolean(numero);
  const hasColonia = Boolean(colonia);

  let results = null;

  // 1. Estructurada con número y calle
  if (hasCalle && hasNumero) {
    results = await queryNominatimWithFallback({
      street: `${numero} ${calle}`,
      city: municipio,
      state: 'Nuevo León',
    });
  }

  // 2. Estructurada solo con calle
  if (!results && hasCalle) {
    results = await queryNominatimWithFallback({
      street: calle,
      city: municipio,
      state: 'Nuevo León',
    });
  }

  // 3. Texto libre: colonia, municipio
  if (!results && hasColonia) {
    results = await queryNominatimWithFallback({
      q: `${colonia}, ${municipio}, Nuevo León, México`,
    });
  }

  // 4. Texto libre: municipio
  if (!results) {
    results = await queryNominatimWithFallback({
      q: `${municipio}, Nuevo León, México`,
    });
  }

  if (!results || results.length === 0) return null;

  const validCandidates = results
    .map((item) => {
      let lat = parseFloat(item.lat);
      let lon = parseFloat(item.lon);
      if (lon > 0) lon = -lon;
      if (!isInMtyBbox(lat, lon)) return null;

      let precision = 'colonia';
      const cleanReqNum = cleanNumero(numero).replace(/\s+/g, '');
      const itemHn = cleanNumero(item.address?.house_number || '').replace(/\s+/g, '');

      if (cleanReqNum && itemHn && itemHn === cleanReqNum) {
        precision = 'exact';
      } else if (item.class === 'highway') {
        precision = 'street';
      }

      return {
        lat,
        lng: lon,
        displayName: item.display_name,
        precision,
      };
    })
    .filter(Boolean);

  if (validCandidates.length === 0) return null;

  const normColonia = normalize(colonia);
  let best = null;
  let bestScore = -1;
  let bestHasColonia = false;

  for (const cand of validCandidates) {
    const score = PRECISION_SCORE[cand.precision] || 0;
    const hasCol = normColonia ? normalize(cand.displayName).includes(normColonia) : false;

    if (
      score > bestScore ||
      (score === bestScore && !bestHasColonia && hasCol)
    ) {
      best = cand;
      bestScore = score;
      bestHasColonia = hasCol;
    }
  }

  if (best) {
    return {
      lat: parseFloat(best.lat.toFixed(6)),
      lng: parseFloat(best.lng.toFixed(6)),
      displayName: best.displayName,
      precision: best.precision,
      isApproximate: best.precision !== 'exact',
      source: 'nominatim',
    };
  }

  return null;
};

// ─── Función Principal de Geocodificación ─────────────────────────────────────

/**
 * Geocodifica una dirección con cascada Mapbox -> Nominatim -> Catálogo -> Sucursal.
 *
 * @param {object} addressData
 * @param {string} addressData.street - Calle
 * @param {string} addressData.number - Número exterior
 * @param {string} addressData.colonia - Colonia
 * @param {string} addressData.municipio - Municipio (default: San Nicolás de los Garza)
 * @param {string} [addressData.crossStreets] - Entre calles
 * @returns {Promise<{ lat: number, lng: number, displayName: string, precision: string, isApproximate: boolean, source: string }>}
 */
export const geocodeAddress = async ({
  street = '',
  number = '',
  colonia = '',
  municipio = 'San Nicolás de los Garza',
  crossStreets = '',
} = {}) => {
  const calle = cleanCalle(street);
  const numero = cleanNumero(number);
  const col = cleanColonia(colonia);
  const mun = (municipio || 'San Nicolás de los Garza').trim();

  const cacheKey = `${normalize(calle)}|${normalize(numero)}|${normalize(col)}|${normalize(mun)}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  // Nivel 1: Mapbox Geocoding v6
  try {
    const mapboxResult = await runMapboxCascade({
      calle,
      numero,
      colonia: col,
      municipio: mun,
    });
    if (mapboxResult) {
      setInCache(cacheKey, mapboxResult);
      return mapboxResult;
    }
  } catch (err) {
    console.warn('[GeocodingService] Mapbox cascade exception:', err.message);
  }

  // Nivel 2: Respaldo OpenStreetMap Nominatim
  try {
    const nominatimResult = await runNominatimFallback({
      calle,
      numero,
      colonia: col,
      municipio: mun,
    });
    if (nominatimResult) {
      setInCache(cacheKey, nominatimResult);
      return nominatimResult;
    }
  } catch (err) {
    console.warn('[GeocodingService] Nominatim fallback exception:', err.message);
  }

  // Nivel 3: Catálogo Local de Colonias
  const normCol = normalize(col);
  if (normCol && COLONIAS_COORDINATES[normCol]) {
    const c = COLONIAS_COORDINATES[normCol];
    let lng = c.lng > 0 ? -c.lng : c.lng;
    const catResult = {
      lat: parseFloat(c.lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      displayName: `${colonia || col}, ${mun}, N.L. (Catálogo Colonia)`,
      precision: 'colonia',
      isApproximate: true,
      source: 'catalogo',
    };
    setInCache(cacheKey, catResult);
    return catResult;
  }

  // Nivel 4: Catálogo Local de Municipios
  const normMun = normalize(mun);
  if (normMun && MUNICIPIOS_COORDINATES[normMun]) {
    const c = MUNICIPIOS_COORDINATES[normMun];
    let lng = c.lng > 0 ? -c.lng : c.lng;
    const catResult = {
      lat: parseFloat(c.lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      displayName: `${mun}, N.L. (Centro Municipal)`,
      precision: 'municipio',
      isApproximate: true,
      source: 'catalogo',
    };
    setInCache(cacheKey, catResult);
    return catResult;
  }

  // Nivel 5: Ubicación de Sucursal (Último recurso)
  let branchLng = env.BRANCH_LOCATION.lng > 0 ? -env.BRANCH_LOCATION.lng : env.BRANCH_LOCATION.lng;
  const branchResult = {
    lat: parseFloat(env.BRANCH_LOCATION.lat.toFixed(6)),
    lng: parseFloat(branchLng.toFixed(6)),
    displayName: 'Referencia de sucursal (ubicación no encontrada)',
    precision: 'municipio',
    isApproximate: true,
    source: 'sucursal',
  };
  setInCache(cacheKey, branchResult);
  return branchResult;
};

export default {
  geocodeAddress,
  classifyFeature,
  cleanCalle,
  cleanColonia,
  cleanNumero,
  MUNICIPIOS_COORDINATES,
  COLONIAS_COORDINATES,
};
