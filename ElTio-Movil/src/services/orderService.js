/**
 * @module orderService
 * @description Servicio de pedidos para el módulo de repartidores.
 *              Permite listar entregas pendientes/activas y actualizar estados de ruta.
 */
import { API_BASE_URL } from '../config/api';

export const orderService = {
  /**
   * Obtiene la lista de pedidos disponibles para entrega.
   * @param {string} token - JWT de autenticación
   * @param {'day'|'week'|'all'} range
   */
  async getDeliveries(token, range = 'all') {
    try {
      const response = await fetch(`${API_BASE_URL}/orders?range=${range}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al obtener entregas');
      }

      return data.data.orders;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualiza el estado operativo de una entrega.
   * Por ejemplo: de 'listo' a 'en_camino', o de 'en_camino' a 'entregado'.
   * @param {string} token
   * @param {string} orderId
   * @param {string} newStatus
   */
  async updateStatus(token, orderId, newStatus) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al actualizar estado');
      }

      return data.data.order;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Reporta que falta algún producto o complemento en el pedido.
   * Cambia el estatus a 'incompleto' con máxima prioridad.
   * @param {string} token
   * @param {string} orderId
   * @param {string} note
   */
  async reportMissing(token, orderId, note) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/report-missing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al reportar faltante');
      }

      return data.data.order;
    } catch (error) {
      throw error;
    }
  },
};
