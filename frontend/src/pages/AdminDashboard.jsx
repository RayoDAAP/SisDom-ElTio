/**
 * @module AdminDashboard
 * @description Panel de administración para gestión de pedidos, filtros de tiempo e indicadores.
 *              Construido bajo estándar de ingeniería Senior con Tailwind CSS y Lucide React.
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Package,
  DollarSign,
  Clock,
  CheckCircle2,
  Plus,
  LogOut,
  Eye,
  Building2,
  User,
  Calendar,
  Filter,
  Loader2,
  ShieldCheck,
  Search,
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState('day'); // 'day' | 'week' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadOrders = async (range) => {
    setLoading(true);
    try {
      const data = await fetchOrders(range);
      setOrders(data);
    } catch (err) {
      console.error('Error al cargar órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(dateRange);
  }, [dateRange]);

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

  // Filtrado secundario por término de búsqueda (Folio, Cliente o Empresa)
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        o.client?.name?.toLowerCase().includes(query) ||
        o.client?.companyName?.toLowerCase().includes(query) ||
        o.client?.phone?.includes(query)
    );
  }, [orders, searchQuery]);

  // Métricas calculadas dinámicamente
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const pendingCount = filteredOrders.filter((o) => o.status === 'pendiente' || o.status === 'en_preparacion').length;
    const deliveredCount = filteredOrders.filter((o) => o.status === 'entregado').length;

    return { totalOrders, totalRevenue, pendingCount, deliveredCount };
  }, [filteredOrders]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Barra de Navegación Principal */}
      <header className="bg-brand-red text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="hidden sm:block border-l border-white/20 pl-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-yellow block">
                Módulo Administrativo
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
                Administrador
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
        {/* Barra de Filtros y Acción */}
        <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Período:</span>
            </span>
            {[
              { id: 'day', label: 'Hoy (Día)' },
              { id: 'week', label: 'Esta Semana' },
              { id: 'month', label: 'Este Mes' },
              { id: 'all', label: 'Todos' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                  dateRange === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar folio, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              />
            </div>

            <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Nuevo Pedido</span>
            </Button>
          </div>
        </div>

        {/* Tarjetas de Indicadores */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Órdenes</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{metrics.totalOrders}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Ingresos Venta</span>
              <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">${metrics.totalRevenue}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">En Proceso</span>
              <span className="text-2xl font-extrabold text-amber-600 mt-1 block">{metrics.pendingCount}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Entregados</span>
              <span className="text-2xl font-extrabold text-green-600 mt-1 block">{metrics.deliveredCount}</span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tabla de Historial */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-red" />
              <span>Historial de Pedidos</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
            </span>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs">
              <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
              <span>Cargando historial de pedidos...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No se encontraron pedidos en el período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Folio</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Teléfono</th>
                    <th className="p-3.5">Total</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.map((order) => {
                    const statusConfig = ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.pendiente;

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{order.id}</td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-900">{order.client?.name}</div>
                          {order.client?.companyName && (
                            <div className="text-[11px] text-slate-500">{order.client.companyName}</div>
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
                        <td className="p-3.5 font-extrabold text-slate-900">${order.pricing?.total}</td>
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
                            <span>Detalles</span>
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

      {/* Modal de Detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal de Registro de Pedido */}
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
