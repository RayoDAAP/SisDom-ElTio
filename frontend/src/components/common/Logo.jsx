/**
 * @module Logo
 * @description Logo de Tacos El Tío construido con CSS — sin dependencias externas.
 *              Refleja la identidad visual: óvalo blanco con borde amarillo sobre fondo rojo.
 */

/**
 * @param {{ size?: 'sm' | 'md' | 'lg' }} props
 */
const Logo = ({ size = 'md' }) => {
  return (
    <div className={`logo logo--${size}`} role="img" aria-label="Tacos El Tío Logo">
      <div className="logo__oval">
        <p className="logo__subtitle-top">TACOS</p>
        <h1 className="logo__name">&ldquo;EL TÍO&rdquo;</h1>
        <p className="logo__subtitle-bottom">BARBACOA Y MENUDO</p>
      </div>
    </div>
  );
};

export default Logo;
