/**
 * @module RepartidorView
 * @description Vista web informativa para cuentas con rol de Repartidor.
 *              Indica que el acceso operativo principal es mediante la app móvil.
 */
import { Smartphone, LogOut, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';

const RepartidorView = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <header className="bg-brand-red text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <div className="hidden sm:block border-l border-white/20 pl-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-yellow block">
                Módulo de Repartidores
              </span>
              <h1 className="text-sm font-bold text-white tracking-tight">
                Tacos &ldquo;El Tío&rdquo;
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end text-xs">
              <span className="font-bold text-white flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-yellow" />
                {user?.name}
              </span>
              <span className="text-brand-yellow font-medium text-[10px] uppercase tracking-wider">
                Repartidor
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              ariaLabel="Cerrar sesión"
              className="text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              <span>Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm w-full space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Portal de Repartidor — Acceso Móvil
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Hola, <strong>{user?.name}</strong>. Esta cuenta está destinada principalmente al uso desde la <strong>aplicación móvil de repartidores</strong> para seguimiento de rutas en tiempo real.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Clock className="w-4 h-4 text-brand-red" />
              <span>Estado del Módulo Móvil: En Preparación</span>
            </div>
            <p className="text-slate-500">
              La sincronización de entregas y GPS estará disponible en cuanto se enlace el dispositivo del repartidor. Mientras tanto, tu cuenta está activa y registrada en el sistema.
            </p>
          </div>

          <Button variant="outline" size="md" onClick={logout} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default RepartidorView;
