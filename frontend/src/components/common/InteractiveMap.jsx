/**
 * @module InteractiveMap
 * @description Mapa Leaflet interactivo para captura de coordenadas GPS.
 *              - Se inicializa una vez y nunca se desmonta mientras el contenedor sea visible.
 *              - El recentrado solo ocurre cuando cambia recenterToken (resultado de búsqueda o cliente autocompletado).
 *              - Clic y arrastre del pin no modifican el zoom del mapa.
 *              - ResizeObserver llama invalidateSize para que funcione dentro de modales.
 *              - Los iconos del marcador provienen del paquete leaflet, no de CDN.
 */
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Corregir ruta de iconos que Vite rompe al procesar leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER = [25.7428, -100.2872];

const negLng = (lng) => (lng > 0 ? -lng : lng);
const round6 = (n) => Number(n.toFixed(6));

/**
 * @param {object} props
 * @param {number|null|undefined} props.lat - Latitud del marcador
 * @param {number|null|undefined} props.lng - Longitud del marcador (se normaliza a negativa)
 * @param {number} [props.recenterToken=0] - Incrementar este valor fuerza recentrado del mapa
 * @param {function} [props.onChange] - Callback ({ lat, lng, source }) al hacer clic o arrastrar el pin
 * @param {string} [props.className] - Clase CSS para el contenedor del mapa
 */
export default function InteractiveMap({
  lat,
  lng,
  recenterToken = 0,
  onChange,
  className = 'h-40 sm:h-52 w-full',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // Mantener onChange actualizado en un ref para que clic y arrastre usen la versión mas reciente
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // Inicializar el mapa una única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current).setView(DEFAULT_CENTER, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Clic en el mapa coloca/mueve el pin sin cambiar el zoom actual
    map.on('click', (e) => {
      onChangeRef.current?.({
        lat: round6(e.latlng.lat),
        lng: round6(negLng(e.latlng.lng)),
        source: 'map',
      });
    });

    mapRef.current = map;

    // ResizeObserver para que el mapa no se vea gris dentro de modales o secciones colapsables
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Actualizar la posición del marcador cuando cambian lat/lng
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const nLat = parseFloat(lat);
    const nLng = negLng(parseFloat(lng));

    if (Number.isNaN(nLat) || Number.isNaN(nLng)) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }

    const pos = [nLat, nLng];

    if (!markerRef.current) {
      const marker = L.marker(pos, { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onChangeRef.current?.({
          lat: round6(p.lat),
          lng: round6(negLng(p.lng)),
          source: 'drag',
        });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng(pos);
    }
  }, [lat, lng]);

  // Recentrar el mapa SOLO cuando cambia recenterToken (nunca por clic o arrastre)
  useEffect(() => {
    const map = mapRef.current;
    const nLat = parseFloat(lat);
    const nLng = negLng(parseFloat(lng));
    if (!map || Number.isNaN(nLat) || Number.isNaN(nLng)) return;
    map.setView([nLat, nLng], Math.max(map.getZoom(), 16));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterToken]);

  return <div ref={containerRef} className={className} />;
}
