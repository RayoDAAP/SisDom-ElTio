/**
 * @module OrderDetailModal
 * @description Modal interactivo para visualizar el contenido completo del pedido
 *              y confirmar la entrega o el inicio de ruta desde el móvil.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import {
  X,
  MapPin,
  Phone,
  Truck,
  CheckCircle2,
  Package,
  FileText,
  CreditCard,
  Banknote,
  UtensilsCrossed,
  Soup,
  Flame,
  Coffee,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';
import { THEME } from '../../config/theme';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ORDER_STATUS_CONFIG, ORDER_STATUS, PAYMENT_METHODS } from '../../models/order.model';

export const OrderDetailModal = ({
  order,
  visible,
  onClose,
  onStatusChange,
  onReportMissing,
  isUpdating = false,
}) => {
  if (!order) return null;

  const { id, client, items, pricing, status, payment, notes, createdAt, missingReport } = order;
  const statusCfg = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG[ORDER_STATUS.PENDING];
  const isLocked = status === ORDER_STATUS.DELIVERED || status === ORDER_STATUS.CANCELLED;
  const fullAddress = `Calle ${client?.street || ''} #${client?.number || ''}, Col. ${client?.colonia || ''}`;

  const handleCall = () => {
    if (client?.phone) Linking.openURL(`tel:${client.phone}`);
  };

  const handleOpenMap = () => {
    const query = encodeURIComponent(`${fullAddress}, Chihuahua`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Barra Superior del Modal */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Detalle de Entrega</Text>
            <Text style={styles.headerTitle}>{id}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color={THEME.colors.slate700} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Estado Actual */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionLabel}>Estado de la Orden</Text>
            <Badge label={statusCfg.label} colors={statusCfg.colors} style={styles.statusBadge} />
          </View>

          {/* Reporte de Faltante si existe */}
          {missingReport ? (
            <View style={styles.missingReportCard}>
              <AlertTriangle size={18} color="#9F1239" />
              <View style={styles.missingReportCardContent}>
                <Text style={styles.missingReportCardTitle}>Faltante Reportado (Urgente):</Text>
                <Text style={styles.missingReportCardText}>{missingReport.note}</Text>
                <Text style={styles.missingReportCardMeta}>
                  Reportado: {new Date(missingReport.reportedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Información del Cliente */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Datos del Cliente</Text>
            <Text style={styles.clientName}>{client?.name || 'Cliente'}</Text>
            {client?.companyName ? (
              <Text style={styles.companyName}>{client.companyName}</Text>
            ) : null}

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity onPress={handleCall} style={styles.callActionButton}>
                <Phone size={14} color={THEME.colors.brandRed} />
                <Text style={styles.actionBtnText}>{client?.phone || 'Llamar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleOpenMap} style={styles.mapActionButton}>
                <MapPin size={14} color={THEME.colors.slate700} />
                <Text style={styles.mapBtnText}>Abrir Mapa</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fullAddressText}>{fullAddress}</Text>
          </View>

          {/* Instrucciones de Entrega */}
          {notes ? (
            <View style={styles.notesCard}>
              <FileText size={16} color="#854D0E" />
              <View style={styles.notesTextContainer}>
                <Text style={styles.notesTitle}>Instrucciones Especiales</Text>
                <Text style={styles.notesBody}>{notes}</Text>
              </View>
            </View>
          ) : null}

          {/* Desglose de Alimentos */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Contenido del Paquete</Text>

            {/* Tacos / Gorditas */}
            {items?.preparedItems && items.preparedItems.length > 0 && (
              <View style={styles.itemCategoryGroup}>
                <View style={styles.categoryHeader}>
                  <UtensilsCrossed size={14} color={THEME.colors.brandRed} />
                  <Text style={styles.categoryHeaderText}>Tacos y Gorditas</Text>
                </View>
                {items.preparedItems.map((pi, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{pi.label}</Text>
                    <Text style={styles.itemPrice}>${pi.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Barbacoa */}
            {items?.barbacoa && items.barbacoa.length > 0 && (
              <View style={styles.itemCategoryGroup}>
                <View style={styles.categoryHeader}>
                  <Flame size={14} color="#D97706" />
                  <Text style={styles.categoryHeaderText}>Barbacoa</Text>
                </View>
                {items.barbacoa.map((b, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{b.label}</Text>
                    <Text style={styles.itemPrice}>${b.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Menudo */}
            {items?.menudo && items.menudo.length > 0 && (
              <View style={styles.itemCategoryGroup}>
                <View style={styles.categoryHeader}>
                  <Soup size={14} color="#DC2626" />
                  <Text style={styles.categoryHeaderText}>Menudo</Text>
                </View>
                {items.menudo.map((m, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{m.label}</Text>
                    <Text style={styles.itemPrice}>${m.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bebidas */}
            {items?.drinks && items.drinks.length > 0 && (
              <View style={styles.itemCategoryGroup}>
                <View style={styles.categoryHeader}>
                  <Coffee size={14} color="#E11D48" />
                  <Text style={styles.categoryHeaderText}>Bebidas</Text>
                </View>
                {items.drinks.map((d, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemLabel}>{d.label || d.name}</Text>
                    <Text style={styles.itemPrice}>${d.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Complementos */}
            {items?.extras && (
              <View style={styles.itemCategoryGroup}>
                <Text style={styles.categoryHeaderText}>Complementos y Extras</Text>
                {items.extras.salsaRed > 0 && (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Salsa Roja ({items.extras.salsaRed} pza)</Text>
                    <Text style={styles.itemPrice}>${items.extras.salsaRed * 4}</Text>
                  </View>
                )}
                {items.extras.salsaGreen > 0 && (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Salsa Verde ({items.extras.salsaGreen} pza)</Text>
                    <Text style={styles.itemPrice}>${items.extras.salsaGreen * 4}</Text>
                  </View>
                )}
                {items.extras.onion > 0 && (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Cebolla ({items.extras.onion} pza)</Text>
                    <Text style={styles.itemPrice}>${items.extras.onion * 4}</Text>
                  </View>
                )}
                {items.extras.tortillas && items.extras.tortillas !== 'none' && (
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>Tortillas ({items.extras.tortillasLabel})</Text>
                    <Text style={styles.itemPrice}>${items.extras.tortillasPrice || 0}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Resumen de Cobro */}
          <View style={styles.paymentCard}>
            <Text style={styles.sectionTitle}>Cobro y Método de Pago</Text>
            <View style={styles.paymentMethodDetails}>
              <Text style={styles.paymentMethodTitle}>
                {payment?.method === PAYMENT_METHODS.EFECTIVO
                  ? 'Pago en Efectivo'
                  : 'Transferencia Bancaria'}
              </Text>

              {payment?.method === PAYMENT_METHODS.EFECTIVO ? (
                <View style={styles.cashDetails}>
                  {payment.amountPaid ? (
                    <Text style={styles.cashDetailText}>
                      Cliente pagará con: ${payment.amountPaid}
                    </Text>
                  ) : null}
                  {payment.change !== null ? (
                    <Text style={styles.changeText}>Cambio a devolver: ${payment.change}</Text>
                  ) : null}
                </View>
              ) : (
                <View style={styles.transferStateContainer}>
                  <View style={[
                    styles.transferStatePill,
                    payment?.transferStatus === 'aceptada'
                      ? styles.transferStateAccepted
                      : styles.transferStatePending
                  ]}>
                    <Text style={[
                      styles.transferStatePillText,
                      payment?.transferStatus === 'aceptada'
                        ? styles.transferStateAcceptedText
                        : styles.transferStatePendingText
                    ]}>
                      {payment?.transferStatus === 'aceptada'
                        ? 'Transferencia: Aceptada ✓'
                        : 'Transferencia: Pendiente de Confirmar ⏳'}
                    </Text>
                  </View>
                  <Text style={styles.transferStateHint}>
                    {payment?.transferStatus === 'aceptada'
                      ? 'Pago validado en sucursal · Entregar pedido al cliente'
                      : 'Aún no validada por caja · No entregar sin confirmación'}
                  </Text>
                  <Text style={styles.transferStateSync}>Solo lectura · Sincronizado en tiempo real</Text>
                </View>
              )}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.finalTotalLabel}>TOTAL A COBRAR:</Text>
              <Text style={styles.finalTotalAmount}>${pricing?.total || 0}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Acciones Inferiores del Modal */}
        <View style={styles.footer}>
          {!isLocked ? (
            <View style={styles.footerActionsContainer}>
              {onReportMissing && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onReportMissing(order);
                  }}
                  activeOpacity={0.7}
                  style={styles.modalReportMissingBtn}
                >
                  <AlertTriangle size={14} color="#9F1239" />
                  <Text style={styles.modalReportMissingBtnText}>Reportar Faltante</Text>
                </TouchableOpacity>
              )}

              {status === ORDER_STATUS.ON_THE_WAY ? (
                <Button
                  title="Marcar como Entregado"
                  variant="success"
                  size="lg"
                  icon={CheckCircle2}
                  isLoading={isUpdating}
                  onPress={() => {
                    onStatusChange(id, ORDER_STATUS.DELIVERED);
                    onClose();
                  }}
                  style={styles.modalActionButton}
                />
              ) : (
                <Button
                  title="Iniciar Ruta de Entrega"
                  variant="primary"
                  size="lg"
                  icon={Truck}
                  isLoading={isUpdating}
                  onPress={() => {
                    onStatusChange(id, ORDER_STATUS.ON_THE_WAY);
                    onClose();
                  }}
                  style={styles.modalActionButton}
                />
              )}
            </View>
          ) : (
            <View style={styles.modalLockedContainer}>
              <Lock size={14} color={THEME.colors.slate500} />
              <Text style={styles.modalLockedText}>
                Pedido finalizado ({statusCfg.label}) — Estado bloqueado
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.slate100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate200,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.brandRed,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: THEME.colors.white,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate600,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  companyName: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.slate500,
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  callActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.brandRedLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(204, 0, 0, 0.2)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.brandRed,
  },
  mapActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: THEME.colors.slate100,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
  },
  mapBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate700,
  },
  fullAddressText: {
    fontSize: 13,
    color: THEME.colors.slate700,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: THEME.colors.brandYellowLight,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.brandYellow,
    marginBottom: THEME.spacing.md,
  },
  notesTextContainer: {
    flex: 1,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#854D0E',
    textTransform: 'uppercase',
  },
  notesBody: {
    fontSize: 13,
    color: '#713F12',
    fontWeight: '600',
    marginTop: 2,
  },
  itemCategoryGroup: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate100,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  categoryHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.slate700,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: THEME.colors.slate800,
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate900,
  },
  paymentCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  paymentMethodDetails: {
    backgroundColor: THEME.colors.slate50,
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    marginBottom: 12,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.slate900,
  },
  cashDetails: {
    marginTop: 4,
  },
  cashDetailText: {
    fontSize: 12,
    color: THEME.colors.slate700,
    fontWeight: '600',
  },
  changeText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '800',
    marginTop: 2,
  },
  transferStateText: {
    fontSize: 12,
    color: THEME.colors.slate600,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate200,
  },
  finalTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.slate700,
  },
  finalTotalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: THEME.colors.brandRed,
  },
  footer: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.white,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate200,
  },
  fullWidthButton: {
    width: '100%',
  },
  missingReportCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFE4E6',
    borderWidth: 1.5,
    borderColor: '#FDA4AF',
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    marginBottom: THEME.spacing.md,
  },
  missingReportCardContent: {
    flex: 1,
    marginLeft: 10,
  },
  missingReportCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9F1239',
    textTransform: 'uppercase',
  },
  missingReportCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#881337',
    marginTop: 2,
  },
  missingReportCardMeta: {
    fontSize: 10,
    color: '#BE123C',
    marginTop: 4,
    fontWeight: '500',
  },
  transferStateContainer: {
    marginTop: 6,
  },
  transferStatePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    marginBottom: 4,
  },
  transferStateAccepted: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  transferStatePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  transferStatePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  transferStateAcceptedText: {
    color: '#166534',
  },
  transferStatePendingText: {
    color: '#92400E',
  },
  transferStateHint: {
    fontSize: 11,
    color: THEME.colors.slate700,
    fontWeight: '600',
    marginTop: 2,
  },
  transferStateSync: {
    fontSize: 9,
    color: THEME.colors.slate400,
    marginTop: 2,
    fontStyle: 'italic',
  },
  footerActionsContainer: {
    gap: 8,
  },
  modalReportMissingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
  },
  modalReportMissingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9F1239',
  },
  modalActionButton: {
    width: '100%',
  },
  modalLockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.slate100,
    paddingVertical: 12,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.slate200,
  },
  modalLockedText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.slate500,
  },
});
