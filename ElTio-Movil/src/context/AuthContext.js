/**
 * @module AuthContext
 * @description Contexto global de autenticación para la app móvil de repartidores.
 */
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restaurar sesión al iniciar la aplicación
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = await authService.getStoredSession();
        if (session) {
          setToken(session.token);
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error restaurando sesión:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const { token: newToken, user: newUser } = await authService.login(username, password);
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      const msg = error.message || 'Error al iniciar sesión';
      setAuthError(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setAuthError(null);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    authError,
    isAuthenticated: !!token && !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
