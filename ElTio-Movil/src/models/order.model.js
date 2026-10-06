/**
 * @module order.model
 * @description Constantes y configuración visual de estados de pedidos para repartidores.
 */
import { THEME } from '../config/theme';

export const ORDER_STATUS = {
  PENDING: 'pendiente',
  PREPARING: 'en_preparacion',
  READY: 'listo',
  ON_THE_WAY: 'en_camino',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado',
};

export const ORDER_STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]: {
    label: 'Pendiente',
    colors: THEME.colors.statusPending,
  },
  [ORDER_STATUS.PREPARING]: {
    label: 'En Preparación',
    colors: THEME.colors.statusPreparing,
  },
  [ORDER_STATUS.READY]: {
    label: 'Listo para Entrega',
    colors: THEME.colors.statusReady,
  },
  [ORDER_STATUS.ON_THE_WAY]: {
    label: 'En Camino',
    colors: THEME.colors.statusOnTheWay,
  },
  [ORDER_STATUS.DELIVERED]: {
    label: 'Entregado',
    colors: THEME.colors.statusDelivered,
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Cancelado',
    colors: THEME.colors.statusCancelled,
  },
};

export const PAYMENT_METHODS = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
};
