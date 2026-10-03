/**
 * @module Logo
 * @description Identidad visual de Tacos El Tío construida con estilos de Tailwind CSS.
 *              Fiel a la marca: Óvalo blanco, borde dorado y tipografía limpia.
 */

const SIZE_VARIANTS = {
  sm: {
    container: 'w-36 h-20 px-2 border-3',
    topText: 'text-[9px] tracking-widest',
    mainText: 'text-base font-black',
    bottomText: 'text-[7px] tracking-wider',
  },
  md: {
    container: 'w-52 h-28 px-3 border-4',
    topText: 'text-[11px] tracking-widest',
    mainText: 'text-2xl font-black',
    bottomText: 'text-[9px] tracking-wider',
  },
  lg: {
    container: 'w-72 h-40 px-4 border-4',
    topText: 'text-sm tracking-widest',
    mainText: 'text-4xl font-black',
    bottomText: 'text-xs tracking-wider',
  },
};

const Logo = ({ size = 'md', className = '' }) => {
  const variant = SIZE_VARIANTS[size] || SIZE_VARIANTS.md;

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="img" aria-label="Tacos El Tío Logo">
      <div
        className={`bg-white border-brand-yellow rounded-[50%] flex flex-col items-center justify-center text-center shadow-lg ring-2 ring-brand-red select-none transition-transform ${variant.container}`}
      >
        <span className={`font-bold text-slate-800 uppercase leading-tight ${variant.topText}`}>
          TACOS
        </span>
        <span className={`font-extrabold text-brand-red leading-none ${variant.mainText}`}>
          &ldquo;EL TÍO&rdquo;
        </span>
        <span className={`font-bold text-slate-600 uppercase leading-tight ${variant.bottomText}`}>
          BARBACOA Y MENUDO
        </span>
      </div>
    </div>
  );
};

export default Logo;
