/**
 * @module order.model
 * @description Precios de catálogo predeterminados y etiquetas del sistema.
 */

export const PRICES = {
  barbacoaPerKg: 360, // $360 por kg ($0.36 por gramo)
  menudoHalfLiter: 65,  // $65 medio litro
  menudoLiter: 120,    // $120 litro completo
  salsa: 5,            // $5 por pieza
  onion: 5,            // $5 por porción
  tortillas: {
    '5_piezas': { label: '5 piezas', price: 10 },
    '10_piezas': { label: '10 piezas', price: 20 },
    'medio_kg': { label: '1/2 kg', price: 25 },
    'kilo': { label: '1 kg', price: 45 },
  },
};

export const ORDER_STATUS_LABELS = {
  pendiente: { label: 'Pendiente', color: '#F57F17', bg: '#FFF9C4' },
  en_preparacion: { label: 'En Preparación', color: '#0288D1', bg: '#E1F5FE' },
  listo: { label: 'Listo para Entrega', color: '#2E7D32', bg: '#E8F5E9' },
  en_camino: { label: 'En Camino', color: '#7B1FA2', bg: '#F3E5F5' },
  entregado: { label: 'Entregado', color: '#388E3C', bg: '#E8F5E9' },
  cancelado: { label: 'Cancelado', color: '#C62828', bg: '#FFEBEE' },
};
