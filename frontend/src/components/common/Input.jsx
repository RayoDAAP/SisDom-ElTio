/**
 * @module Input
 * @description Campo de entrada de texto reutilizable con soporte para accesibilidad,
 *              estados de validación y utilidades visuales de Tailwind CSS.
 */
import { AlertCircle } from 'lucide-react';

const Input = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  autoComplete,
  icon: Icon,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
          {label}
          {required && <span className="text-brand-red ml-1" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative rounded-lg shadow-xs">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full text-sm rounded-lg border px-3.5 py-2.5 transition-colors focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-500 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500/20'
              : 'border-slate-300 text-slate-900 placeholder-slate-400 focus:border-brand-red focus:ring-brand-red/20'
          }`}
        />
      </div>

      {error && (
        <div id={`${id}-error`} className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium" role="alert">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
