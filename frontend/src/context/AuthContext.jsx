/**
 * @module AuthContext
 * @description Contexto global de autenticación. Provee el estado del usuario,
 *              funciones de login/logout y el estado de carga a toda la app.
 */
import { createContext, useState, useEffect, useCallback } from 'react';
import { loginRequest, getMeRequest } from '../services/authService';

/** @type {React.Context} */
export const AuthContext = createContext(null);

/**
 * Proveedor del contexto de autenticación.
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Al montar, verifica si hay una sesión activa en localStorage.
   */
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await getMeRequest();
        setUser(userData);
      } catch {
        // Token inválido o expirado — limpiar sesión
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /**
   * Autentica al usuario y persiste el token.
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { token, user: userData } = await loginRequest(email, password);
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error al iniciar sesión. Intenta de nuevo.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cierra la sesión y limpia el estado.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);
  }, []);

  const value = {
    user,
    isLoading,
    authError,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
