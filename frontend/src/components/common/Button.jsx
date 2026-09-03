/**
 * @module Button
 * @description Botón reutilizable con variantes de estilo y estado de carga.
 */

/**
 * @param {{
 *   children: React.ReactNode,
 *   type?: 'button' | 'submit' | 'reset',
 *   variant?: 'primary' | 'secondary' | 'danger' | 'ghost',
 *   isLoading?: boolean,
 *   disabled?: boolean,
 *   onClick?: () => void,
 *   className?: string,
 *   id?: string,
 * }} props
 */
const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  id,
}) => {
  return (
    <button
      id={id}
      type={type}
      className={`btn btn--${variant} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="btn__spinner" aria-hidden="true" />
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
