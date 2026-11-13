/**
 * @module locationService
 * @description Servicio de geolocalización en segundo plano para repartidores en Expo.
 *              - Solicita permisos de ubicación al repartidor.
 *              - Transmite las coordenadas GPS en tiempo real al backend.
 *              - Gestiona la solicitud de apagado de ubicación (que requiere aprobación del administrador).
 */
import * as Location from 'expo-location';
import { API_BASE_URL } from '../config/api';

export const locationService = {
  /**
   * Solicita permisos de ubicación al repartidor.
   */
  async requestPermissions() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  },

  /**
   * Obtiene la posición GPS actual del dispositivo móvil.
   */
  async getCurrentPosition() {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speed: location.coords.speed,
      heading: location.coords.heading,
    };
  },

  /**
   * Envía las coordenadas GPS actuales al backend.
   */
  async sendLocation(token, { lat, lng, speed, heading }) {
    const response = await fetch(`${API_BASE_URL}/tracking/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ lat, lng, speed, heading }),
    });

    const data = await response.json();
    return data;
  },

  /**
   * Consulta el estado de tracking actual del repartidor.
   */
  async getStatus(token) {
    const response = await fetch(`${API_BASE_URL}/tracking/status`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data?.data || null;
  },

  /**
   * Solicita al administrador apagar la ubicación.
   */
  async requestTurnOff(token, reason) {
    const response = await fetch(`${API_BASE_URL}/tracking/request-off`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    return data;
  },

  /**
   * Reactiva el tracking de ubicación directamente.
   */
  async turnOn(token) {
    const response = await fetch(`${API_BASE_URL}/tracking/turn-on`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  },
};
