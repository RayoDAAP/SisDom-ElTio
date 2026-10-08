/**
 * @module AdminDashboard
 * @description Panel principal de administración con navegación por pestañas:
 *              1. Pedidos: Gestión de órdenes, filtros de tiempo, estados y búsqueda.
 *              2. Métricas y Analítica: BI con comparativas, KPIs, productos líderes y categorías.
 *              3. Cuentas: Gestión de personal con roles (Admin, Auxiliar, Repartidor), claves y estados.
 *              Construido bajo estándar Senior con Tailwind CSS y Lucide React.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
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
  BarChart3,
  Users,
  Truck,
  UserCheck,
  AlertTriangle,
  Lock,
  CreditCard,
  Banknote,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import OrderFormModal from '../components/orders/OrderFormModal';
import AnalyticsView from '../components/admin/AnalyticsView';
import AccountsView from '../components/admin/AccountsView';
import {
  fetchOrders,
  createOrderRequest,
  updateOrderStatusRequest,
  assignOrderRequest,
  updatePaymentStatusRequest,
} from '../services/orderService';
import { fetchActiveDrivers } from '../services/userService';
import { ORDER_STATUS_CONFIG } from '../models/order.model';

const AdminDashboard = () => {
  const { user, logout } = useAuth();

  // Pestaña activa: 'orders' | 'analytics' | 'accounts'
  const [activeTab, setActiveTab] = useState('orders');

  const [orders, setOrders] = useState([]);
  const [dateRange, setDateRange] = useState('day'); // 'day' | 'week' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Repartidores activos para el selector de asignación
  const [activeDrivers, setActiveDrivers] = useState([]);
  // ID del pedido que está siendo asignado (para deshabilitar el select mientras carga)
  const [assigningOrderId, setAssigningOrderId] = useState(null);

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

  const loadDrivers = useCallback(async () => {
    try {
      const drivers = await fetchActiveDrivers();
      setActiveDrivers(drivers);
    } catch {
      // No crítico — si falla, el select de asignación no tendrá opciones
    }
  }, []);

  useEffect(() => {
    loadOrders(dateRange);
  }, [dateRange]);

  // Polling automático en tiempo real cada 4 segundos para sincronización instantánea
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(dateRange)
        .then((data) => setOrders(data))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [dateRange]);

  // Cargar repartidores activos al montar y cuando se cambia a la pestaña de pedidos
  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

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

  const handleAssignDriver = async (orderId, driverIdStr) => {
    // El valor del select llega como string; null string indica "sin asignar"
    const driverId = driverIdStr === '' ? null : Number(driverIdStr);
    setAssigningOrderId(orderId);
    try {
      const updated = await assignOrderRequest(orderId, driverId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: updated.status,
                assignedTo: updated.assignedTo,
                assignedToName: updated.assignedToName,
                assignedAt: updated.assignedAt,
              }
            : o
        )
      );
    } catch (err) {
      alert('Error al asignar repartidor: ' + err.message);
    } finally {
      setAssigningOrderId(null);
    }
  };

  const handlePaymentStatusChange = async (orderId, newStatus) => {
    try {
      const updated = await updatePaymentStatusRequest(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, payment: updated.payment } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, payment: updated.payment }));
      }
    } catch (err) {
      alert('Error al actualizar estado de transferencia: ' + err.message);
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

  // Métricas calculadas para la barra de resumen en la vista de pedidos
  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const missingCount = filteredOrders.filter((o) => o.status === 'incompleto').length;
    const deliveredCount = filteredOrders.filter((o) => o.status === 'entregado').length;
    const pendingCount = filteredOrders.filter(
      (o) =>
        o.status === 'pendiente' ||
        o.status === 'listo' ||
        o.status === 'asignado' ||
        o.status === 'en_camino'
    ).length;

    return { totalOrders, totalRevenue, missingCount, pendingCount, deliveredCount };
  }, [filteredOrders]);

  // Agrupación de pedidos por bloques de estatus
  const statusBlocks = useMemo(() => {
    return [
      {
        id: 'incompleto',
        title: 'Reportes de Faltante / Urgentes',
        subtitle: 'Máxima prioridad — el repartidor reportó que falta un producto o complemento',
        orders: filteredOrders.filter((o) => o.status === 'incompleto'),
        badgeClass: 'bg-rose-600 text-white',
        borderClass: 'border-rose-300 bg-rose-50/20',
        headerBg: 'bg-rose-50 text-rose-950 border-rose-200',
        icon: AlertTriangle,
        urgent: true,
      },
      {
        id: 'listo',
        title: 'Listos para Entrega / Despacho',
        subtitle: 'Preparados y empacados en sucursal (priorizados del más antiguo al más reciente)',
        orders: filteredOrders.filter((o) => o.status === 'listo'),
        badgeClass: 'bg-emerald-600 text-white',
        borderClass: 'border-emerald-200 bg-white',
        headerBg: 'bg-emerald-50 text-emerald-950 border-emerald-200',
        icon: CheckCircle2,
      },
      {
        id: 'asignado',
        title: 'Asignados a Repartidor',
        subtitle: 'Asignados a un chofer, listos para salir a ruta',
        orders: filteredOrders.filter((o) => o.status === 'asignado'),
        badgeClass: 'bg-blue-600 text-white',
        borderClass: 'border-blue-200 bg-white',
        headerBg: 'bg-blue-50 text-blue-950 border-blue-200',
        icon: UserCheck,
      },
      {
        id: 'en_camino',
        title: 'En Camino / En Ruta',
        subtitle: 'El chofer va en trayecto hacia el domicilio del cliente',
        orders: filteredOrders.filter((o) => o.status === 'en_camino'),
        badgeClass: 'bg-purple-600 text-white',
        borderClass: 'border-purple-200 bg-white',
        headerBg: 'bg-purple-50 text-purple-950 border-purple-200',
        icon: Truck,
      },
      {
        id: 'finalizados',
        title: 'Finalizados (Entregados y Cancelados)',
        subtitle: 'Pedidos completados o cancelados (estado bloqueado permanentemente)',
        orders: filteredOrders.filter((o) => o.status === 'entregado' || o.status === 'cancelado'),
        badgeClass: 'bg-slate-600 text-white',
        borderClass: 'border-slate-200 bg-white',
        headerBg: 'bg-slate-100 text-slate-800 border-slate-200',
        icon: Package,
      },
    ];
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

        {/* Pestañas de Navegación del Panel de Administración */}
        <div className="bg-red-800/60 border-t border-red-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'orders'
                  ? 'border-brand-yellow text-brand-yellow bg-white/10'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pedidos</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-brand-yellow text-brand-yellow bg-white/10'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Métricas y Analítica</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
                activeTab === 'accounts'
                  ? 'border-brand-yellow text-brand-yellow bg-white/10'
                  : 'border-transparent text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Cuentas</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* VISTA 1: PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Barra de Filtros y Acción */}
            <div className="bg-white rounded-xl p-4 shadow-2xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                  <Filter className="w-3.5 h-3.5 text-brand-red" />
                  <span>Período:</span>
                </span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setDateRange('day')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dateRange === 'day'
                        ? 'bg-brand-red text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setDateRange('week')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dateRange === 'week'
                        ? 'bg-brand-red text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setDateRange('month')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dateRange === 'month'
                        ? 'bg-brand-red text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mes
                  </button>
                  <button
                    onClick={() => setDateRange('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      dateRange === 'all'
                        ? 'bg-brand-red text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Todos
                  </button>
                </div>
              </div>

              {/* Búsqueda y Botón de Creación */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar folio, cliente, empresa..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                  />
                </div>

                <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Nuevo Pedido</span>
                </Button>
              </div>
            </div>

            {/* Tarjetas de Indicadores Operativos Rápidos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Ventas del Período
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    ${metrics.totalRevenue}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-50 text-brand-red flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Total Pedidos
                  </span>
                  <span className="text-2xl font-black text-slate-900 mt-1 block">
                    {metrics.totalOrders}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              {/* Tarjeta de Faltantes Urgentes */}
              <div className={`p-5 rounded-xl border shadow-2xs flex items-center justify-between ${
                metrics.missingCount > 0 ? 'bg-rose-50 border-rose-300' : 'bg-white border-slate-200/80'
              }`}>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Faltantes (Urgentes)
                  </span>
                  <span className={`text-2xl font-black mt-1 block ${
                    metrics.missingCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
                  }`}>
                    {metrics.missingCount}
                  </span>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  metrics.missingCount > 0 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                    Entregados
                  </span>
                  <span className="text-2xl font-black text-emerald-600 mt-1 block">
                    {metrics.deliveredCount}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* SEPARACIÓN DE PEDIDOS POR BLOQUES DE STATUS */}
            {loading ? (
              <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center text-slate-400 gap-2 text-xs border border-slate-200/80">
                <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                <span>Cargando órdenes...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate-500 text-xs border border-slate-200/80">
                No se encontraron pedidos para el período y criterio de búsqueda seleccionado.
              </div>
            ) : (
              <div className="space-y-6">
                {statusBlocks.map((block) => {
                  const BlockIcon = block.icon;
                  if (block.orders.length === 0) return null;

                  return (
                    <div
                      key={block.id}
                      className={`rounded-xl border shadow-2xs overflow-hidden ${block.borderClass}`}
                    >
                      {/* Cabecera del Bloque de Estatus */}
                      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-2 ${block.headerBg}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white/80 shadow-2xs text-slate-800">
                            <BlockIcon className="w-4 h-4 text-brand-red" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-extrabold tracking-tight">
                                {block.title}
                              </h3>
                              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${block.badgeClass}`}>
                                {block.orders.length}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {block.subtitle}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tabla del Bloque */}
                      <div className="overflow-x-auto bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                              <th className="p-3">Folio</th>
                              <th className="p-3">Fecha / Espera</th>
                              <th className="p-3">Cliente</th>
                              <th className="p-3">Teléfono</th>
                              <th className="p-3">Pago</th>
                              <th className="p-3">Total</th>
                              <th className="p-3">Estado</th>
                              <th className="p-3">Repartidor</th>
                              <th className="p-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {block.orders.map((order) => {
                              const statusConfig =
                                ORDER_STATUS_CONFIG[order.status] || ORDER_STATUS_CONFIG.listo;
                              const isAssigning = assigningOrderId === order.id;
                              const isLocked =
                                order.status === 'entregado' || order.status === 'cancelado';

                              return (
                                <tr
                                  key={order.id}
                                  className={`hover:bg-slate-50/80 transition-colors ${
                                    order.status === 'incompleto' ? 'bg-rose-50/40' : ''
                                  }`}
                                >
                                  <td className="p-3 font-bold text-slate-900">
                                    <span>{order.id}</span>
                                    {order.status === 'incompleto' && (
                                      <span className="block text-[10px] font-extrabold text-rose-600 uppercase">
                                        Faltante
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-slate-500">
                                    <div>
                                      {new Date(order.createdAt).toLocaleTimeString('es-MX', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {new Date(order.createdAt).toLocaleDateString('es-MX', {
                                        day: '2-digit',
                                        month: 'short',
                                      })}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-semibold text-slate-900">
                                      {order.client?.name}
                                    </div>
                                    {order.client?.companyName && (
                                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <Building2 className="w-3 h-3 text-slate-400" />
                                        <span>{order.client.companyName}</span>
                                      </div>
                                    )}
                                    {/* Aviso de faltante si existe */}
                                    {order.missingReport && (
                                      <div className="mt-1 text-[11px] text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-300 font-semibold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                        <span>Falta: {order.missingReport.note}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 font-medium text-slate-600">
                                    {order.client?.phone || '—'}
                                  </td>
                                  <td className="p-3">
                                    {order.payment?.method === 'transferencia' ? (
                                      <div className="space-y-1">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                                          <CreditCard className="w-3 h-3 text-slate-500" />
                                          <span>Transf.</span>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handlePaymentStatusChange(
                                              order.id,
                                              order.payment?.transferStatus === 'aceptada'
                                                ? 'pendiente'
                                                : 'aceptada'
                                            )
                                          }
                                          className={`block px-2 py-0.5 rounded text-[10px] font-extrabold border cursor-pointer transition-colors ${
                                            order.payment?.transferStatus === 'aceptada'
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                                              : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                          }`}
                                          title="Clic para cambiar estado de transferencia"
                                        >
                                          {order.payment?.transferStatus === 'aceptada'
                                            ? 'Aceptada ✓'
                                            : 'Pendiente ⏳'}
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1">
                                        <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                                        <span>Efectivo</span>
                                        {order.payment?.change !== null && order.payment?.change !== undefined && (
                                          <span className="text-[10px] text-emerald-800">
                                            (Cambio ${order.payment.change})
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 font-extrabold text-slate-900">
                                    ${order.pricing?.total}
                                  </td>
                                  <td className="p-3">
                                    {isLocked ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        <Lock className="w-3 h-3 text-slate-400" />
                                        <span>{statusConfig.label}</span>
                                      </span>
                                    ) : (
                                      <select
                                        value={order.status}
                                        onChange={(e) =>
                                          handleStatusChange(order.id, e.target.value)
                                        }
                                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-400 ${statusConfig.badgeClass}`}
                                      >
                                        <option value="incompleto">Faltante (Urgente)</option>
                                        <option value="listo">Listo</option>
                                        <option value="asignado">Asignado</option>
                                        <option value="en_camino">En Camino</option>
                                        <option value="entregado">Entregado</option>
                                        <option value="cancelado">Cancelado</option>
                                      </select>
                                    )}
                                  </td>
                                  <td className="p-3 min-w-[150px]">
                                    {isLocked ? (
                                      <span className="text-slate-600 font-medium text-xs flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                                        <span>{order.assignedToName || 'Sin asignar'}</span>
                                      </span>
                                    ) : activeDrivers.length === 0 ? (
                                      <span className="text-slate-400 text-[11px]">
                                        Sin repartidores
                                      </span>
                                    ) : (
                                      <div className="flex items-center gap-1.5">
                                        {order.assignedTo ? (
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        ) : (
                                          <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        )}
                                        <select
                                          value={order.assignedTo ?? ''}
                                          onChange={(e) =>
                                            handleAssignDriver(order.id, e.target.value)
                                          }
                                          disabled={isAssigning}
                                          className={`text-xs px-2 py-1 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer w-full ${
                                            isAssigning ? 'opacity-50 cursor-not-allowed' : ''
                                          } ${
                                            order.assignedTo
                                              ? 'border-emerald-300 text-emerald-700 font-semibold'
                                              : 'border-slate-200 text-slate-500'
                                          }`}
                                        >
                                          <option value="">Sin asignar</option>
                                          {activeDrivers.map((d) => (
                                            <option key={d.id} value={d.id}>
                                              {d.name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VISTA 2: MÉTRICAS Y ANALÍTICA */}
        {activeTab === 'analytics' && <AnalyticsView orders={orders} />}

        {/* VISTA 3: CONTROL DE CUENTAS */}
        {activeTab === 'accounts' && <AccountsView />}
      </main>

      {/* Modal de Detalle */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
          hideFinancials={false}
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
