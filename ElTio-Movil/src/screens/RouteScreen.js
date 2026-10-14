/**
 * @module RouteScreen
 * @description Pantalla de ruta optimizada por GPS para repartidores.
 *              Muestra las paradas asignadas ordenadas matemáticamente por el backend
 *              partiendo de la sucursal de Tacos El Tío en San Nicolás de los Garza,
 *              balanceando distancia física, antigüedad/folio (FIFO) y prioridad extrema de faltantes.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Navigation,
  MapPin,
  Clock,
  Phone,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Compass,
  Store,
  ExternalLink,
  ChevronRight,
  X,
  Send,
  Eye,
} from 'lucide-react-native';
import { THEME } from '../config/theme';
import { Header } from '../components/common/Header';
import { Button } from '../components/common/Button';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUS } from '../models/order.model';

export const RouteScreen = () => {
  const { token } = useAuth();

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Modal de detalle de orden
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modal de reporte de faltante
  const [missingModalVisible, setMissingModalVisible] = useState(false);
  const [missingTargetOrder, setMissingTargetOrder] = useState(null);
  const [missingNote, setMissingNote] = useState('');
  const [submittingMissing, setSubmittingMissing] = useState(false);

  // Consulta de la ruta al backend
  const fetchRoute = useCallback(
    async (isPullRefresh = false) => {
      if (!isPullRefresh && !routeData) setLoading(true);
      try {
        const route = await orderService.getDriverRoute(token);
        setRouteData(route);
      } catch (err) {
        if (!isPullRefresh) {
          console.error('[RouteScreen] Error al obtener ruta:', err.message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    fetchRoute();

    // Polling en tiempo real cada 4 segundos para actualizar la ruta ante nuevas asignaciones
    const interval = setInterval(() => {
      fetchRoute(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchRoute]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoute(true);
  };

  // Cambio de estado de un pedido (Iniciar Ruta o Entregado)
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await orderService.updateStatus(token, orderId, newStatus);
      await fetchRoute(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el pedido');
    } finally {
      setUpdatingId(null);
    }
  };

  // Reportar faltante
  const handleOpenReportMissing = (order) => {
    setMissingTargetOrder(order);
    setMissingNote('');
    setMissingModalVisible(true);
  };

  const handleSubmitReportMissing = async () => {
    if (!missingNote.trim()) {
      Alert.alert('Atención', 'Por favor describe qué producto o complemento hace falta');
      return;
    }
    setSubmittingMissing(true);
    try {
      await orderService.reportMissing(token, missingTargetOrder.id, missingNote);
      setMissingModalVisible(false);
      setMissingTargetOrder(null);
      setMissingNote('');
      Alert.alert(
        'Faltante Reportado',
        'El pedido se marcó como Urgente con máxima prioridad de atención.'
      );
      await fetchRoute(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo enviar el reporte');
    } finally {
      setSubmittingMissing(false);
    }
  };

  // Abrir navegación completa de Google Maps
  const handleOpenFullNavigation = () => {
    if (routeData?.googleMapsUrl) {
      Linking.openURL(routeData.googleMapsUrl).catch(() => {
        Alert.alert('Error', 'No se pudo abrir el navegador GPS');
      });
    }
  };

  const stops = routeData?.stops || [];
  const origin = routeData?.origin;

  return (
    <View style={styles.container}>
      <Header />

      {loading && !routeData ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={THEME.colors.brandRed} />
          <Text style={styles.loadingText}>Calculando ruta más eficiente...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.brandRed]}
              tintColor={THEME.colors.brandRed}
            />
          }
        >
          {/* Título de la sección */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Compass size={22} color={THEME.colors.brandRed} />
              <Text style={styles.titleText}>Mi Ruta Optimizada</Text>
            </View>
            <Text style={styles.subtitleText}>
              Paradas ordenadas por distancia física, tiempo de espera y urgencia.
            </Text>
          </View>

          {stops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBadge}>
                <Navigation size={40} color={THEME.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Sin ruta activa</Text>
              <Text style={styles.emptyMessage}>
                Actualmente no tienes pedidos asignados en camino. En cuanto el administrador te asigne pedidos, se generará aquí tu ruta optimizada con navegación GPS paso a paso.
              </Text>
            </View>
          ) : (
            <>
              {/* Tarjeta de Resumen de la Ruta */}
              <View style={styles.summaryCard}>
                <View style={styles.originRow}>
                  <Store size={18} color={THEME.colors.brandYellow} />
                  <View style={styles.originTextContainer}>
                    <Text style={styles.originLabel}>Punto de Salida:</Text>
                    <Text style={styles.originName}>
                      {origin?.name || 'Tacos El Tío (Sucursal San Nicolás)'}
                    </Text>
                  </View>
                </View>

                {/* Métricas clave */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>{routeData.totalOrders}</Text>
                    <Text style={styles.metricLabel}>Entregas</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>{routeData.totalDistanceKm} km</Text>
                    <Text style={styles.metricLabel}>Distancia Total</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.metricItem}>
                    <Text style={styles.metricNumber}>
                      ~{routeData.totalEstimatedDurationMins} min
                    </Text>
                    <Text style={styles.metricLabel}>Tiempo Est.</Text>
                  </View>
                </View>

                {/* Botón Maestro de Navegación GPS */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleOpenFullNavigation}
                  style={styles.fullNavButton}
                >
                  <Navigation size={18} color="#FFFFFF" />
                  <Text style={styles.fullNavButtonText}>
                    Iniciar Navegación Completa en Google Maps
                  </Text>
                  <ExternalLink size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Lista secuencial de paradas */}
              <Text style={styles.sectionHeader}>
                SECUENCIA DE ENTREGAS ({stops.length})
              </Text>

              {stops.map((stop, index) => {
                const isFirst = index === 0;
                const isUrgent = stop.isUrgent;
                const isUpdating = updatingId === stop.orderId;

                return (
                  <View key={stop.orderId} style={styles.stopCardWrapper}>
                    {/* Indicador de Línea Conectora */}
                    <View style={styles.timelineIndicator}>
                      <View
                        style={[
                          styles.stopBadge,
                          isUrgent ? styles.stopBadgeUrgent : styles.stopBadgeNormal,
                        ]}
                      >
                        <Text style={styles.stopBadgeNumber}>{stop.stopNumber}</Text>
                      </View>
                      {index < stops.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    {/* Tarjeta de la Parada */}
                    <View
                      style={[
                        styles.stopCard,
                        isUrgent && styles.stopCardUrgentBorder,
                        isFirst && styles.stopCardFirst,
                      ]}
                    >
                      {/* Cabecera de la Parada */}
                      <View style={styles.stopCardHeader}>
                        <View style={styles.stopFolioContainer}>
                          <Text style={styles.stopFolioText}>{stop.orderId}</Text>
                          {isUrgent && (
                            <View style={styles.urgentPill}>
                              <AlertTriangle size={11} color="#9F1239" />
                              <Text style={styles.urgentPillText}>FALTANTE URGENTE</Text>
                            </View>
                          )}
                          {stop.status === ORDER_STATUS.ON_THE_WAY && (
                            <View style={styles.onTheWayPill}>
                              <Truck size={11} color="#6B21A8" />
                              <Text style={styles.onTheWayPillText}>EN RUTA</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.stopDistancePill}>
                          <Text style={styles.stopDistanceText}>
                            {stop.distanceFromPrevKm} km
                          </Text>
                        </View>
                      </View>

                      {/* Información del Cliente */}
                      <Text style={styles.clientNameText}>{stop.clientName}</Text>

                      <View style={styles.addressContainer}>
                        <MapPin size={15} color={THEME.colors.textMuted} style={styles.pinIcon} />
                        <View style={styles.addressTextWrapper}>
                          <Text style={styles.addressText}>{stop.address}</Text>
                          <Text style={styles.municipioText}>{stop.municipio}, N.L.</Text>
                        </View>
                      </View>

                      {/* Entre calles (si existe) */}
                      {Boolean(stop.crossStreets) && (
                        <View style={styles.crossStreetsContainer}>
                          <Text style={styles.crossStreetsLabel}>Entre Calles:</Text>
                          <Text style={styles.crossStreetsText}>{stop.crossStreets}</Text>
                        </View>
                      )}

                      {/* Referencias de entrega (si existe) */}
                      {Boolean(stop.deliveryReferences) && (
                        <View style={styles.referencesContainer}>
                          <Text style={styles.referencesLabel}>Referencias:</Text>
                          <Text style={styles.referencesText}>{stop.deliveryReferences}</Text>
                        </View>
                      )}

                      {/* Métricas de tiempo de la parada */}
                      <View style={styles.stopMetaRow}>
                        <View style={styles.metaItem}>
                          <Clock size={12} color={THEME.colors.textMuted} />
                          <Text style={styles.metaText}>
                            Esperando: <Text style={{ fontWeight: 'bold' }}>{stop.waitMinutes} min</Text>
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaText}>
                            Llegada est.: <Text style={{ fontWeight: 'bold' }}>~{stop.estimatedArrivalMinsFromNow} min</Text>
                          </Text>
                        </View>
                      </View>

                      {/* Barra de Acciones de la Parada */}
                      <View style={styles.stopActionsRow}>
                        {/* Botón GPS Individual */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => Linking.openURL(stop.navigationUrl)}
                          style={styles.gpsButton}
                        >
                          <Navigation size={13} color="#FFFFFF" />
                          <Text style={styles.gpsButtonText}>GPS Parada</Text>
                        </TouchableOpacity>

                        {/* Botón Llamar */}
                        {Boolean(stop.phone) && (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => Linking.openURL(`tel:${stop.phone}`)}
                            style={styles.phoneButton}
                          >
                            <Phone size={13} color={THEME.colors.textPrimary} />
                            <Text style={styles.phoneButtonText}>Llamar</Text>
                          </TouchableOpacity>
                        )}

                        {/* Botón Ver Detalle */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setSelectedOrder(stop.order)}
                          style={styles.detailButton}
                        >
                          <Eye size={13} color={THEME.colors.textPrimary} />
                        </TouchableOpacity>
                      </View>

                      {/* Botón de cambio de estado operativo */}
                      <View style={styles.statusActionRow}>
                        {stop.status === ORDER_STATUS.ON_THE_WAY ? (
                          <Button
                            title="Marcar como Entregado"
                            variant="success"
                            size="md"
                            icon={CheckCircle2}
                            isLoading={isUpdating}
                            onPress={() => handleStatusChange(stop.orderId, ORDER_STATUS.DELIVERED)}
                            style={styles.actionBtnFull}
                          />
                        ) : (
                          <Button
                            title="Iniciar Ruta a esta Parada"
                            variant="primary"
                            size="md"
                            icon={Truck}
                            isLoading={isUpdating}
                            onPress={() => handleStatusChange(stop.orderId, ORDER_STATUS.ON_THE_WAY)}
                            style={styles.actionBtnFull}
                          />
                        )}

                        {/* Botón Reportar Faltante */}
                        {!isUrgent && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleOpenReportMissing(stop.order)}
                            style={styles.reportMissingTextBtn}
                          >
                            <AlertTriangle size={12} color="#BE123C" />
                            <Text style={styles.reportMissingTextBtnLabel}>Reportar Faltante</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* Modal de Detalle Completo de Pedido */}
      <OrderDetailModal
        order={selectedOrder}
        visible={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onReportMissing={handleOpenReportMissing}
        isUpdating={updatingId === selectedOrder?.id}
      />

      {/* Modal de Reporte de Faltante */}
      <Modal
        visible={missingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMissingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <AlertTriangle size={18} color="#BE123C" />
                <Text style={styles.modalTitle}>Reportar Faltante</Text>
              </View>
              <TouchableOpacity
                onPress={() => setMissingModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={THEME.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Pedido: <Text style={{ fontWeight: 'bold' }}>{missingTargetOrder?.id}</Text>
            </Text>

            <TextInput
              style={styles.modalTextInput}
              placeholder="¿Qué producto o complemento hace falta en este pedido?"
              placeholderTextColor={THEME.colors.textMuted}
              multiline
              numberOfLines={4}
              value={missingNote}
              onChangeText={setMissingNote}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setMissingModalVisible(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitReportMissing}
                disabled={submittingMissing}
                style={[styles.modalSubmitBtn, submittingMissing && { opacity: 0.6 }]}
              >
                {submittingMissing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={15} color="#FFFFFF" />
                    <Text style={styles.modalSubmitBtnText}>Enviar Reporte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.colors.textSecondary,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: THEME.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  emptyContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginTop: 20,
  },
  emptyIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  originRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  originTextContainer: {
    flex: 1,
  },
  originLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.brandYellow,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  originName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  fullNavButton: {
    backgroundColor: THEME.colors.brandRed,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullNavButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  stopCardWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  stopBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stopBadgeNormal: {
    backgroundColor: THEME.colors.brandRed,
  },
  stopBadgeUrgent: {
    backgroundColor: '#BE123C',
  },
  stopBadgeNumber: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 4,
  },
  stopCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stopCardFirst: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  stopCardUrgentBorder: {
    borderColor: '#FDA4AF',
    backgroundColor: '#FFF1F2',
  },
  stopCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stopFolioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stopFolioText: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.textPrimary,
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#9F1239',
  },
  onTheWayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onTheWayPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#6B21A8',
  },
  stopDistancePill: {
    backgroundColor: THEME.colors.surfaceAlt,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stopDistanceText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.textSecondary,
  },
  clientNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pinIcon: {
    marginTop: 2,
    marginRight: 4,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressText: {
    fontSize: 12,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  municipioText: {
    fontSize: 11,
    color: THEME.colors.textMuted,
    fontWeight: '700',
    marginTop: 1,
  },
  crossStreetsContainer: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 6,
    marginBottom: 6,
  },
  crossStreetsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  crossStreetsText: {
    fontSize: 11,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 1,
  },
  referencesContainer: {
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  referencesLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  referencesText: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
    marginTop: 1,
  },
  stopMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  stopActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  gpsButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 6,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.surfaceAlt,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  phoneButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.textPrimary,
  },
  detailButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surfaceAlt,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusActionRow: {
    marginTop: 2,
  },
  actionBtnFull: {
    width: '100%',
  },
  reportMissingTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingVertical: 4,
  },
  reportMissingTextBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE123C',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 12,
  },
  modalTextInput: {
    backgroundColor: THEME.colors.surfaceAlt,
    borderRadius: THEME.borderRadius.md,
    padding: 12,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: THEME.colors.border,
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: THEME.colors.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#BE123C',
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
