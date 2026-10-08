/**
 * @module order.model
 * @description Catálogo de precios, guisos, métodos de pago y estados de pedido.
 *              Actualizado con precios vigentes y opciones de productos de Tacos El Tío.
 */

export const PRICES = {
  barbacoaPerKg: 480,    // $480 por kg ($0.48 por gramo)
  menudoHalfLiter: 100,  // $100 medio litro
  menudoLiter: 160,      // $160 litro completo
  taco: 24,              // $24 por taco (maíz o harina)
  gordita: 26,           // $26 por gordita (natural o dorada)
  tostada: 26,           // $26 por tostada
  chileRelleno: 30,      // $30 c/u (precio especial para guiso de Chile Relleno)
  cocaCola: 24,          // $24 por refresco Coca-Cola
  salsa: 4,              // $4 por pieza (actualizado de $5 a $4)
  onion: 4,              // $4 por pieza (actualizado de $5 a $4)
  tortillas: {
    'none': { label: 'Ninguno', price: 0 },
    '5_piezas': { label: '5 piezas', price: 7 },
    '10_piezas': { label: '10 piezas', price: 9 },
    'medio_kg': { label: '1/2 kg', price: 15 },
    'kilo': { label: '1 kg', price: 30 },
  },
};

/** Catálogo de 14 guisos tradicionales disponibles */
export const GUISOS_CATALOG = [
  { id: 'barbacoa', name: 'Barbacoa' },
  { id: 'papa_con_chorizo', name: 'Papa con chorizo' },
  { id: 'picadillo_con_papa', name: 'Picadillo con papa' },
  { id: 'asado', name: 'Asado' },
  { id: 'chicharron_verde', name: 'Chicharrón verde' },
  { id: 'deshebrada_con_papa', name: 'Deshebrada con papa' },
  { id: 'discada', name: 'Discada' },
  { id: 'tripitas_de_res', name: 'Tripitas de res' },
  { id: 'huevo_en_salsa', name: 'Huevo en salsa' },
  { id: 'quesadillas', name: 'Quesadillas' },
  { id: 'frijoles_con_queso', name: 'Frijoles con queso' },
  { id: 'nopales', name: 'Nopales' },
  { id: 'rajas_con_queso', name: 'Rajas con queso' },
  { id: 'chiles_rellenos', name: 'Chiles rellenos', specialPrice: 30 },
];

/** Opciones de platillos preparados */
export const FOOD_ITEM_TYPES = {
  TACO: { id: 'taco', label: 'Taco', basePrice: 24, variants: ['Maíz', 'Harina'] },
  GORDITA: { id: 'gordita', label: 'Gordita', basePrice: 26, variants: ['Natural', 'Dorada'] },
  TOSTADA: { id: 'tostada', label: 'Tostada', basePrice: 26, variants: ['Tradicional'] },
};

export const PAYMENT_METHODS = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
};

export const TRANSFER_STATUS = {
  PENDING: 'pendiente',
  ACCEPTED: 'aceptada',
};

export const ORDER_STATUS_CONFIG = {
  incompleto: {
    label: 'Faltante (Urgente)',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-400 font-black ring-1 ring-rose-400',
    icon: 'AlertTriangle',
  },

  listo: {
    label: 'Listo para Entrega',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
    icon: 'CheckCircle2',
  },
  asignado: {
    label: 'Asignado a Repartidor',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
    icon: 'UserCheck',
  },
  en_camino: {
    label: 'En Camino',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    icon: 'Truck',
  },
  entregado: {
    label: 'Entregado',
    badgeClass: 'bg-green-100 text-green-900 border-green-300 font-bold',
    icon: 'CheckCheck',
  },
  cancelado: {
    label: 'Cancelado',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
    icon: 'XCircle',
  },
};
