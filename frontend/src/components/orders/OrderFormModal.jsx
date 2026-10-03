/**
 * @module OrderFormModal
 * @description Formulario modal para captura rápida de pedidos.
 *              Implementa accesibilidad, cálculo reactivo en tiempo real y Tailwind CSS.
 */
import { useState, useMemo, useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  MapPin,
  Flame,
  Soup,
  PlusCircle,
  Truck,
  FileText,
  Save,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { PRICES } from '../../models/order.model';
import Button from '../common/Button';
import Input from '../common/Input';

const OrderFormModal = ({ onClose, onSubmitSuccess }) => {
  // Manejo de la tecla Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ─── Estado del Formulario ──────────────────────────────────────────────────
  const [clientType, setClientType] = useState('particular');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [colonia, setColonia] = useState('');

  // Barbacoa
  const [barbacoaMode, setBarbacoaMode] = useState('gramos'); // gramos, monto, platillos
  const [barbacoaGrams, setBarbacoaGrams] = useState(500);
  const [barbacoaAmount, setBarbacoaAmount] = useState(200);
  const [barbacoaPlatillosQty, setBarbacoaPlatillosQty] = useState(2);
  const [barbacoaPlatillosPrice, setBarbacoaPlatillosPrice] = useState(100);

  // Menudo
  const [menudoHalfLiterQty, setMenudoHalfLiterQty] = useState(0);
  const [menudoLiterQty, setMenudoLiterQty] = useState(0);

  // Extras
  const [salsaRedQty, setSalsaRedQty] = useState(1);
  const [salsaGreenQty, setSalsaGreenQty] = useState(1);
  const [onionQty, setOnionQty] = useState(1);
  const [tortillasOption, setTortillasOption] = useState('10_piezas');

  // Envío y Notas
  const [shippingFee, setShippingFee] = useState(40);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Cálculo en Tiempo Real ─────────────────────────────────────────────────
  const calculations = useMemo(() => {
    let barbacoaTotal = 0;
    let barbacoaLabel = '';

    if (barbacoaMode === 'gramos') {
      const g = Number(barbacoaGrams) || 0;
      barbacoaTotal = Math.round((g / 1000) * PRICES.barbacoaPerKg);
      barbacoaLabel = `${g}g de Barbacoa`;
    } else if (barbacoaMode === 'monto') {
      barbacoaTotal = Number(barbacoaAmount) || 0;
      barbacoaLabel = `Barbacoa por Monto ($${barbacoaTotal})`;
    } else if (barbacoaMode === 'platillos') {
      const q = Number(barbacoaPlatillosQty) || 0;
      const p = Number(barbacoaPlatillosPrice) || 0;
      barbacoaTotal = q * p;
      barbacoaLabel = `${q} Platillo(s) de Barbacoa de $${p} c/u`;
    }

    const menudoHalfTotal = (Number(menudoHalfLiterQty) || 0) * PRICES.menudoHalfLiter;
    const menudoLiterTotal = (Number(menudoLiterQty) || 0) * PRICES.menudoLiter;
    const menudoTotal = menudoHalfTotal + menudoLiterTotal;

    const redTotal = (Number(salsaRedQty) || 0) * PRICES.salsa;
    const greenTotal = (Number(salsaGreenQty) || 0) * PRICES.salsa;
    const onionTotal = (Number(onionQty) || 0) * PRICES.onion;

    let tortillasTotal = 0;
    let tortillasLabel = 'Ninguno';
    if (tortillasOption && PRICES.tortillas[tortillasOption]) {
      tortillasTotal = PRICES.tortillas[tortillasOption].price;
      tortillasLabel = PRICES.tortillas[tortillasOption].label;
    }

    const extrasTotal = redTotal + greenTotal + onionTotal + tortillasTotal;
    const subtotal = barbacoaTotal + menudoTotal + extrasTotal;
    const fee = Number(shippingFee) || 0;
    const total = subtotal + fee;

    return {
      barbacoaTotal,
      barbacoaLabel,
      menudoHalfTotal,
      menudoLiterTotal,
      menudoTotal,
      extrasTotal,
      tortillasTotal,
      tortillasLabel,
      subtotal,
      fee,
      total,
    };
  }, [
    barbacoaMode,
    barbacoaGrams,
    barbacoaAmount,
    barbacoaPlatillosQty,
    barbacoaPlatillosPrice,
    menudoHalfLiterQty,
    menudoLiterQty,
    salsaRedQty,
    salsaGreenQty,
    onionQty,
    tortillasOption,
    shippingFee,
  ]);

  // ─── Enviar Formulario ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      setErrorMsg('Nombre y teléfono del cliente son requeridos');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const items = {
        barbacoa: calculations.barbacoaTotal > 0 ? [
          {
            type: barbacoaMode,
            amount: barbacoaGrams,
            quantity: barbacoaPlatillosQty,
            unitPrice: barbacoaPlatillosPrice,
            label: calculations.barbacoaLabel,
            price: calculations.barbacoaTotal,
          },
        ] : [],
        menudo: [
          ...(menudoHalfLiterQty > 0 ? [{ size: '0.5L', quantity: menudoHalfLiterQty, label: `${menudoHalfLiterQty} Medio Litro de Menudo`, price: calculations.menudoHalfTotal }] : []),
          ...(menudoLiterQty > 0 ? [{ size: '1L', quantity: menudoLiterQty, label: `${menudoLiterQty} Litro de Menudo`, price: calculations.menudoLiterTotal }] : []),
        ],
        extras: {
          salsaRed: salsaRedQty,
          salsaGreen: salsaGreenQty,
          onion: onionQty,
          tortillas: tortillasOption,
          tortillasLabel: calculations.tortillasLabel,
          tortillasPrice: calculations.tortillasTotal,
        },
      };

      const orderData = {
        client: {
          type: clientType,
          name: clientName,
          phone: clientPhone,
          companyName: clientType === 'empresa' ? companyName : '',
          street,
          number,
          colonia,
        },
        items,
        pricing: {
          subtotal: calculations.subtotal,
          shippingFee: calculations.fee,
          total: calculations.total,
        },
        notes,
      };

      await onSubmitSuccess(orderData);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-form-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-yellow">
              Captura de Orden
            </span>
            <h2 id="order-form-title" className="text-xl font-bold tracking-tight">
              Nuevo Pedido
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Datos del Cliente */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              <span>Datos del Cliente</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setClientType('particular')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  clientType === 'particular'
                    ? 'bg-white border-brand-red text-brand-red shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Particular</span>
              </button>
              <button
                type="button"
                onClick={() => setClientType('empresa')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                  clientType === 'empresa'
                    ? 'bg-white border-brand-red text-brand-red shadow-2xs'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresa</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="client-name"
                label="Nombre del Cliente *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                icon={User}
                required
              />
              <Input
                id="client-phone"
                label="Teléfono *"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="6141234567"
                icon={Phone}
                required
              />
            </div>

            {clientType === 'empresa' && (
              <Input
                id="company-name"
                label="Nombre de la Empresa"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej. Constructora del Norte SA"
                icon={Building2}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                id="street"
                label="Calle"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Av. Juárez"
                icon={MapPin}
              />
              <Input
                id="number"
                label="Número"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="123"
              />
              <Input
                id="colonia"
                label="Colonia"
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                placeholder="Centro"
              />
            </div>
          </div>

          {/* 2. Barbacoa */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Barbacoa</span>
              </h3>
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                Subtotal: ${calculations.barbacoaTotal}
              </span>
            </div>

            <div className="flex gap-2">
              {[
                { id: 'gramos', label: 'Por Gramos' },
                { id: 'monto', label: 'Por Monto ($)' },
                { id: 'platillos', label: 'Por Platillos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setBarbacoaMode(tab.id)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                    barbacoaMode === tab.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {barbacoaMode === 'gramos' && (
              <Input
                id="barbacoa-grams"
                label="Gramos deseados (g)"
                type="number"
                value={barbacoaGrams}
                onChange={(e) => setBarbacoaGrams(e.target.value)}
                placeholder="500"
              />
            )}

            {barbacoaMode === 'monto' && (
              <Input
                id="barbacoa-amount"
                label="Monto deseado ($)"
                type="number"
                value={barbacoaAmount}
                onChange={(e) => setBarbacoaAmount(e.target.value)}
                placeholder="200"
              />
            )}

            {barbacoaMode === 'platillos' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="barbacoa-platillos-qty"
                  label="Cantidad de Platillos"
                  type="number"
                  value={barbacoaPlatillosQty}
                  onChange={(e) => setBarbacoaPlatillosQty(e.target.value)}
                />
                <Input
                  id="barbacoa-platillos-price"
                  label="Precio por Platillo ($)"
                  type="number"
                  value={barbacoaPlatillosPrice}
                  onChange={(e) => setBarbacoaPlatillosPrice(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 3. Menudo */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Soup className="w-4 h-4 text-red-600" />
                <span>Menudo</span>
              </h3>
              <span className="text-xs font-extrabold text-red-900 bg-red-100 px-2.5 py-1 rounded-md">
                Subtotal: ${calculations.menudoTotal}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="menudo-half-liter"
                label="Medio Litro (0.5L) — $65"
                type="number"
                value={menudoHalfLiterQty}
                onChange={(e) => setMenudoHalfLiterQty(e.target.value)}
              />
              <Input
                id="menudo-liter"
                label="Litro Completo (1L) — $120"
                type="number"
                value={menudoLiterQty}
                onChange={(e) => setMenudoLiterQty(e.target.value)}
              />
            </div>
          </div>

          {/* 4. Extras */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Complementos y Extras</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                id="salsa-red"
                label="Salsa Roja (pza - $5)"
                type="number"
                value={salsaRedQty}
                onChange={(e) => setSalsaRedQty(e.target.value)}
              />
              <Input
                id="salsa-green"
                label="Salsa Verde (pza - $5)"
                type="number"
                value={salsaGreenQty}
                onChange={(e) => setSalsaGreenQty(e.target.value)}
              />
              <Input
                id="onion"
                label="Cebolla (porción - $5)"
                type="number"
                value={onionQty}
                onChange={(e) => setOnionQty(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="tortillas-option" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                Paquete de Tortillas
              </label>
              <select
                id="tortillas-option"
                value={tortillasOption}
                onChange={(e) => setTortillasOption(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              >
                <option value="none">Ninguno ($0)</option>
                <option value="5_piezas">5 piezas ($10)</option>
                <option value="10_piezas">10 piezas ($20)</option>
                <option value="medio_kg">1/2 kg ($25)</option>
                <option value="kilo">1 kg ($45)</option>
              </select>
            </div>
          </div>

          {/* 5. Envío y Notas */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Envío e Indicaciones</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                id="shipping-fee"
                label="Costo de Envío ($)"
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(e.target.value)}
                icon={Truck}
              />
              <Input
                id="order-notes"
                label="Notas / Indicaciones"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Sin picante, llamar al entregar"
                icon={FileText}
              />
            </div>
          </div>

          {/* Banner de Resumen de Totales */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Subtotal</span>
              <span className="text-lg font-bold">${calculations.subtotal}</span>
            </div>
            <div className="border-x border-slate-800 px-6">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Envío</span>
              <span className="text-lg font-bold">${calculations.fee}</span>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-brand-yellow block font-semibold">TOTAL PEDIDO</span>
              <span className="text-2xl font-extrabold text-brand-yellow">${calculations.total}</span>
            </div>
          </div>

          {/* Footer Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="md" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              <Save className="w-4 h-4 mr-1.5" />
              <span>Registrar Pedido</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
