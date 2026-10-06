/**
 * @module authService
 * @description Servicio de autenticación para la app móvil de repartidores.
 *              Maneja el inicio de sesión, verificación de token y persistencia en AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const TOKEN_KEY = '@eltio_auth_token';
const USER_KEY = '@eltio_auth_user';

export const authService = {
  /**
   * Inicia sesión con nombre de usuario y contraseña.
   * @param {string} username
   * @param {string} password
   */
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      const { token, user } = data.data;

      // Persistir token y datos de usuario en almacenamiento local
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      return { token, user };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene la sesión guardada desde el almacenamiento local.
   */
  async getStoredSession() {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);
      if (!token || !userStr) return null;
      return { token, user: JSON.parse(userStr) };
    } catch {
      return null;
    }
  },

  /**
   * Cierra sesión y elimina credenciales locales.
   */
  async logout() {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error al limpiar sesión:', error);
    }
  },
};
