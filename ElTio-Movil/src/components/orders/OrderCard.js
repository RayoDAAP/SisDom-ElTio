/**
 * @module OrderCard
 * @description Tarjeta de pedido compacta y limpia optimizada para repartidores en ruta.
 *              Prioriza la legibilidad rápida: Folio, Estado, Monto, Cliente, Dirección y Acciones inmediatas.
 *              Reduce la sobrecarga visual moviendo los desgloses extensos al modal de detalle.
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
  Navigation,
  AlertTriangle,
  Lock,
  Package,
} from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ORDER_STATUS_CONFIG, ORDER_STATUS, PAYMENT_METHODS } from '../../models/order.model';

export const OrderCard = ({
  order,
  onStatusChange,
  onViewDetail,
  onReportMissing,
  isUpdating = false,
}) => {
  const { id, client, pricing, status, payment, items, notes, missingReport } = order;
  const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG[ORDER_STATUS.READY];
  const isLocked = status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.CANCELLED;
  const isPickup = client?.deliveryType === 'recoger';

  // Dirección concisa
  const shortAddress = isPickup
    ? 'Pasa a recoger en sucursal'
    : `C. ${client?.street || ''} #${client?.number || 'S/N'}, ${client?.colonia || ''}`;

  // Resumen sintético del contenido del paquete (ej. "3 platillos · 1 bebida")
  const itemsSummary = React.useMemo(() => {
    const parts = [];
    const preparedCount = items?.preparedItems?.length || 0;
    if (preparedCount > 0) {
      parts.push(`${preparedCount} platillo${preparedCount > 1 ? 's' : ''}`);
    }

    let menudoCount = 0;
    if (Array.isArray(items?.menudo)) {
      menudoCount = items.menudo.reduce((acc, m) => acc + (m.quantity || 1), 0);
    }
    if (menudoCount > 0) {
      parts.push(`${menudoCount} menudo`);
    }

    let drinksCount = 0;
    if (Array.isArray(items?.drinks)) {
      drinksCount = items.drinks.reduce((acc, d) => acc + (d.quantity || 1), 0);
    }
    if (drinksCount > 0) {
      parts.push(`${drinksCount} bebida${drinksCount > 1 ? 's' : ''}`);
    }

    if (parts.length === 0) {
      return 'Ver detalle';
    }
    return parts.join(' · ');
  }, [items]);

  const handleCall = () => {
    if (!client?.phone) {
      Alert.alert('Aviso', 'El cliente no tiene número registrado');
      return;
    }
    Linking.openURL(`tel:${client.phone}`);
  };

  const handleOpenMap = () => {
    if (client?.lat && client?.lng) {
      Linking.openURL(`https://www.google.com/maps?q=${client.lat},${client.lng}`);
      return;
    }
    if (!client?.street && !client?.colonia) {
      Alert.alert('Aviso', 'Dirección no especificada');
      return;
    }
    const mun = client?.municipio || 'San Nicolás de los Garza';
    const fullAddress = `Calle ${client?.street || ''} #${client?.number || ''}, Col. ${client?.colonia || ''}`;
    const query = encodeURIComponent(`${fullAddress}, ${mun}, Nuevo León, México`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onViewDetail(order)}
      style={[
        styles.cardContainer,
        missingReport && styles.cardContainerAlert,
      ]}
    >
      {/* 1. Encabezado compacto: Folio + Estado + Total en la misma línea */}
      <View style={styles.cardHeader}>
        <View style={styles.idGroup}>
          <Text style={styles.orderId}>{id}</Text>
          {client?.type === 'empresa' && (
            <View style={styles.companyBadge}>
              <Text style={styles.companyBadgeText}>Empresa</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          <Badge label={statusCfg.label} colors={statusCfg.colors} />
          <Text style={styles.headerTotalAmount}>
            ${pricing?.total || 0}
          </Text>
        </View>
      </View>

      {/* 2. Banner discreto de Faltante si aplica */}
      {missingReport ? (
        <View style={styles.missingReportBanner}>
          <AlertTriangle size={14} color="#BE123C" />
          <Text style={styles.missingReportText} numberOfLines={1}>
            Faltante: {missingReport.note}
          </Text>
        </View>
      ) : null}

      {/* 3. Cliente y Dirección Compacta */}
      <View style={styles.clientAddressRow}>
        <View style={styles.infoCol}>
          <Text style={styles.clientName} numberOfLines={1}>
            {client?.name || 'Cliente sin nombre'}
            {client?.companyName ? ` (${client.companyName})` : ''}
          </Text>

          <View style={styles.addressInline}>
            <MapPin
              size={13}
              color={isPickup ? '#B45309' : THEME.colors.brandRed}
              style={{ marginTop: 2, marginRight: 4 }}
            />
            <Text
              style={[
                styles.addressText,
                isPickup && { color: '#B45309', fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {shortAddress}
            </Text>
          </View>
        </View>

        {/* Accesos rápidos de llamada o mapa si no es recoger */}
        <View style={styles.quickAccessIcons}>
          {client?.phone ? (
            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.7}
              style={styles.circleIconBtn}
              accessibilityLabel="Llamar"
            >
              <Phone size={14} color={THEME.colors.brandRed} />
            </TouchableOpacity>
          ) : null}

          {!isPickup ? (
            <TouchableOpacity
              onPress={handleOpenMap}
              activeOpacity={0.7}
              style={[styles.circleIconBtn, styles.circleIconBtnSlate]}
              accessibilityLabel="Abrir mapa"
            >
              <Navigation size={14} color={THEME.colors.slate700} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 4. Chips informativos de pago y contenido del paquete */}
      <View style={styles.chipsRow}>
        {/* Método de pago */}
        {payment?.method === PAYMENT_METHODS.EFECTIVO ? (
          <View style={styles.chipCash}>
            <Banknote size={12} color="#166534" />
            <Text style={styles.chipCashText}>
              Efectivo{payment?.change ? ` (Llevar cambio $${payment.change})` : ''}
            </Text>
          </View>
        ) : (
          <View style={[
            styles.chipTransfer,
            payment?.transferStatus === 'aceptada' ? styles.chipTransferOk : styles.chipTransferPending,
          ]}>
            <CreditCard
              size={12}
              color={payment?.transferStatus === 'aceptada' ? '#166534' : '#92400E'}
            />
            <Text style={[
              styles.chipTransferText,
              { color: payment?.transferStatus === 'aceptada' ? '#166534' : '#92400E' },
            ]}>
              {payment?.transferStatus === 'aceptada' ? 'Transf. Aceptada' : 'Transf. Pendiente'}
            </Text>
          </View>
        )}

        {/* Resumen de paquete */}
        <View style={styles.chipPackage}>
          <Package size={12} color={THEME.colors.slate600} />
          <Text style={styles.chipPackageText} numberOfLines={1}>
            {itemsSummary}
          </Text>
        </View>
      </View>

      {/* 5. Fila de acciones final */}
      <View style={styles.footerRow}>
        <View style={styles.detailLink}>
          <Text style={styles.detailLinkText}>Ver detalle</Text>
          <ChevronRight size={13} color={THEME.colors.slate500} />
        </View>

        {isLocked ? (
          <View style={styles.lockedBadge}>
            <Lock size={12} color={THEME.colors.slate500} />
            <Text style={styles.lockedBadgeText}>{statusCfg.label}</Text>
          </View>
        ) : (
          <View style={styles.actionButtonsContainer}>
            {onReportMissing && (
              <TouchableOpacity
                onPress={() => onReportMissing(order)}
                activeOpacity={0.7}
                style={styles.missingBtn}
              >
                <AlertTriangle size={12} color="#BE123C" />
                <Text style={styles.missingBtnText}>Falta algo</Text>
              </TouchableOpacity>
            )}

            {status === ORDER_STATUS.ASSIGNED ||
            status === ORDER_STATUS.READY ||
            status === ORDER_STATUS.MISSING_ITEMS ? (
              <Button
                title="Iniciar Ruta"
                variant="primary"
                size="sm"
                icon={Truck}
                isLoading={isUpdating}
                onPress={() => onStatusChange(id, ORDER_STATUS.ON_THE_WAY)}
                style={styles.statusActionBtn}
              />
            ) : status === ORDER_STATUS.ON_THE_WAY ? (
              <Button
                title="Entregado"
                variant="success"
                size="sm"
                icon={CheckCircle2}
                isLoading={isUpdating}
                onPress={() => onStatusChange(id, ORDER_STATUS.DELIVERED)}
                style={styles.statusActionBtn}
              />
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContainerAlert: {
    borderColor: '#FDA4AF',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate100,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  companyBadge: {
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: THEME.borderRadius.sm,
  },
  companyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTotalAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: THEME.colors.brandRed,
  },
  missingReportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFE4E6',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    borderRadius: THEME.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  missingReportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#881337',
    flex: 1,
  },
  clientAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.slate900,
    lineHeight: 18,
  },
  addressInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: THEME.colors.slate600,
    fontWeight: '500',
    flex: 1,
  },
  quickAccessIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  circleIconBtn: {
    width: 32,
    height: 32,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.brandRedLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.2)',
  },
  circleIconBtnSlate: {
    backgroundColor: THEME.colors.slate100,
    borderColor: THEME.colors.slate200,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
  },
  chipCash: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  chipCashText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  chipTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
  },
  chipTransferOk: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  chipTransferPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  chipTransferText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chipPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
    maxWidth: '55%',
  },
  chipPackageText: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.colors.slate700,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate100,
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.slate500,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.slate100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.slate500,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  missingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: THEME.borderRadius.sm,
  },
  missingBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#BE123C',
  },
  statusActionBtn: {
    minWidth: 105,
    paddingVertical: 6,
  },
});
