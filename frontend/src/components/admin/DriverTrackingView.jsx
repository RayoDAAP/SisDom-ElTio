/**
 * @module DriverTrackingView
 * @description Vista interactiva de monitoreo GPS en tiempo real para repartidores.
 *              - Selector por pestañas (un tab por cada repartidor activo o con pedidos en ruta).
 *              - Marcador especial de la sucursal de Tacos El Tío (base de salida).
 *              - Marcador del repartidor con icono de motito y pulso animado.
 *              - Marcadores numerados con los pedidos asignados/en ruta con sus estados.
 *              - Línea de ruta (polyline) conectando la sucursal con las paradas del repartidor.
 *              - Panel lateral / inferior con la cola de entregas de la ruta.
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Bike,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Package,
  Store,
  Navigation,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

// Coordenadas base de la sucursal de Tacos El Tío (San Nicolás de los Garza)
const BRANCH_LOCATION = {
  name: 'Tacos El Tío (Sucursal San Nicolás)',
  lat: 25.734643,
  lng: -100.242169,
};

const negLng = (lng) => (lng > 0 ? -lng : lng);

export default function DriverTrackingView({
  drivers = [],
  orders = [],
  onSelectOrder,
}) {
  // Pestaña del repartidor seleccionado (por id)
  const [selectedDriverId, setSelectedDriverId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layerGroupRef = useRef(null);

  // Filtrar pedidos activos o del turno de entrega
  const activeOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'en_camino' ||
        o.status === 'asignado' ||
        o.status === 'incompleto' ||
        o.status === 'listo'
    );
  }, [orders]);

  // Lista de repartidores disponibles (activos o que tienen pedidos asignados)
  const driversList = useMemo(() => {
    const list = [...drivers];
    // Asegurar que si hay pedidos asignados a un chofer no registrado en 'drivers', aparezca
    orders.forEach((o) => {
      if (o.assignedTo && !list.some((d) => String(d.id) === String(o.assignedTo))) {
        list.push({
          id: o.assignedTo,
          name: o.assignedToName || `Repartidor #${o.assignedTo}`,
          role: 'repartidor',
          isActive: true,
        });
      }
    });
    return list;
  }, [drivers, orders]);

  // Seleccionar automáticamente el primer repartidor si ninguno está seleccionado
  useEffect(() => {
    if (driversList.length > 0) {
      if (!selectedDriverId || !driversList.some((d) => String(d.id) === String(selectedDriverId))) {
        setSelectedDriverId(driversList[0].id);
      }
    }
  }, [driversList, selectedDriverId]);

  // Datos del repartidor actualmente seleccionado
  const currentDriver = useMemo(() => {
    return driversList.find((d) => String(d.id) === String(selectedDriverId)) || null;
  }, [driversList, selectedDriverId]);

  // Pedidos asignados al repartidor seleccionado
  const driverOrders = useMemo(() => {
    if (!selectedDriverId) return [];
    return orders
      .filter((o) => String(o.assignedTo) === String(selectedDriverId))
      .filter((o) => o.status !== 'cancelado');
  }, [orders, selectedDriverId]);

  // Pedidos activos (en camino / asignados / faltantes)
  const pendingDeliveries = useMemo(() => {
    return driverOrders.filter(
      (o) => o.status === 'en_camino' || o.status === 'asignado' || o.status === 'incompleto'
    );
  }, [driverOrders]);

  // Pedidos completados
  const deliveredCount = useMemo(() => {
    return driverOrders.filter((o) => o.status === 'entregado').length;
  }, [driverOrders]);

  // Calcular la posición estimada/en vivo del repartidor
  // Si está en ruta y tiene pedidos en camino, se ubica entre la sucursal y la primera parada
  const driverLivePosition = useMemo(() => {
    if (pendingDeliveries.length === 0) {
      // Si no tiene entregas pendientes, se encuentra en la sucursal esperando pedidos
      return {
        lat: BRANCH_LOCATION.lat,
        lng: BRANCH_LOCATION.lng,
        isAtBranch: true,
        headingLabel: 'En sucursal (Disponible)',
      };
    }

    const firstActiveWithCoords = pendingDeliveries.find(
      (o) => o.client?.lat && o.client?.lng && o.client?.deliveryType !== 'recoger'
    );

    if (firstActiveWithCoords) {
      const targetLat = Number(firstActiveWithCoords.client.lat);
      const targetLng = negLng(Number(firstActiveWithCoords.client.lng));
      // Interpolar avance (~45% del trayecto hacia el primer destino para simular movimiento en vivo)
      const interpLat = BRANCH_LOCATION.lat + (targetLat - BRANCH_LOCATION.lat) * 0.45;
      const interpLng = BRANCH_LOCATION.lng + (targetLng - BRANCH_LOCATION.lng) * 0.45;

      return {
        lat: Number(interpLat.toFixed(6)),
        lng: Number(interpLng.toFixed(6)),
        isAtBranch: false,
        headingLabel: `En camino a: ${firstActiveWithCoords.client?.name || 'Cliente'}`,
        targetOrder: firstActiveWithCoords,
      };
    }

    return {
      lat: BRANCH_LOCATION.lat,
      lng: BRANCH_LOCATION.lng,
      isAtBranch: true,
      headingLabel: 'En ruta',
    };
  }, [pendingDeliveries]);

  // Inicializar mapa Leaflet una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return undefined;

    const map = L.map(mapContainerRef.current).setView(
      [BRANCH_LOCATION.lat, BRANCH_LOCATION.lng],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Dibujar y actualizar marcadores, motito y ruta cuando cambia de chofer o de pedidos
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const boundsPoints = [];

    // 1. Marcador de la Sucursal (Base)
    const branchIconHtml = `
      <div style="background-color: #CC0000; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-size: 18px;">
        🌮
      </div>
    `;
    const branchIcon = L.divIcon({
      html: branchIconHtml,
      className: 'custom-branch-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const branchMarker = L.marker([BRANCH_LOCATION.lat, BRANCH_LOCATION.lng], { icon: branchIcon })
      .bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <b style="color: #CC0000; font-size: 13px;">${BRANCH_LOCATION.name}</b><br/>
          <span style="font-size: 11px; color: #475569;">Base de salida y cocina de Tacos El Tío</span>
        </div>
      `);
    layerGroup.addLayer(branchMarker);
    boundsPoints.push([BRANCH_LOCATION.lat, BRANCH_LOCATION.lng]);

    // 2. Marcador del Repartidor (Motito en vivo con pulso animado)
    if (driverLivePosition) {
      const bikeIconHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(220, 38, 38, 0.25); animation: pulse 2s infinite ease-in-out;"></div>
          <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #1E293B, #0F172A); border: 2.5px solid #FFD700; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.35); font-size: 17px; z-index: 10;">
            🛵
          </div>
        </div>
      `;
      const bikeIcon = L.divIcon({
        html: bikeIconHtml,
        className: 'custom-bike-marker',
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const bikeMarker = L.marker([driverLivePosition.lat, driverLivePosition.lng], {
        icon: bikeIcon,
        zIndexOffset: 1000,
      }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 160px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 16px;">🛵</span>
            <b style="font-size: 13px; color: #0F172A;">${currentDriver?.name || 'Repartidor'}</b>
          </div>
          <p style="font-size: 11px; color: #64748B; margin: 4px 0 0 0;">
            ${driverLivePosition.headingLabel}
          </p>
        </div>
      `);
      layerGroup.addLayer(bikeMarker);
      boundsPoints.push([driverLivePosition.lat, driverLivePosition.lng]);
    }

    // 3. Marcadores de las entregas asignadas (con número de parada)
    const routeCoords = [[BRANCH_LOCATION.lat, BRANCH_LOCATION.lng]];

    // Si la moto está fuera de sucursal, la línea pasa primero por la moto
    if (driverLivePosition && !driverLivePosition.isAtBranch) {
      routeCoords.push([driverLivePosition.lat, driverLivePosition.lng]);
    }

    let stopIndex = 1;
    pendingDeliveries.forEach((order) => {
      const client = order.client;
      if (!client?.lat || !client?.lng || client.deliveryType === 'recoger') return;

      const lat = Number(client.lat);
      const lng = negLng(Number(client.lng));
      routeCoords.push([lat, lng]);
      boundsPoints.push([lat, lng]);

      const isUrgent = order.status === 'incompleto';
      const isEnCamino = order.status === 'en_camino';
      const bgColor = isUrgent ? '#BE123C' : isEnCamino ? '#7C3AED' : '#2563EB';

      const orderPinHtml = `
        <div style="background-color: ${bgColor}; width: 28px; height: 28px; border-radius: 50%; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border: 2.5px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.25);">
          ${stopIndex}
        </div>
      `;
      const orderIcon = L.divIcon({
        html: orderPinHtml,
        className: 'custom-stop-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const orderMarker = L.marker([lat, lng], { icon: orderIcon }).bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 4px; max-width: 200px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <b style="color: ${bgColor}; font-size: 13px;">Parada #${stopIndex} (${order.id})</b>
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase;">$${order.pricing?.total || 0}</span>
          </div>
          <p style="font-size: 12px; font-weight: 700; color: #1E293B; margin: 4px 0 2px 0;">${client.name}</p>
          <p style="font-size: 11px; color: #64748B; margin: 0;">${client.street} #${client.number || 'S/N'}, Col. ${client.colonia}</p>
          <p style="font-size: 10px; color: #94A3B8; margin-top: 4px;">Método: ${order.payment?.method || 'Efectivo'}</p>
        </div>
      `);

      orderMarker.on('click', () => {
        if (onSelectOrder) onSelectOrder(order);
      });

      layerGroup.addLayer(orderMarker);
      stopIndex += 1;
    });

    // 4. Dibujar línea de ruta punteada
    if (routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: '#CC0000',
        weight: 3.5,
        opacity: 0.7,
        dashArray: '6, 8',
      });
      layerGroup.addLayer(polyline);
    }

    // Recentrar mapa abarcando todos los puntos
    if (boundsPoints.length > 0) {
      map.fitBounds(boundsPoints, {
        padding: [50, 50],
        maxZoom: 15,
      });
    }
  }, [selectedDriverId, driverLivePosition, pendingDeliveries, currentDriver, onSelectOrder]);

  return (
    <div className="space-y-4">
      {/* 1. Selector de Pestañas por Repartidor */}
      <div className="bg-white rounded-xl p-3 shadow-2xs border border-slate-200/80">
        <div className="flex items-center justify-between gap-3 mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">🛵</span>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Monitoreo GPS en Vivo por Repartidor
            </span>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {driversList.length} chofer{driversList.length !== 1 ? 'es' : ''} registrado{driversList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabs de choferes */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {driversList.map((driver) => {
            const isSelected = String(driver.id) === String(selectedDriverId);
            const driverPending = orders.filter(
              (o) =>
                String(o.assignedTo) === String(driver.id) &&
                (o.status === 'en_camino' || o.status === 'asignado' || o.status === 'incompleto')
            ).length;

            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => setSelectedDriverId(driver.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm ring-2 ring-brand-red'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${driverPending > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{driver.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                    isSelected ? 'bg-white/20 text-brand-yellow' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {driverPending} en ruta
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Área Principal: Mapa y Panel de Entregas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mapa Leaflet Interactivo (ocupa 2 columnas en pantallas grandes) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden flex flex-col h-[520px]">
          {/* Barra de estado sobre el mapa */}
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs font-semibold shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm">🛵</span>
              <span className="text-slate-200">
                Ubicación de <strong className="text-white">{currentDriver?.name || 'Repartidor'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-brand-yellow font-bold">
                {driverLivePosition?.headingLabel}
              </span>
            </div>
          </div>

          {/* Contenedor del Mapa */}
          <div className="flex-1 w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Leyenda flotante en la esquina inferior */}
            <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-xs p-2.5 rounded-lg shadow-md border border-slate-200 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span>🌮</span> <span>Sucursal Tacos El Tío (Base)</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span>🛵</span> <span>Posición GPS del Repartidor</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> <span>Parada asignada</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> <span>En camino</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> <span>Faltante / Urgente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Lateral: Paradas y Cola de Entregas del Repartidor */}
        <div className="bg-white rounded-xl shadow-2xs border border-slate-200 flex flex-col h-[520px]">
          {/* Header del panel lateral */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 rounded-t-xl shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Ruta de Entregas
              </h3>
              <span className="text-xs font-bold text-slate-600">
                {pendingDeliveries.length} pendientes · {deliveredCount} entregados
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ordenadas para despacho optimizado desde sucursal.
            </p>
          </div>

          {/* Lista scrollable de paradas */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {pendingDeliveries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                <Bike className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">Sin órdenes en ruta</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Este repartidor no tiene pedidos activos en este momento.
                </p>
              </div>
            ) : (
              pendingDeliveries.map((order, idx) => {
                const isUrgent = order.status === 'incompleto';
                const isEnCamino = order.status === 'en_camino';

                return (
                  <div
                    key={order.id}
                    onClick={() => onSelectOrder?.(order)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-xs ${
                      isUrgent
                        ? 'border-rose-300 bg-rose-50/40 hover:bg-rose-50'
                        : isEnCamino
                        ? 'border-purple-200 bg-purple-50/30 hover:bg-purple-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center ${
                            isUrgent ? 'bg-rose-600' : isEnCamino ? 'bg-purple-600' : 'bg-blue-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-extrabold text-slate-900">{order.id}</span>
                      </div>
                      <span className="text-xs font-black text-brand-red">
                        ${order.pricing?.total || 0}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 line-clamp-1">
                      {order.client?.name || 'Cliente sin nombre'}
                    </div>

                    <div className="flex items-start gap-1 text-[11px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {order.client?.deliveryType === 'recoger'
                          ? 'Recoger en sucursal'
                          : `${order.client?.street || ''} #${order.client?.number || 'S/N'}, Col. ${order.client?.colonia || ''}`}
                      </span>
                    </div>

                    {isUrgent && order.missingReport && (
                      <div className="mt-2 text-[10px] font-bold text-rose-700 bg-rose-100 p-1.5 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">Faltante: {order.missingReport.note}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
