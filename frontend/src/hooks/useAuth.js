/**
 * @module useAuth
 * @description Custom hook para consumir el AuthContext de forma segura.
 *              Lanza un error si se usa fuera del AuthProvider.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * @returns {{
 *   user: import('../models/user.model.js').User | null,
 *   isLoading: boolean,
 *   authError: string | null,
 *   isAuthenticated: boolean,
 *   login: (email: string, password: string) => Promise<void>,
 *   logout: () => void,
 * }}
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
};

export default useAuth;
