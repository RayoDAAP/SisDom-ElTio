/**
 * @module Input
 * @description Campo de entrada reutilizable con soporte para etiqueta, error y tipo.
 */

/**
 * @param {{
 *   id: string,
 *   name: string,
 *   label: string,
 *   type?: string,
 *   value: string,
 *   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   placeholder?: string,
 *   error?: string,
 *   required?: boolean,
 *   autoComplete?: string,
 * }} props
 */
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
}) => {
  return (
    <div className="input-group">
      <label htmlFor={id} className="input-group__label">
        {label}
        {required && <span className="input-group__required" aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input-group__field ${error ? 'input-group__field--error' : ''}`}
      />
      {error && (
        <p id={`${id}-error`} className="input-group__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
