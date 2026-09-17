/**
 * @module UserDashboard
 * @description Panel para Cuentas Auxiliares / Trabajadores.
 *              Permite capturar pedidos rápidamente y gestionar los pedidos activos del día.
 */
import { useState, useEffect } from 'react';
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

const UserDashboard = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders('day'); // Carga pedidos del día para trabajadores
      setOrders(data);
    } catch (err) {
      console.error('Error al cargar pedidos del día:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

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
      alert('Error al actualizar el estado: ' + err.message);
    }
  };

  const handleCreateOrder = async (orderData) => {
    const newOrder = await createOrderRequest(orderData);
    setOrders((prev) => [newOrder, ...prev]);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div className="dashboard__header-brand">
          <Logo size="sm" />
          <div>
            <div className="dashboard__header-title">Portal de Trabajadores</div>
            <div className="dashboard__header-subtitle">Tacos "El Tío" — Barbacoa y Menudo</div>
          </div>
        </div>
        <div className="dashboard__header-actions">
          <div className="dashboard__user-info">
            <div className="dashboard__user-name">{user?.name}</div>
            <div className="dashboard__user-role">Auxiliar de Pedidos</div>
          </div>
          <button className="dashboard__logout" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="dashboard__main">
        {/* Banner de Bienvenida y Acción Principal */}
        <div className="toolbar">
          <div>
            <h2 className="dashboard__welcome" style={{ margin: 0 }}>
              ¡Hola, {user?.name?.split(' ')[0]}! 🌮
            </h2>
            <p className="dashboard__sub" style={{ margin: 0 }}>
              Captura nuevos pedidos de clientes o consulta las órdenes de hoy.
            </p>
          </div>

          <button className="btn btn--primary" onClick={() => setShowCreateModal(true)}>
            + Capturar Nuevo Pedido
          </button>
        </div>

        {/* Tabla de Pedidos del Día */}
        <div className="panel">
          <div className="panel__header">
            <h3 className="panel__title">📦 Pedidos del Día</h3>
            <span className="text-muted" style={{ fontSize: '0.85rem' }}>
              {orders.length} pedidos hoy
            </span>
          </div>

          {loading ? (
            <div className="loading-screen" style={{ minHeight: '150px', background: 'transparent', color: '#666' }}>
              Cargando pedidos...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              No hay pedidos registrados hoy. ¡Haz clic en "+ Capturar Nuevo Pedido" para comenzar!
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

export default UserDashboard;
