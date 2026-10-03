/**
 * @module UserDashboard
 * @description Panel operativo para auxiliares de pedidos.
 *              Cumple estrictamente con las reglas de negocio:
 *              - Solo captura pedidos y monitorea estados.
 *              - NO muestra totales de venta ni métricas financieras.
 *              - Solo muestra los pedidos realizados en el turno/día actual.
 */
import { useState, useEffect } from 'react';
import {
  Plus,
  Package,
  Eye,
  LogOut,
  Building2,
  User,
  Clock,
  Loader2,
  ShieldCheck,
  ClipboardList,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import OrderFormModal from '../components/orders/OrderFormModal';
import {
  fetchOrders,
  createOrderRequest,
  updateOrderStatusRequest,
} from '../services/orderService';
import { ORDER_STATUS_CONFIG } from '../models/order.model';

const UserDashboard = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Carga únicamente pedidos del día / turno actual
  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders('day');
      setOrders(data);
    } catch (err) {
      console.error('Error al cargar pedidos del turno:', err);
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Encabezado */}
      <header className="bg-brand-red text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="hidden sm:block border-l border-white/20 pl-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-yellow block">
                Portal de Auxiliares
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight">
                Tacos &ldquo;El Tío&rdquo; — Barbacoa y Menudo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-xs">
              <span className="font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                {user?.name}
              </span>
              <span className="text-brand-yellow font-medium text-[10px] uppercase tracking-wider">
                Auxiliar de Turno
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              ariaLabel="Cerrar sesión"
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Bienvenida y Acción Principal */}
        <div className="bg-white rounded-xl p-6 shadow-2xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Bienvenido, {user?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Monitorea los pedidos registrados en tu turno y captura nuevas órdenes.
            </p>
          </div>

          <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Capturar Nuevo Pedido</span>
          </Button>
        </div>

        {/* Tabla de Pedidos del Turno (Sin totales de venta) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-brand-red" />
              <span>Pedidos del Turno Actual</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {orders.length} {orders.length === 1 ? 'pedido en este turno' : 'pedidos en este turno'}
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
              <span>Cargando órdenes del turno...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No hay pedidos registrados en este turno. Haz clic en &ldquo;Capturar Nuevo Pedido&rdquo; para registrar uno.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Folio</th>
                    <th className="p-3.5">Hora</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Teléfono</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.map((order) => {
                    const statusConfig =
                      ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pendiente;
                    const orderTime = order.createdAt
                      ? new Date(order.createdAt).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{order.id}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{orderTime}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{order.client?.name}</div>
                          {order.client?.companyName && (
                            <div className="text-[11px] text-slate-500">
                              {order.client.companyName}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {order.client?.type === 'empresa' ? (
                              <>
                                <Building2 className="w-3 h-3 text-slate-500" />
                                <span>Empresa</span>
                              </>
                            ) : (
                              <>
                                <User className="w-3 h-3 text-slate-500" />
                                <span>Particular</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{order.client?.phone}</td>
                        <td className="p-3.5">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 ${statusConfig.badgeClass}`}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="en_preparacion">En Preparación</option>
                            <option value="listo">Listo</option>
                            <option value="en_camino">En Camino</option>
                            <option value="entregado">Entregado</option>
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            <span>Ver Detalle</span>
                          </Button>
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

      {/* Modal de Detalle (Oculta totales financieros para auxiliar) */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          hideFinancials={true}
        />
      )}

      {/* Modal de Captura de Pedido */}
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
