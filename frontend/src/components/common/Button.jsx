/**
 * @module Button
 * @description Componente de botón reutilizable con variantes de diseño Tailwind CSS,
 *              estados de carga accesibles e iconos integrados.
 */
import { Loader2 } from 'lucide-react';

const VARIANT_MAP = {
  primary: 'bg-brand-red text-white hover:bg-brand-red-dark focus-visible:ring-brand-red/30 shadow-sm',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900/30 shadow-sm',
  outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600/30 shadow-sm',
};

const SIZE_MAP = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  id,
  ariaLabel,
}) => {
  const variantStyles = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const sizeStyles = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <button
      id={id}
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles} ${sizeStyles} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
          <span>Cargando...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
