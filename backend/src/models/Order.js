/**
 * @module Order
 * @description Modelo de Pedidos para Tacos El Tío.
 *              Guarda información del cliente, desgloses de Barbacoa, Menudo, Extras y Totales.
 */

export const ORDER_STATUS = {
  PENDING: 'pendiente',
  PREPARING: 'en_preparacion',
  READY: 'listo',
  ON_THE_WAY: 'en_camino',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
};

/** Store en memoria inicial con pedidos de prueba */
export const orderStore = [
  {
    id: 'PED-1001',
    createdAt: new Date().toISOString(),
    status: ORDER_STATUS.PREPARING,
    createdBy: 'Auxiliar de Pedidos',
    client: {
      type: 'particular',
      name: 'Carlos Ruiz',
      phone: '6145550192',
      street: 'Av. Universidad',
      number: '1402',
      colonia: 'Centro',
      companyName: '',
    },
    items: {
      barbacoa: [
        { type: 'gramos', amount: 500, label: '500g de Barbacoa', price: 180 },
      ],
      menudo: [
        { size: '1L', quantity: 1, label: '1 Litro de Menudo', price: 120 },
      ],
      extras: {
        salsaRed: 2,
        salsaGreen: 2,
        onion: 1,
        tortillas: 'medio_kg', // 5_piezas, 10_piezas, medio_kg, kilo
      },
    },
    pricing: {
      subtotal: 300,
      shippingFee: 40,
      total: 340,
    },
    notes: 'Entregar en puerta principal, llamar al llegar',
  },
  {
    id: 'PED-1002',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 horas antes
    status: ORDER_STATUS.READY,
    createdBy: 'Administrador General',
    client: {
      type: 'empresa',
      name: 'Ing. Sofía Morales',
      phone: '6149876543',
      street: 'Periférico Juventud',
      number: '8900',
      colonia: 'Complejo Industrial',
      companyName: 'Constructora del Norte SA',
    },
    items: {
      barbacoa: [
        { type: 'platillo', quantity: 5, unitPrice: 100, label: '5 Platillos de $100 c/u', price: 500 },
      ],
      menudo: [
        { size: '0.5L', quantity: 2, label: '2 Medio Litro de Menudo', price: 130 },
      ],
      extras: {
        salsaRed: 4,
        salsaGreen: 4,
        onion: 3,
        tortillas: 'kilo',
      },
    },
    pricing: {
      subtotal: 630,
      shippingFee: 50,
      total: 680,
    },
    notes: 'Facturar a la empresa',
  },
  {
    id: 'PED-1003',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // hace 2 días
    status: ORDER_STATUS.DELIVERED,
    createdBy: 'Auxiliar de Pedidos',
    client: {
      type: 'particular',
      name: 'María Fernández',
      phone: '6142223344',
      street: 'Calle 24a',
      number: '405',
      colonia: 'Santa Rosa',
      companyName: '',
    },
    items: {
      barbacoa: [
        { type: 'monto', amount: 250, label: 'Barbacoa por Monto ($250)', price: 250 },
      ],
      menudo: [],
      extras: {
        salsaRed: 1,
        salsaGreen: 1,
        onion: 1,
        tortillas: '10_piezas',
      },
    },
    pricing: {
      subtotal: 250,
      shippingFee: 30,
      total: 280,
    },
    notes: '',
  },
];
