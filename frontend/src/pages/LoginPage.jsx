/**
 * @module LoginPage
 * @description Vista del formulario de autenticación para el portal de trabajadores.
 *              Utiliza componentes modularizados, Tailwind CSS e iconos de Lucide React.
 */
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import useLoginController from '../controllers/authController';

const LoginPage = () => {
  const { formData, isSubmitting, errorMessage, handleChange, handleSubmit } =
    useLoginController();

  return (
    <main className="min-h-screen bg-brand-red flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
        {/* Identidad de Marca */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="md" />
          <h1 className="mt-6 text-xl font-bold text-slate-900 tracking-tight">
            Portal de Trabajadores
          </h1>
          <p className="text-xs text-slate-500 mt-1 text-center">
            Inicia sesión para gestionar pedidos y entregas
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div
            className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-800 font-medium"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario de Inicio de Sesión */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Input
            id="login-email"
            name="email"
            label="Correo electrónico"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="correo@ejemplo.com"
            autoComplete="email"
            icon={Mail}
            required
          />

          <Input
            id="login-password"
            name="password"
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            autoComplete="current-password"
            icon={Lock}
            required
          />

          <Button
            id="login-submit"
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2"
          >
            <LogIn className="w-4 h-4 mr-2" />
            <span>Iniciar sesión</span>
          </Button>
        </form>
      </div>
    </main>
  );
};

export default LoginPage;
