/**
 * @module DeliveriesScreen
 * @description Pantalla principal de repartidores. Muestra únicamente los pedidos
 *              asignados al repartidor autenticado (filtrado en el backend por rol).
 *              Separación clara entre pedidos activos (pendiente, en_preparacion, listo, en_camino)
 *              y completados (entregado, cancelado) para evitar saturar la vista de trabajo.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import {
  Truck,
  CheckCircle2,
  Package,
  AlertCircle,
  Inbox,
  ClipboardList,
  AlertTriangle,
  X,
  Send,
} from 'lucide-react-native';
import { THEME } from '../config/theme';
import { Header } from '../components/common/Header';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUS } from '../models/order.model';

// Agrupa los estados de pedido en dos categorías: activo vs. completado
const ACTIVE_STATUSES = new Set([
  ORDER_STATUS.MISSING_ITEMS,
  ORDER_STATUS.READY,
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.ON_THE_WAY,
]);

const COMPLETED_STATUSES = new Set([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
]);

export const DeliveriesScreen = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtro de pestaña activa: 'active' | 'completed' | 'all'
  const [activeTab, setActiveTab] = useState('active');

  // Estado para el modal de detalle y actualización
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Estado para modal de reporte de producto faltante
  const [missingModalVisible, setMissingModalVisible] = useState(false);
  const [missingTargetOrder, setMissingTargetOrder] = useState(null);
  const [missingNote, setMissingNote] = useState('');
  const [submittingMissing, setSubmittingMissing] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (!token) return;
    try {
      setErrorMsg('');
      const data = await orderService.getDeliveries(token, 'all');
      setOrders(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar las entregas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Polling en segundo plano cada 3.5 segundos para reflejar actualizaciones de caja (transferencias aceptadas) en tiempo real
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      orderService
        .getDeliveries(token, 'all')
        .then((data) => setOrders(data))
        .catch(() => {});
    }, 3500);
    return () => clearInterval(interval);
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliveries();
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const updated = await orderService.updateStatus(token, orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado de la entrega');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleOpenReportMissing = (order) => {
    setMissingTargetOrder(order);
    setMissingNote('');
    setMissingModalVisible(true);
  };

  const handleSubmitReportMissing = async () => {
    if (!missingNote.trim()) {
      Alert.alert('Aviso', 'Por favor describe qué producto o complemento hace falta.');
      return;
    }
    setSubmittingMissing(true);
    try {
      const updated = await orderService.reportMissing(
        token,
        missingTargetOrder.id,
        missingNote.trim()
      );
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
      setMissingModalVisible(false);
      Alert.alert(
        'Faltante Reportado',
        'El pedido fue puesto en estatus de máxima prioridad para atención en cocina.'
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo enviar el reporte');
    } finally {
      setSubmittingMissing(false);
    }
  };

  // Filtrar pedidos según la pestaña seleccionada
  const filteredOrders = useMemo(() => {
    if (activeTab === 'active') {
      return orders.filter((o) => ACTIVE_STATUSES.has(o.status));
    }
    if (activeTab === 'completed') {
      return orders.filter((o) => COMPLETED_STATUSES.has(o.status));
    }
    return orders;
  }, [orders, activeTab]);

  // Contadores para insignias de pestañas
  const counts = useMemo(() => {
    const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status)).length;
    const completed = orders.filter((o) => COMPLETED_STATUSES.has(o.status)).length;
    return { active, completed, total: orders.length };
  }, [orders]);

  const emptyMessages = {
    active: { title: 'Sin entregas activas', sub: 'Desliza hacia abajo para buscar nuevas órdenes asignadas' },
    completed: { title: 'Sin entregas completadas', sub: 'Las órdenes finalizadas o canceladas aparecerán aquí' },
    all: { title: 'Sin pedidos', sub: 'Desliza hacia abajo para actualizar' },
  };

  const renderEmptyState = () => {
    const msg = emptyMessages[activeTab];
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Inbox size={32} color={THEME.colors.slate400} />
        </View>
        <Text style={styles.emptyTitle}>{msg.title}</Text>
        <Text style={styles.emptySubtitle}>{msg.sub}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Encabezado Principal */}
      <Header />

      {/* Pestañas de Filtro */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          style={[styles.tabButton, activeTab === 'active' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <Truck size={13} color={activeTab === 'active' ? THEME.colors.white : THEME.colors.slate600} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            En Ruta
          </Text>
          <View
            style={[styles.counterBadge, activeTab === 'active' && styles.counterBadgeActive]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'active' && styles.counterTextActive,
              ]}
            >
              {counts.active}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('completed')}
          style={[styles.tabButton, activeTab === 'completed' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <CheckCircle2 size={13} color={activeTab === 'completed' ? THEME.colors.white : THEME.colors.slate600} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completados
          </Text>
          <View
            style={[styles.counterBadge, activeTab === 'completed' && styles.counterBadgeActive]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'completed' && styles.counterTextActive,
              ]}
            >
              {counts.completed}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('all')}
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <ClipboardList size={13} color={activeTab === 'all' ? THEME.colors.white : THEME.colors.slate600} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {errorMsg ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color={THEME.colors.error} />
          <Text style={styles.errorBannerText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Contenido Principal / Lista de Entregas */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.brandRed} />
          <Text style={styles.loadingText}>Cargando pedidos de entrega...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onStatusChange={handleStatusChange}
              onViewDetail={(ord) => setSelectedOrder(ord)}
              onReportMissing={handleOpenReportMissing}
              isUpdating={updatingOrderId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[THEME.colors.brandRed]}
              tintColor={THEME.colors.brandRed}
            />
          }
        />
      )}

      {/* Modal de Detalle Completo de Pedido */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          visible={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onReportMissing={handleOpenReportMissing}
          isUpdating={updatingOrderId === selectedOrder.id}
        />
      )}

      {/* Modal Interactivo para Reportar Faltante en Pedido */}
      <Modal
        visible={missingModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !submittingMissing && setMissingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.missingModalContent}>
            <View style={styles.missingModalHeader}>
              <View style={styles.missingModalTitleRow}>
                <AlertTriangle size={20} color="#BE123C" />
                <Text style={styles.missingModalTitle}>Reportar Faltante</Text>
              </View>
              <TouchableOpacity
                onPress={() => !submittingMissing && setMissingModalVisible(false)}
                disabled={submittingMissing}
                style={styles.missingModalCloseBtn}
              >
                <X size={18} color={THEME.colors.slate600} />
              </TouchableOpacity>
            </View>

            <View style={styles.missingModalBody}>
              <Text style={styles.missingOrderInfo}>
                Pedido: <Text style={{ fontWeight: '800' }}>{missingTargetOrder?.id}</Text> — {missingTargetOrder?.client?.name}
              </Text>
              <View style={styles.missingAlertHint}>
                <Text style={styles.missingAlertHintText}>
                  Este reporte pondrá la orden con Máxima Prioridad en el panel web de cocina para atención inmediata.
                </Text>
              </View>

              <Text style={styles.inputLabel}>¿Qué producto o complemento hace falta?</Text>
              <TextInput
                style={styles.missingTextInput}
                placeholder="Ej. Faltan 2 tacos de barbacoa, falta la salsa verde y el refresco..."
                placeholderTextColor={THEME.colors.slate400}
                value={missingNote}
                onChangeText={setMissingNote}
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                editable={!submittingMissing}
              />
            </View>

            <View style={styles.missingModalFooter}>
              <TouchableOpacity
                onPress={() => setMissingModalVisible(false)}
                disabled={submittingMissing}
                style={styles.missingCancelBtn}
              >
                <Text style={styles.missingCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitReportMissing}
                disabled={submittingMissing}
                style={[styles.missingSubmitBtn, submittingMissing && { opacity: 0.6 }]}
              >
                {submittingMissing ? (
                  <ActivityIndicator size="small" color={THEME.colors.white} />
                ) : (
                  <>
                    <Send size={14} color={THEME.colors.white} />
                    <Text style={styles.missingSubmitBtnText}>Enviar Reporte</Text>
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
    backgroundColor: THEME.colors.slate100,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.white,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.slate200,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
    marginRight: 6,
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.brandRed,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  tabTextActive: {
    color: THEME.colors.white,
  },
  counterBadge: {
    backgroundColor: THEME.colors.slate200,
    borderRadius: THEME.borderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6,
  },
  counterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  counterText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.slate700,
  },
  counterTextActive: {
    color: THEME.colors.white,
  },
  listContent: {
    padding: THEME.spacing.md,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.slate500,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.slate800,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.slate400,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.colors.errorBg,
    padding: 10,
    marginHorizontal: THEME.spacing.md,
    marginTop: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.error,
  },
  errorBannerText: {
    fontSize: 12,
    color: THEME.colors.error,
    fontWeight: '600',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  missingModalContent: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDA4AF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  missingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF1F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FDA4AF',
  },
  missingModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  missingModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9F1239',
  },
  missingModalCloseBtn: {
    padding: 4,
  },
  missingModalBody: {
    padding: 16,
  },
  missingOrderInfo: {
    fontSize: 13,
    color: THEME.colors.slate700,
    marginBottom: 8,
  },
  missingAlertHint: {
    backgroundColor: '#FFE4E6',
    padding: 10,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDA4AF',
    marginBottom: 12,
  },
  missingAlertHintText: {
    fontSize: 11,
    color: '#881337',
    fontWeight: '600',
    lineHeight: 15,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate800,
    marginBottom: 6,
  },
  missingTextInput: {
    backgroundColor: THEME.colors.slate50,
    borderWidth: 1,
    borderColor: THEME.colors.slate300,
    borderRadius: THEME.borderRadius.md,
    padding: 10,
    fontSize: 13,
    color: THEME.colors.slate900,
    minHeight: 80,
  },
  missingModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: THEME.colors.slate50,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.slate200,
  },
  missingCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.md,
  },
  missingCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.slate600,
  },
  missingSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BE123C',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: THEME.borderRadius.md,
  },
  missingSubmitBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.white,
  },
});
