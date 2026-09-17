/**
 * @module AdminDashboard
 * @description Panel de Administración para Tacos "El Tío".
 *              Incluye historial de pedidos con filtros por fecha (Día, Semana, Mes),
 *              métricas, actualización de estatus y visualización de detalles completos.
 */
import { useState, useEffect, useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import Logo from '../components/common/Logo';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import OrderFormModal from '../components/orders/OrderFormModal';
import {
  fetchOrders,
  createOrderRequest,
  updateOrderStatusRequest,
} from '../services/orderService';
import { ORDER_STATUS_LABELS } from '../models/order.model';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState('day'); // 'day' | 'week' | 'month' | 'all'
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Cargar pedidos al cambiar el filtro
  const loadOrders = async (range) => {
    setLoading(true);
    try {
      const data = await fetchOrders(range);
      setOrders(data);
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(dateRange);
  }, [dateRange]);

  // Cambiar estatus de un pedido
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatusRequest(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      alert('Error al actualizar el estado del pedido: ' + err.message);
    }
  };

  // Crear pedido
  const handleCreateOrder = async (orderData) => {
    const newOrder = await createOrderRequest(orderData);
    setOrders((prev) => [newOrder, ...prev]);
  };

  // Métricas dinámicas basadas en los pedidos visibles
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const pendingCount = orders.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion').length;
    const deliveredCount = orders.filter((o) => o.status === 'entregado').length;

    return { totalOrders, totalRevenue, pendingCount, deliveredCount };
  }, [orders]);

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div className="dashboard__header-brand">
          <Logo size="sm" />
          <div>
            <div className="dashboard__header-title">Panel de Administración</div>
            <div className="dashboard__header-subtitle">Tacos "El Tío" — Barbacoa y Menudo</div>
          </div>
        </div>
        <div className="dashboard__header-actions">
          <div className="dashboard__user-info">
            <div className="dashboard__user-name">{user?.name}</div>
            <div className="dashboard__user-role">Administrador</div>
          </div>
          <button className="dashboard__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard__main">
        {/* Barra superior con Filtros y Botón Nuevo Pedido */}
        <div className="toolbar">
          <div className="filter-group">
            <span className="filter-label">Historial por Fecha:</span>
            <button
              className={`filter-btn ${dateRange === 'day' ? 'active' : ''}`}
              onClick={() => setDateRange('day')}
            >
              📅 Hoy (Día)
            </button>
            <button
              className={`filter-btn ${dateRange === 'week' ? 'active' : ''}`}
              onClick={() => setDateRange('week')}
            >
              🗓️ Esta Semana
            </button>
            <button
              className={`filter-btn ${dateRange === 'month' ? 'active' : ''}`}
              onClick={() => setDateRange('month')}
            >
              📆 Este Mes
            </button>
            <button
              className={`filter-btn ${dateRange === 'all' ? 'active' : ''}`}
              onClick={() => setDateRange('all')}
            >
              📂 Todos
            </button>
          </div>

          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            + Agregar Pedido
          </button>
        </div>

        {/* Tarjetas de Métricas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon">📦</div>
            <div className="stat-card__value">{metrics.totalOrders}</div>
            <div className="stat-card__label">Total Pedidos</div>
          </div>
          <div className="stat-card stat-card--accent">
            <div className="stat-card__icon">💰</div>
            <div className="stat-card__value">${metrics.totalRevenue}</div>
            <div className="stat-card__label">Ingresos Generados</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon">⏳</div>
            <div className="stat-card__value">{metrics.pendingCount}</div>
            <div className="stat-card__label">En Proceso</div>
          </div>
          <div className="stat-card stat-card--success">
            <div className="stat-card__icon">✅</div>
            <div className="stat-card__value">{metrics.deliveredCount}</div>
            <div className="stat-card__label">Entregados</div>
          </div>
        </div>

        {/* Tabla de Historial de Pedidos */}
        <div className="panel">
          <div className="panel__header">
            <h3 className="panel__title">📋 Historial de Pedidos</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              Mostrando {orders.length} pedidos
            </span>
          </div>

          {loading ? (
            <div className="loading-screen" style={{ minHeight: '150px', background: 'transparent', color: '#666' }}>
              Cargando historial...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              No hay pedidos registrados en este período.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Teléfono</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const statusInfo = ORDER_STATUS_LABELS[order.status] || ORDER_STATUS_LABELS.pendiente;

                    return (
                      <tr key={order.id}>
                        <td><strong>{order.id}</strong></td>
                        <td>
                          <div><strong>{order.client?.name}</strong></div>
                          {order.client?.companyName && (
                            <small style={{ color: '#666' }}>{order.client.companyName}</small>
                          )}
                        </td>
                        <td>
                          <span className="badge-tag">
                            {order.client?.type === 'empresa' ? '🏢 Empresa' : '🏠 Particular'}
                          </span>
                        </td>
                        <td>{order.client?.phone}</td>
                        <td><strong>${order.pricing?.total}</strong></td>
                        <td>
                          <select
                            className="status-select"
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_preparacion">En Preparación</option>
                            <option value="listo">Listo</option>
                            <option value="en_camino">En Camino</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-action-view"
                            onClick={() => setSelectedOrder(order)}
                          >
                            🔍 Ver Detalles
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal de Nuevo Pedido */}
      {showCreateModal && (
        <OrderFormModal
          onClose={() => setShowCreateModal(false)}
          onSubmitSuccess={handleCreateOrder}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
