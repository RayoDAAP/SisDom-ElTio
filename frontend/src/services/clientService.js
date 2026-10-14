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

const queryNominatimDirect = async (query) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1&countrycodes=mx`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TacosElTio-App/1.0 (internal-tool)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      let lat = parseFloat(data[0].lat);
      let lon = parseFloat(data[0].lon);
      if (lon > 0) lon = -lon;
      return {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lon.toFixed(6)),
        displayName: data[0].display_name,
        isApproximate: false,
      };
    }
  } catch (e) {
    console.warn('[clientService] Direct geocode error:', e);
  }
  return null;
};

/**
 * Geocodifica una dirección: primero consulta directamente desde el navegador (igual que INE Scanner)
 * para evitar bloqueos por IP de Render; si no responde, consulta al backend como contingencia.
 * @param {object} addressData
 */
export const geocodeAddressRequest = async ({ street, number, colonia, municipio, crossStreets }) => {
  const cCalle = cleanPrefixes(street);
  const cNumero = cleanPrefixes(number);
  const cColonia = cleanPrefixes(colonia);
  const mun = municipio?.trim() || 'San Nicolás de los Garza';

  // 1. Calle + Número + Colonia + Municipio + NL
  if (cCalle && cColonia) {
    const q1 = `${cCalle} ${cNumero}, ${cColonia}, ${mun}, Nuevo León, México`.replace(/\s+,/g, ',').trim();
    const r1 = await queryNominatimDirect(q1);
    if (r1) return r1;
  }

  // 2. Calle + Número + Municipio + NL
  if (cCalle && cNumero) {
    const q2 = `${cCalle} ${cNumero}, ${mun}, Nuevo León, México`.trim();
    const r2 = await queryNominatimDirect(q2);
    if (r2) return r2;
  }

  // 3. Calle sola + Municipio + NL
  if (cCalle) {
    const q3 = `${cCalle}, ${mun}, Nuevo León, México`.trim();
    const r3 = await queryNominatimDirect(q3);
    if (r3) return r3;
  }

  // 4. Colonia + Municipio + NL
  if (cColonia) {
    const q4 = `${cColonia}, ${mun}, Nuevo León, México`.trim();
    const r4 = await queryNominatimDirect(q4);
    if (r4) return r4;
  }

  // 5. Fallback al backend
  const response = await api.get('/clients/geocode', {
    params: { street, number, colonia, municipio, crossStreets },
  });
  return response.data.data;
};
