/**
 * @module DeliveriesScreen
 * @description Pantalla principal de repartidores con lista de entregas activas,
 *              filtrado por estados (En Ruta, Entregados, Todos), pull-to-refresh
 *              y modal para visualización detallada.
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
} from 'react-native';
import {
  Truck,
  CheckCircle2,
  Package,
  Clock,
  AlertCircle,
  Inbox,
  Filter,
} from 'lucide-react-native';
import { THEME } from '../config/theme';
import { Header } from '../components/common/Header';
import { OrderCard } from '../components/orders/OrderCard';
import { OrderDetailModal } from '../components/orders/OrderDetailModal';
import { orderService } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { ORDER_STATUS } from '../models/order.model';

export const DeliveriesScreen = () => {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filtro de pestaña activa: 'active' | 'delivered' | 'all'
  const [activeTab, setActiveTab] = useState('active');

  // Estado para el modal de detalle y actualización
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

  // Filtrar pedidos según la pestaña seleccionada
  const filteredOrders = useMemo(() => {
    if (activeTab === 'active') {
      return orders.filter(
        (o) =>
          o.status === ORDER_STATUS.ON_THE_WAY ||
          o.status === ORDER_STATUS.READY ||
          o.status === ORDER_STATUS.PREPARING ||
          o.status === ORDER_STATUS.PENDING
      );
    }
    if (activeTab === 'delivered') {
      return orders.filter((o) => o.status === ORDER_STATUS.DELIVERED);
    }
    return orders;
  }, [orders, activeTab]);

  // Contadores para insignias de pestañas
  const counts = useMemo(() => {
    const active = orders.filter(
      (o) =>
        o.status === ORDER_STATUS.ON_THE_WAY ||
        o.status === ORDER_STATUS.READY ||
        o.status === ORDER_STATUS.PREPARING ||
        o.status === ORDER_STATUS.PENDING
    ).length;
    const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    return { active, delivered, total: orders.length };
  }, [orders]);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Inbox size={32} color={THEME.colors.slate400} />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'active'
          ? 'No hay entregas pendientes'
          : activeTab === 'delivered'
          ? 'Sin entregas completadas hoy'
          : 'No se encontraron pedidos'}
      </Text>
      <Text style={styles.emptySubtitle}>
        Desliza hacia abajo para actualizar y comprobar nuevas órdenes
      </Text>
    </View>
  );

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
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            En Ruta / Pendientes
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
          onPress={() => setActiveTab('delivered')}
          style={[styles.tabButton, activeTab === 'delivered' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'delivered' && styles.tabTextActive]}>
            Entregados
          </Text>
          <View
            style={[styles.counterBadge, activeTab === 'delivered' && styles.counterBadgeActive]}
          >
            <Text
              style={[
                styles.counterText,
                activeTab === 'delivered' && styles.counterTextActive,
              ]}
            >
              {counts.delivered}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('all')}
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          activeOpacity={0.7}
        >
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
          isUpdating={updatingOrderId === selectedOrder.id}
        />
      )}
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
});
