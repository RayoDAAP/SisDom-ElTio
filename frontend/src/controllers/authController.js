/**
 * @module authController
 * @description Lógica del formulario de login desacoplada de la presentación.
 *              El controlador maneja el estado del form y delega auth al hook useAuth.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { USER_ROLES } from '../models/user.model';

/**
 * Hook-controlador para el formulario de login.
 * Separa la lógica de negocio de la vista.
 *
 * @returns {{
 *   formData: { username: string, password: string },
 *   isSubmitting: boolean,
 *   errorMessage: string,
 *   handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   handleSubmit: (e: React.FormEvent) => Promise<void>,
 * }}
 */
const useLoginController = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(''); // Limpia error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(formData.username, formData.password);

      // Resolver redirección leyendo el token decodificado
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role === USER_ROLES.ADMIN) {
          navigate('/admin');
        } else if (payload.role === USER_ROLES.REPARTIDOR) {
          navigate('/repartidor');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { formData, isSubmitting, errorMessage, handleChange, handleSubmit };
};

export default useLoginController;
