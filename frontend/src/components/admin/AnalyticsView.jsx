/**
 * @module AnalyticsView
 * @description Sistema integral de métricas y analítica del negocio para Tacos El Tío.
 *              Implementa las reglas 22-49:
 *              - Ventas por período (Día, Semana, Mes, Total) y comparación con período anterior.
 *              - KPIs operativos: Tickets, Ticket Promedio, Productos Vendidos, Hora Pico, Día Pico.
 *              - Análisis por producto (más vendido en unidades vs mayor facturación en $).
 *              - Análisis por categoría (Tacos, Gorditas, Tostadas, Barbacoa, Menudo, Bebidas, Extras).
 *              - Distribución horaria y semanal de ventas.
 *              (Costo y margen de utilidad omitidos según especificación del usuario).
 */
import { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Receipt,
  Clock,
  Calendar,
  Utensils,
  Award,
  BarChart3,
  Flame,
  Soup,
  Coffee,
  PlusCircle,
  Percent,
} from 'lucide-react';

const AnalyticsView = ({ orders = [] }) => {
  const [period, setPeriod] = useState('all'); // 'day' | 'week' | 'month' | 'all'

  // ─── Filtrado y Cálculo de Períodos ─────────────────────────────────────────
  const analyticsData = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    // 1. Filtrar pedidos del período seleccionado y del período previo de comparación
    const currentOrders = [];
    const prevOrders = [];

    orders.forEach((o) => {
      const oDate = new Date(o.createdAt);

      if (period === 'day') {
        if (oDate >= todayStart) {
          currentOrders.push(o);
        } else if (oDate >= yesterdayStart && oDate < todayStart) {
          prevOrders.push(o);
        }
      } else if (period === 'week') {
        const diffDays = (now - oDate) / (1000 * 60 * 60 * 24);
        if (diffDays <= 7) {
          currentOrders.push(o);
        } else if (diffDays > 7 && diffDays <= 14) {
          prevOrders.push(o);
        }
      } else if (period === 'month') {
        if (
          oDate.getMonth() === now.getMonth() &&
          oDate.getFullYear() === now.getFullYear()
        ) {
          currentOrders.push(o);
        } else if (
          oDate.getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1) &&
          oDate.getFullYear() === (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
        ) {
          prevOrders.push(o);
        }
      } else {
        // 'all'
        currentOrders.push(o);
      }
    });

    // 2. Ventas y Totales Financieros
    const currentSales = currentOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
    const prevSales = prevOrders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

    let salesGrowth = 0;
    if (prevSales > 0) {
      salesGrowth = ((currentSales - prevSales) / prevSales) * 100;
    }

    const ticketCount = currentOrders.length;
    const ticketPromedio = ticketCount > 0 ? Math.round(currentSales / ticketCount) : 0;

    // 3. Desglose detallado por productos y categorías
    const productStats = {};
    const categoryStats = {
      Tacos: { revenue: 0, units: 0 },
      Gorditas: { revenue: 0, units: 0 },
      Tostadas: { revenue: 0, units: 0 },
      Barbacoa: { revenue: 0, units: 0 },
      Menudo: { revenue: 0, units: 0 },
      Bebidas: { revenue: 0, units: 0 },
      Extras: { revenue: 0, units: 0 },
    };

    let totalProductsCount = 0;

    // Horas y Días para picos
    const hourlyCounts = Array(24).fill(0);
    const dailyCounts = {
      Domingo: 0,
      Lunes: 0,
      Martes: 0,
      Miércoles: 0,
      Jueves: 0,
      Viernes: 0,
      Sábado: 0,
    };
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    currentOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + (order.pricing?.total || 0);

      const dayName = dayNames[orderDate.getDay()];
      dailyCounts[dayName] = (dailyCounts[dayName] || 0) + (order.pricing?.total || 0);

      const items = order.items || {};

      // A. Tacos / Gorditas / Tostadas preparados
      if (items.preparedItems && Array.isArray(items.preparedItems)) {
        items.preparedItems.forEach((pi) => {
          const qty = Number(pi.quantity) || 1;
          const rev = Number(pi.price) || 0;
          const name = pi.label || `${pi.type} de ${pi.guiso}`;
          totalProductsCount += qty;

          if (!productStats[name]) {
            productStats[name] = { name, units: 0, revenue: 0, category: pi.type };
          }
          productStats[name].units += qty;
          productStats[name].revenue += rev;

          const catKey =
            pi.type === 'taco' ? 'Tacos' : pi.type === 'gordita' ? 'Gorditas' : 'Tostadas';
          if (categoryStats[catKey]) {
            categoryStats[catKey].units += qty;
            categoryStats[catKey].revenue += rev;
          }
        });
      }

      // B. Barbacoa
      if (items.barbacoa && Array.isArray(items.barbacoa)) {
        items.barbacoa.forEach((b) => {
          const rev = Number(b.price) || 0;
          const name = b.label || 'Barbacoa';
          const units = b.type === 'platillo' ? (b.quantity || 1) : 1;
          totalProductsCount += units;

          if (!productStats[name]) {
            productStats[name] = { name, units: 0, revenue: 0, category: 'barbacoa' };
          }
          productStats[name].units += units;
          productStats[name].revenue += rev;

          categoryStats.Barbacoa.units += units;
          categoryStats.Barbacoa.revenue += rev;
        });
      }

      // C. Menudo
      if (items.menudo && Array.isArray(items.menudo)) {
        items.menudo.forEach((m) => {
          const qty = Number(m.quantity) || 1;
          const rev = Number(m.price) || 0;
          const name = m.label || `Menudo ${m.size}`;
          totalProductsCount += qty;

          if (!productStats[name]) {
            productStats[name] = { name, units: 0, revenue: 0, category: 'menudo' };
          }
          productStats[name].units += qty;
          productStats[name].revenue += rev;

          categoryStats.Menudo.units += qty;
          categoryStats.Menudo.revenue += rev;
        });
      }

      // D. Bebidas
      if (items.drinks && Array.isArray(items.drinks)) {
        items.drinks.forEach((d) => {
          const qty = Number(d.quantity) || 1;
          const rev = Number(d.price) || 0;
          const name = d.label || d.name || 'Coca-Cola';
          totalProductsCount += qty;

          if (!productStats[name]) {
            productStats[name] = { name, units: 0, revenue: 0, category: 'bebidas' };
          }
          productStats[name].units += qty;
          productStats[name].revenue += rev;

          categoryStats.Bebidas.units += qty;
          categoryStats.Bebidas.revenue += rev;
        });
      }

      // E. Extras y Tortillas
      if (items.extras) {
        const ex = items.extras;
        const salsaR = Number(ex.salsaRed) || 0;
        const salsaG = Number(ex.salsaGreen) || 0;
        const onion = Number(ex.onion) || 0;
        const tortPrice = Number(ex.tortillasPrice) || 0;
        const tortQty = Number(ex.tortillasPkgQty) || 0;

        const extrasUnits = salsaR + salsaG + onion + tortQty;
        const extrasRev = (salsaR + salsaG + onion) * 4 + tortPrice;

        totalProductsCount += extrasUnits;
        categoryStats.Extras.units += extrasUnits;
        categoryStats.Extras.revenue += extrasRev;

        if (salsaR > 0) {
          const name = 'Salsa Roja';
          if (!productStats[name]) productStats[name] = { name, units: 0, revenue: 0, category: 'extras' };
          productStats[name].units += salsaR;
          productStats[name].revenue += salsaR * 4;
        }
        if (salsaG > 0) {
          const name = 'Salsa Verde';
          if (!productStats[name]) productStats[name] = { name, units: 0, revenue: 0, category: 'extras' };
          productStats[name].units += salsaG;
          productStats[name].revenue += salsaG * 4;
        }
        if (onion > 0) {
          const name = 'Cebolla';
          if (!productStats[name]) productStats[name] = { name, units: 0, revenue: 0, category: 'extras' };
          productStats[name].units += onion;
          productStats[name].revenue += onion * 4;
        }
        if (tortQty > 0) {
          const name = ex.tortillasLabel || 'Tortillas';
          if (!productStats[name]) productStats[name] = { name, units: 0, revenue: 0, category: 'extras' };
          productStats[name].units += tortQty;
          productStats[name].revenue += tortPrice;
        }
      }
    });

    // 4. Rankings de Productos
    const productList = Object.values(productStats);
    const topByUnits = [...productList].sort((a, b) => b.units - a.units)[0] || null;
    const topByRevenue = [...productList].sort((a, b) => b.revenue - a.revenue)[0] || null;
    const rankedProducts = [...productList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 5. Pico horario y diario
    let peakHour = 0;
    let peakHourMax = -1;
    hourlyCounts.forEach((val, hr) => {
      if (val > peakHourMax) {
        peakHourMax = val;
        peakHour = hr;
      }
    });

    let peakDay = 'N/A';
    let peakDayMax = -1;
    Object.entries(dailyCounts).forEach(([day, val]) => {
      if (val > peakDayMax) {
        peakDayMax = val;
        peakDay = day;
      }
    });

    return {
      currentSales,
      prevSales,
      salesGrowth,
      ticketCount,
      ticketPromedio,
      totalProductsCount,
      topByUnits,
      topByRevenue,
      rankedProducts,
      categoryStats,
      hourlyCounts,
      peakHour: `${peakHour}:00 - ${peakHour + 1}:00`,
      peakDay,
    };
  }, [orders, period]);

  return (
    <div className="space-y-6">
      {/* Selector de Período de Análisis */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-red" />
            <span>Métricas Operativas y Financieras</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analítica basada en órdenes reales registradas en el sistema
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          {[
            { id: 'day', label: 'Hoy' },
            { id: 'week', label: 'Esta Semana' },
            { id: 'month', label: 'Este Mes' },
            { id: 'all', label: 'Histórico Total' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                period === tab.id
                  ? 'bg-brand-red text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Indicadores Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Ventas del Período */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ventas Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${analyticsData.currentSales.toLocaleString('es-MX')}
          </div>
          {period !== 'all' && (
            <div className="flex items-center gap-1.5 text-xs">
              {analyticsData.salesGrowth >= 0 ? (
                <span className="text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{analyticsData.salesGrowth.toFixed(1)}%
                </span>
              ) : (
                <span className="text-red-600 font-bold flex items-center">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {analyticsData.salesGrowth.toFixed(1)}%
                </span>
              )}
              <span className="text-slate-400">vs período anterior</span>
            </div>
          )}
        </div>

        {/* 2. Número de Tickets */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pedidos (Tickets)
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analyticsData.ticketCount}
          </div>
          <p className="text-xs text-slate-400">Órdenes procesadas en el período</p>
        </div>

        {/* 3. Ticket Promedio */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Ticket Promedio
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ${analyticsData.ticketPromedio}
          </div>
          <p className="text-xs text-slate-400">Consumo medio por pedido</p>
        </div>

        {/* 4. Total Productos Vendidos */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Productos Despachados
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {analyticsData.totalProductsCount}
          </div>
          <p className="text-xs text-slate-400">Piezas, platillos y porciones</p>
        </div>
      </div>

      {/* Detección de Patrones Operativos: Hora Pico y Día Pico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Hora de Mayor Demanda
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {analyticsData.peakHour}
            </span>
            <span className="text-xs text-slate-500 block">
              Horario clave para preparación anticipada
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Día con Mayor Facturación
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {analyticsData.peakDay}
            </span>
            <span className="text-xs text-slate-500 block">
              Día de mayor volumen de clientes y pedidos
            </span>
          </div>
        </div>
      </div>

      {/* Análisis por Producto y Desglose por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos Líderes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-brand-red" />
            <span>Productos Destacados</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Más vendido en unidades */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Más Vendido (Unidades)
              </span>
              <span className="font-extrabold text-slate-900 text-sm block">
                {analyticsData.topByUnits ? analyticsData.topByUnits.name : 'Sin datos'}
              </span>
              <span className="text-xs text-slate-600 mt-1 block">
                {analyticsData.topByUnits ? `${analyticsData.topByUnits.units} unidades vendidas` : '-'}
              </span>
            </div>

            {/* Mayor facturación en $ */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Mayor Facturación ($)
              </span>
              <span className="font-extrabold text-slate-900 text-sm block">
                {analyticsData.topByRevenue ? analyticsData.topByRevenue.name : 'Sin datos'}
              </span>
              <span className="text-xs text-emerald-700 font-bold mt-1 block">
                {analyticsData.topByRevenue ? `$${analyticsData.topByRevenue.revenue} generados` : '-'}
              </span>
            </div>
          </div>

          {/* Ranking Top 5 Productos */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
              Top 5 Productos por Facturación
            </span>
            {analyticsData.rankedProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No hay productos en este período</p>
            ) : (
              analyticsData.rankedProducts.map((p, idx) => {
                const pct =
                  analyticsData.currentSales > 0
                    ? Math.round((p.revenue / analyticsData.currentSales) * 100)
                    : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span className="font-semibold truncate max-w-xs">{p.name}</span>
                      <span className="font-bold">${p.revenue} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-brand-red h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Desglose por Categoría */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Utensils className="w-4 h-4 text-brand-red" />
            <span>Participación por Categoría</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(analyticsData.categoryStats).map(([cat, data]) => {
              const pct =
                analyticsData.currentSales > 0
                  ? Math.round((data.revenue / analyticsData.currentSales) * 100)
                  : 0;

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{data.units} u.</span>
                      <span className="font-extrabold text-slate-900">${data.revenue}</span>
                      <span className="text-slate-400 text-[11px]">({pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-brand-red/90 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
