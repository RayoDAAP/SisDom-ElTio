/**
 * @module OrderCard
 * @description Tarjeta de pedido optimizada para el flujo de trabajo de repartidores.
 *              Incluye accesos directos para llamada al cliente, navegación en mapa,
 *              detalle de cobro (efectivo/transferencia) y transición de estados rápida.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import {
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Banknote,
  Clock,
  Navigation,
} from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ORDER_STATUS_CONFIG, ORDER_STATUS, PAYMENT_METHODS } from '../../models/order.model';

export const OrderCard = ({ order, onStatusChange, onViewDetail, isUpdating = false }) => {
  const { id, client, pricing, status, payment, notes } = order;
  const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG[ORDER_STATUS.PENDING];

  const fullAddress = `Calle ${client?.street || ''} #${client?.number || ''}, Col. ${client?.colonia || ''}`;

  const handleCall = () => {
    if (!client?.phone) {
      Alert.alert('Aviso', 'El cliente no tiene número telefónico registrado');
      return;
    }
    Linking.openURL(`tel:${client.phone}`);
  };

  const handleOpenMap = () => {
    if (!client?.street && !client?.colonia) {
      Alert.alert('Aviso', 'Dirección no especificada');
      return;
    }
    const query = encodeURIComponent(`${fullAddress}, Chihuahua`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Encabezado: Folio y Estado */}
      <View style={styles.cardHeader}>
        <View style={styles.idRow}>
          <Text style={styles.orderId}>{id}</Text>
          {client?.type === 'empresa' && (
            <View style={styles.companyBadge}>
              <Text style={styles.companyText}>Empresa</Text>
            </View>
          )}
        </View>
        <Badge label={statusCfg.label} colors={statusCfg.colors} />
      </View>

      {/* Datos del Cliente y Teléfono */}
      <View style={styles.clientSection}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{client?.name || 'Cliente sin nombre'}</Text>
          {client?.companyName ? (
            <Text style={styles.companyName}>{client.companyName}</Text>
          ) : null}
        </View>

        {client?.phone ? (
          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.7}
            style={styles.callButton}
            accessibilityLabel="Llamar al cliente"
          >
            <Phone size={14} color={THEME.colors.brandRed} />
            <Text style={styles.callButtonText}>Llamar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Dirección con acceso a Mapa */}
      <TouchableOpacity
        onPress={handleOpenMap}
        activeOpacity={0.7}
        style={styles.addressContainer}
      >
        <MapPin size={16} color={THEME.colors.brandRed} style={styles.addressIcon} />
        <View style={styles.addressTextWrapper}>
          <Text style={styles.addressText} numberOfLines={2}>
            {fullAddress}
          </Text>
          <Text style={styles.mapHint}>Toca para abrir en Google Maps</Text>
        </View>
        <Navigation size={14} color={THEME.colors.slate400} />
      </TouchableOpacity>

      {/* Notas de Entrega si existen */}
      {notes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Instrucciones:</Text>
          <Text style={styles.notesText} numberOfLines={2}>
            {notes}
          </Text>
        </View>
      ) : null}

      {/* Resumen de Cobro y Método de Pago */}
      <View style={styles.paymentSection}>
        <View style={styles.paymentMethodRow}>
          {payment?.method === PAYMENT_METHODS.EFECTIVO ? (
            <View style={styles.paymentBadge}>
              <Banknote size={14} color={THEME.colors.emerald800 || '#047857'} />
              <Text style={styles.paymentMethodText}>Cobrar en Efectivo</Text>
            </View>
          ) : (
            <View style={styles.paymentBadgeTransfer}>
              <CreditCard size={14} color={THEME.colors.slate700} />
              <Text style={styles.paymentMethodText}>Transferencia</Text>
            </View>
          )}

          {payment?.method === PAYMENT_METHODS.EFECTIVO && payment?.change !== null ? (
            <Text style={styles.changeHint}>Llevar cambio de ${payment.change}</Text>
          ) : null}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a Cobrar:</Text>
          <Text style={styles.totalAmount}>${pricing?.total || 0}</Text>
        </View>
      </View>

      {/* Botones de Acción según el estado actual */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={() => onViewDetail(order)}
          activeOpacity={0.7}
          style={styles.detailButton}
        >
          <Text style={styles.detailButtonText}>Ver Pedido</Text>
          <ChevronRight size={14} color={THEME.colors.slate600} />
        </TouchableOpacity>

        {status === ORDER_STATUS.READY || status === ORDER_STATUS.PREPARING ? (
          <Button
            title="Iniciar Ruta"
            variant="primary"
            size="sm"
            icon={Truck}
            isLoading={isUpdating}
            onPress={() => onStatusChange(id, ORDER_STATUS.ON_THE_WAY)}
            style={styles.statusActionButton}
          />
        ) : status === ORDER_STATUS.ON_THE_WAY ? (
          <Button
            title="Marcar Entregado"
            variant="success"
            size="sm"
            icon={CheckCircle2}
            isLoading={isUpdating}
            onPress={() => onStatusChange(id, ORDER_STATUS.DELIVERED)}
            style={styles.statusActionButton}
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.sm,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  companyBadge: {
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  companyText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  clientInfo: {
    flex: 1,
    marginRight: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.colors.slate900,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '500',
    color: THEME.colors.slate500,
    marginTop: 1,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.brandRedLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.2)',
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.brandRed,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.slate50,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  addressIcon: {
    marginRight: 8,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  addressTextWrapper: {
    flex: 1,
    marginRight: 6,
  },
  addressText: {
    fontSize: 12,
    color: THEME.colors.slate800,
    fontWeight: '600',
    lineHeight: 16,
  },
  mapHint: {
    fontSize: 10,
    color: THEME.colors.slate400,
    marginTop: 2,
  },
  notesContainer: {
    backgroundColor: THEME.colors.brandYellowLight,
    padding: 8,
    borderRadius: THEME.borderRadius.sm,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.brandYellow,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#854D0E',
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 11,
    color: '#713F12',
    fontWeight: '500',
    marginTop: 2,
  },
  paymentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate100,
    marginTop: 10,
    paddingTop: 10,
  },
  paymentMethodRow: {
    flex: 1,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentBadgeTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate800,
  },
  changeHint: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.emerald800 || '#047857',
    marginTop: 2,
  },
  totalRow: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.slate500,
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: THEME.colors.brandRed,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate100,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  detailButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  statusActionButton: {
    minWidth: 140,
  },
});
