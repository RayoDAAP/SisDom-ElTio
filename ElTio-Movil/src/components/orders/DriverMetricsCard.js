/**
 * @module DriverMetricsCard
 * @description Tarjeta colapsable de métricas diarias para el repartidor.
 *              Calcula en vivo:
 *              - Total acumulado / a liquidar
 *              - Total de puro producto (subtotal)
 *              - Total de puros envíos (ganancias de entrega)
 *              - Efectivo en mano a entregar en caja
 *              - Ratio de entregas (completadas vs asignadas)
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TrendingUp,
  DollarSign,
  Package,
  Truck,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
} from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { ORDER_STATUS, PAYMENT_METHODS } from '../../models/order.model';

export const DriverMetricsCard = ({ orders = [] }) => {
  const [collapsed, setCollapsed] = useState(false);

  // Consideramos las órdenes del día de hoy (o asignadas en la sesión actual)
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalProducts = 0;
    let totalShipping = 0;
    let cashInHand = 0;
    let transferTotal = 0;
    let deliveredCount = 0;
    let activeCount = 0;
    let cancelledCount = 0;

    orders.forEach((order) => {
      const isDelivered = order.status === ORDER_STATUS.DELIVERED;
      const isCancelled = order.status === ORDER_STATUS.CANCELLED;
      const total = Number(order.pricing?.total) || 0;
      const subtotal = Number(order.pricing?.subtotal) || 0;
      const shipping = Number(order.pricing?.shippingFee) || Math.max(0, total - subtotal);

      if (isDelivered) {
        deliveredCount += 1;
        totalRevenue += total;
        totalProducts += subtotal;
        totalShipping += shipping;

        if (order.payment?.method === PAYMENT_METHODS.EFECTIVO) {
          cashInHand += total;
        } else if (order.payment?.method === PAYMENT_METHODS.TRANSFERENCIA) {
          transferTotal += total;
        }
      } else if (isCancelled) {
        cancelledCount += 1;
      } else {
        activeCount += 1;
      }
    });

    const totalOrders = orders.length;
    const completionRate = totalOrders > 0
      ? Math.round((deliveredCount / Math.max(1, totalOrders - cancelledCount)) * 100)
      : 0;

    return {
      totalRevenue,
      totalProducts,
      totalShipping,
      cashInHand,
      transferTotal,
      deliveredCount,
      activeCount,
      cancelledCount,
      totalOrders,
      completionRate,
    };
  }, [orders]);

  return (
    <View style={styles.card}>
      {/* Cabecera / Barra principal siempre visible */}
      <TouchableOpacity
        onPress={() => setCollapsed((prev) => !prev)}
        activeOpacity={0.8}
        style={styles.headerRow}
      >
        <View style={styles.titleWithIcon}>
          <View style={styles.iconCircle}>
            <TrendingUp size={16} color={THEME.colors.brandRed} />
          </View>
          <View>
            <Text style={styles.titleText}>Resumen del Día</Text>
            <Text style={styles.subtitleText}>
              {metrics.deliveredCount} entregadas · {metrics.activeCount} activas
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.headerTotalBox}>
            <Text style={styles.headerTotalLabel}>Total Entregado</Text>
            <Text style={styles.headerTotalValue}>${metrics.totalRevenue.toLocaleString('es-MX')}</Text>
          </View>
          <View style={styles.collapseToggleBtn}>
            {collapsed ? (
              <ChevronDown size={18} color={THEME.colors.slate500} />
            ) : (
              <ChevronUp size={18} color={THEME.colors.slate500} />
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Contenido expandible con métricas detalladas */}
      {!collapsed && (
        <View style={styles.detailsContainer}>
          {/* Fila principal: Producto vs Envíos */}
          <View style={styles.metricsGrid}>
            {/* Puro Producto */}
            <View style={[styles.metricBox, styles.metricBoxYellow]}>
              <View style={styles.metricBoxHeader}>
                <Package size={14} color="#854D0E" />
                <Text style={styles.metricLabelYellow}>Puro Producto</Text>
              </View>
              <Text style={styles.metricValue}>${metrics.totalProducts.toLocaleString('es-MX')}</Text>
              <Text style={styles.metricSubtext}>Subtotal alimentos</Text>
            </View>

            {/* Puros Envíos */}
            <View style={[styles.metricBox, styles.metricBoxBlue]}>
              <View style={styles.metricBoxHeader}>
                <Truck size={14} color="#1E40AF" />
                <Text style={styles.metricLabelBlue}>Puros Envíos</Text>
              </View>
              <Text style={styles.metricValue}>${metrics.totalShipping.toLocaleString('es-MX')}</Text>
              <Text style={styles.metricSubtext}>Flete / Comisiones</Text>
            </View>
          </View>

          {/* Segunda Fila: Efectivo a liquidar vs Transferencias */}
          <View style={styles.cashFlowRow}>
            <View style={styles.cashItem}>
              <View style={styles.cashIconRow}>
                <Banknote size={14} color="#166534" />
                <Text style={styles.cashTitle}>Efectivo en mano:</Text>
              </View>
              <Text style={styles.cashAmount}>${metrics.cashInHand.toLocaleString('es-MX')}</Text>
              <Text style={styles.cashHint}>A liquidar en caja</Text>
            </View>

            <View style={styles.cashDivider} />

            <View style={styles.cashItem}>
              <View style={styles.cashIconRow}>
                <CreditCard size={14} color={THEME.colors.slate600} />
                <Text style={styles.cashTitle}>En Transferencias:</Text>
              </View>
              <Text style={[styles.cashAmount, { color: THEME.colors.slate800 }]}>
                ${metrics.transferTotal.toLocaleString('es-MX')}
              </Text>
              <Text style={styles.cashHint}>Verificadas en web</Text>
            </View>
          </View>

          {/* Barra de progreso de avance */}
          <View style={styles.progressContainer}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTitle}>Avance de entregas</Text>
              <Text style={styles.progressPercentage}>{metrics.completionRate}% completado</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, metrics.completionRate)}%` },
                ]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.brandRedLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.15)',
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  subtitleText: {
    fontSize: 11,
    color: THEME.colors.slate500,
    fontWeight: '500',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTotalBox: {
    alignItems: 'flex-end',
  },
  headerTotalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.slate400,
    textTransform: 'uppercase',
  },
  headerTotalValue: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.brandRed,
  },
  collapseToggleBtn: {
    padding: 4,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate100,
    padding: THEME.spacing.md,
    paddingTop: 10,
    backgroundColor: THEME.colors.slate50,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
  },
  metricBoxYellow: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  metricBoxBlue: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  metricBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  metricLabelYellow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
  },
  metricLabelBlue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.slate900,
  },
  metricSubtext: {
    fontSize: 10,
    color: THEME.colors.slate500,
    marginTop: 2,
  },
  cashFlowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  cashItem: {
    flex: 1,
    alignItems: 'center',
  },
  cashIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  cashTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  cashAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: '#166534',
  },
  cashHint: {
    fontSize: 9,
    color: THEME.colors.slate400,
    marginTop: 1,
  },
  cashDivider: {
    width: 1,
    height: 32,
    backgroundColor: THEME.colors.slate200,
    marginHorizontal: 8,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.slate500,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.slate700,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: THEME.colors.slate200,
    borderRadius: THEME.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: THEME.borderRadius.full,
  },
});
