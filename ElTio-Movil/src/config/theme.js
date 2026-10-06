/**
 * @module theme
 * @description Sistema de diseño y constantes visuales para la aplicación móvil de Tacos El Tío.
 *              Alineado a los colores de marca oficiales y paleta profesional neutra.
 */

export const THEME = {
  colors: {
    // Identidad de marca
    brandRed: '#CC0000',
    brandRedDark: '#990000',
    brandRedLight: '#FFF1F1',
    brandYellow: '#FFD700',
    brandYellowLight: '#FEF9C3',

    // Neutros
    slate900: '#0F172A',
    slate800: '#1E293B',
    slate700: '#334155',
    slate600: '#475569',
    slate500: '#64748B',
    slate400: '#94A3B8',
    slate300: '#CBD5E1',
    slate200: '#E2E8F0',
    slate100: '#F1F5F9',
    slate50: '#F8FAFC',
    white: '#FFFFFF',

    // Estados de entrega
    statusPending: {
      bg: '#FEF3C7',
      text: '#92400E',
      border: '#FCD34D',
    },
    statusPreparing: {
      bg: '#E0F2FE',
      text: '#075985',
      border: '#7DD3FC',
    },
    statusReady: {
      bg: '#D1FAE5',
      text: '#065F46',
      border: '#6EE7B7',
    },
    statusOnTheWay: {
      bg: '#EDE9FE',
      text: '#5B21B6',
      border: '#C4B5FD',
    },
    statusDelivered: {
      bg: '#DCFCE7',
      text: '#166534',
      border: '#86EFAC',
    },
    statusCancelled: {
      bg: '#FEE2E2',
      text: '#991B1B',
      border: '#FCA5A5',
    },

    // Utilidades
    error: '#DC2626',
    errorBg: '#FEF2F2',
    success: '#16A34A',
    successBg: '#F0FDF4',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
};
