/**
 * @module order.model
 * @description Precios de catálogo predeterminados y mapeo semántico de estados de pedido.
 */

export const PRICES = {
  barbacoaPerKg: 360, // $360 por kg ($0.36 por gramo)
  menudoHalfLiter: 65,  // $65 medio litro
  menudoLiter: 120,    // $120 litro completo
  salsa: 5,            // $5 por pieza
  onion: 5,            // $5 por porción
  tortillas: {
    'none': { label: 'Ninguno', price: 0 },
    '5_piezas': { label: '5 piezas', price: 10 },
    '10_piezas': { label: '10 piezas', price: 20 },
    'medio_kg': { label: '1/2 kg', price: 25 },
    'kilo': { label: '1 kg', price: 45 },
  },
};

export const ORDER_STATUS_CONFIG = {
  pendiente: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: 'Clock',
  },
  en_preparacion: {
    label: 'En Preparación',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    icon: 'ChefHat',
  },
  listo: {
    label: 'Listo para Entrega',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: 'CheckCircle2',
  },
  en_camino: {
    label: 'En Camino',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: 'Truck',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-green-100 text-green-900 border-green-300',
    icon: 'CheckCheck',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-red-100 text-red-900 border-red-300',
    icon: 'XCircle',
  },
};
