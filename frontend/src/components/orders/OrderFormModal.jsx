/**
 * @module OrderFormModal
 * @description Formulario modular de captura rápida de pedidos.
 *              Incluye búsqueda por teléfono, autollenado de cliente y envío por colonia,
 *              múltiples platillos de barbacoa, selectores de menudo 0-10 y paquetes de tortillas.
 */
import { useState, useMemo, useEffect, useCallback } from 'react';
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
  Search,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { PRICES } from '../../models/order.model';
import {
  searchClientByPhoneRequest,
  fetchShippingFeeByColoniaRequest,
} from '../../services/clientService';
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

  // ─── Estado del Cliente ─────────────────────────────────────────────────────
  const [clientType, setClientType] = useState('particular');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [colonia, setColonia] = useState('');

  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [clientFound, setClientFound] = useState(false);

  // ─── Estado de Productos ───────────────────────────────────────────────────

  // Barbacoa: Pestaña por defecto "monto" (Por Precio $)
  const [barbacoaMode, setBarbacoaMode] = useState('monto');
  const [barbacoaGrams, setBarbacoaGrams] = useState(500);
  const [barbacoaAmount, setBarbacoaAmount] = useState(200);

  // Lista dinámica para Barbacoa por Platillos (Múltiples platillos)
  const [barbacoaPlatillosList, setBarbacoaPlatillosList] = useState([
    { id: '1', quantity: 1, unitPrice: 100 },
  ]);

  // Menudo (Selects 0 al 10)
  const [menudoHalfLiterQty, setMenudoHalfLiterQty] = useState(0);
  const [menudoLiterQty, setMenudoLiterQty] = useState(0);

  // Extras
  const [salsaRedQty, setSalsaRedQty] = useState(1);
  const [salsaGreenQty, setSalsaGreenQty] = useState(1);
  const [onionQty, setOnionQty] = useState(1);

  // Tortillas: Cantidad de paquetes x Tipo de paquete
  const [tortillasPkgQty, setTortillasPkgQty] = useState(1);
  const [tortillasOption, setTortillasOption] = useState('10_piezas');

  // Envío y Notas
  const [shippingFee, setShippingFee] = useState(40);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ─── Búsqueda Automática de Cliente por Teléfono ────────────────────────────
  const handlePhoneChange = useCallback(async (newPhone) => {
    setClientPhone(newPhone);
    const cleaned = newPhone.trim();

    if (cleaned.length >= 7) {
      setIsSearchingClient(true);
      try {
        const found = await searchClientByPhoneRequest(cleaned);
        if (found) {
          setClientName(found.name || '');
          setClientType(found.type || 'particular');
          setCompanyName(found.companyName || '');
          setStreet(found.street || '');
          setNumber(found.number || '');
          setColonia(found.colonia || '');
          setClientFound(true);

          if (found.colonia) {
            const fee = await fetchShippingFeeByColoniaRequest(found.colonia);
            if (fee !== null && fee !== undefined) {
              setShippingFee(fee);
            }
          }
        } else {
          setClientFound(false);
        }
      } catch (err) {
        console.error('Error al buscar cliente por teléfono:', err);
      } finally {
        setIsSearchingClient(false);
      }
    } else {
      setClientFound(false);
    }
  }, []);

  // ─── Búsqueda de Envío por Colonia ─────────────────────────────────────────
  const handleColoniaChange = useCallback(async (newColonia) => {
    setColonia(newColonia);
    if (newColonia.trim().length >= 3) {
      try {
        const fee = await fetchShippingFeeByColoniaRequest(newColonia);
        if (fee !== null && fee !== undefined) {
          setShippingFee(fee);
        }
      } catch (err) {
        console.error('Error al consultar tarifa por colonia:', err);
      }
    }
  }, []);

  // ─── Métodos para Platillos de Barbacoa Dinámicos ──────────────────────────
  const handleAddPlatilloRow = () => {
    setBarbacoaPlatillosList((prev) => [
      ...prev,
      { id: Date.now().toString(), quantity: 1, unitPrice: 100 },
    ]);
  };

  const handleRemovePlatilloRow = (id) => {
    if (barbacoaPlatillosList.length === 1) return;
    setBarbacoaPlatillosList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlatilloRow = (id, field, value) => {
    setBarbacoaPlatillosList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: Number(value) || 0 } : p))
    );
  };

  // ─── Cálculo en Tiempo Real ─────────────────────────────────────────────────
  const calculations = useMemo(() => {
    let barbacoaTotal = 0;
    let barbacoaLabel = '';
    const barbacoaItems = [];

    if (barbacoaMode === 'gramos') {
      const g = Number(barbacoaGrams) || 0;
      barbacoaTotal = Math.round((g / 1000) * PRICES.barbacoaPerKg);
      barbacoaLabel = `${g}g de Barbacoa`;
      if (barbacoaTotal > 0) {
        barbacoaItems.push({
          type: 'gramos',
          amount: g,
          label: barbacoaLabel,
          price: barbacoaTotal,
        });
      }
    } else if (barbacoaMode === 'monto') {
      barbacoaTotal = Number(barbacoaAmount) || 0;
      barbacoaLabel = `Barbacoa por Precio ($${barbacoaTotal})`;
      if (barbacoaTotal > 0) {
        barbacoaItems.push({
          type: 'monto',
          amount: barbacoaTotal,
          label: barbacoaLabel,
          price: barbacoaTotal,
        });
      }
    } else if (barbacoaMode === 'platillos') {
      barbacoaPlatillosList.forEach((p) => {
        const rowTotal = p.quantity * p.unitPrice;
        if (rowTotal > 0) {
          barbacoaTotal += rowTotal;
          barbacoaItems.push({
            type: 'platillo',
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            label: `${p.quantity} Platillo(s) de Barbacoa de $${p.unitPrice} c/u`,
            price: rowTotal,
          });
        }
      });
      barbacoaLabel = `${barbacoaItems.length} grupo(s) de platillos`;
    }

    const menudoHalfTotal = (Number(menudoHalfLiterQty) || 0) * PRICES.menudoHalfLiter;
    const menudoLiterTotal = (Number(menudoLiterQty) || 0) * PRICES.menudoLiter;
    const menudoTotal = menudoHalfTotal + menudoLiterTotal;

    const redTotal = (Number(salsaRedQty) || 0) * PRICES.salsa;
    const greenTotal = (Number(salsaGreenQty) || 0) * PRICES.salsa;
    const onionTotal = (Number(onionQty) || 0) * PRICES.onion;

    let tortillasUnitTotal = 0;
    let tortillasOptionLabel = 'Ninguno';
    if (tortillasOption && PRICES.tortillas[tortillasOption]) {
      tortillasUnitTotal = PRICES.tortillas[tortillasOption].price;
      tortillasOptionLabel = PRICES.tortillas[tortillasOption].label;
    }
    const tortillasPkgCount = Number(tortillasPkgQty) || 0;
    const tortillasTotal = tortillasOption === 'none' ? 0 : tortillasPkgCount * tortillasUnitTotal;

    const extrasTotal = redTotal + greenTotal + onionTotal + tortillasTotal;
    const subtotal = barbacoaTotal + menudoTotal + extrasTotal;
    const fee = Number(shippingFee) || 0;
    const total = subtotal + fee;

    return {
      barbacoaTotal,
      barbacoaItems,
      menudoHalfTotal,
      menudoLiterTotal,
      menudoTotal,
      extrasTotal,
      tortillasTotal,
      tortillasOptionLabel,
      tortillasPkgCount,
      subtotal,
      fee,
      total,
    };
  }, [
    barbacoaMode,
    barbacoaGrams,
    barbacoaAmount,
    barbacoaPlatillosList,
    menudoHalfLiterQty,
    menudoLiterQty,
    salsaRedQty,
    salsaGreenQty,
    onionQty,
    tortillasPkgQty,
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
        barbacoa: calculations.barbacoaItems,
        menudo: [
          ...(menudoHalfLiterQty > 0 ? [{ size: '0.5L', quantity: menudoHalfLiterQty, label: `${menudoHalfLiterQty} Medio Litro de Menudo`, price: calculations.menudoHalfTotal }] : []),
          ...(menudoLiterQty > 0 ? [{ size: '1L', quantity: menudoLiterQty, label: `${menudoLiterQty} Litro de Menudo`, price: calculations.menudoLiterTotal }] : []),
        ],
        extras: {
          salsaRed: salsaRedQty,
          salsaGreen: salsaGreenQty,
          onion: onionQty,
          tortillas: tortillasOption,
          tortillasPkgQty: calculations.tortillasPkgCount,
          tortillasLabel: `${calculations.tortillasPkgCount} paquete(s) de ${calculations.tortillasOptionLabel}`,
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
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-slate-500" />
                <span>Datos del Cliente / Empresa</span>
              </h3>

              {clientFound && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Cliente registrado</span>
                </span>
              )}
            </div>

            {/* Selector Tipo Cliente */}
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

            {/* Inputs Teléfono & Nombre */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Input
                  id="client-phone"
                  label="Teléfono *"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="6141234567"
                  icon={Phone}
                  required
                />
                {isSearchingClient && (
                  <div className="absolute right-3 top-8 text-slate-400">
                    <Search className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              <Input
                id="client-name"
                label="Nombre del Cliente *"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                icon={User}
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

            {/* Dirección */}
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
                onChange={(e) => handleColoniaChange(e.target.value)}
                placeholder="Centro"
              />
            </div>
          </div>

          {/* 2. Barbacoa ($480 / kg) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>Barbacoa ($480/kg)</span>
              </h3>
              <span className="text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                Subtotal Barbacoa: ${calculations.barbacoaTotal}
              </span>
            </div>

            <div className="flex gap-2">
              {[
                { id: 'monto', label: 'Por Precio ($)' },
                { id: 'gramos', label: 'Por Gramos' },
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

            {/* Pestaña Por Precio ($) */}
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

            {/* Pestaña Por Gramos */}
            {barbacoaMode === 'gramos' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBarbacoaGrams(500)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      Number(barbacoaGrams) === 500
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    1/2 kg (500g)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarbacoaGrams(1000)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      Number(barbacoaGrams) === 1000
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    1 kg (1000g)
                  </button>
                </div>

                <Input
                  id="barbacoa-grams"
                  label="Gramos personalizados (g)"
                  type="number"
                  value={barbacoaGrams}
                  onChange={(e) => setBarbacoaGrams(e.target.value)}
                  placeholder="Ej. 750"
                />
              </div>
            )}

            {/* Pestaña Por Platillos (Filas dinámicas) */}
            {barbacoaMode === 'platillos' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  {barbacoaPlatillosList.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="w-32">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={p.quantity}
                          onChange={(e) => handleUpdatePlatilloRow(p.id, 'quantity', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>

                      <div className="flex-1">
                        <label className="text-[10px] font-semibold text-slate-500 block uppercase">
                          Precio c/u ($)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={p.unitPrice}
                          onChange={(e) => handleUpdatePlatilloRow(p.id, 'unitPrice', e.target.value)}
                          className="w-full text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-red/20"
                        />
                      </div>

                      <div className="text-right w-24">
                        <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                        <span className="text-xs font-bold text-slate-900">${p.quantity * p.unitPrice}</span>
                      </div>

                      {barbacoaPlatillosList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlatilloRow(p.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50"
                          aria-label="Eliminar platillo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddPlatilloRow}
                  className="w-full"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Agregar otro platillo</span>
                </Button>
              </div>
            )}
          </div>

          {/* 3. Menudo ($100 Medio Litro / $160 Litro) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Soup className="w-4 h-4 text-red-600" />
                <span>Menudo</span>
              </h3>
              <span className="text-xs font-extrabold text-red-900 bg-red-100 px-2.5 py-1 rounded-md">
                Subtotal Menudo: ${calculations.menudoTotal}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="menudo-half-liter" className="text-xs font-semibold text-slate-700 tracking-wide">
                  Medio litro ($100)
                </label>
                <select
                  id="menudo-half-liter"
                  value={menudoHalfLiterQty}
                  onChange={(e) => setMenudoHalfLiterQty(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'porción' : 'porciones'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="menudo-liter" className="text-xs font-semibold text-slate-700 tracking-wide">
                  Litro ($160)
                </label>
                <select
                  id="menudo-liter"
                  value={menudoLiterQty}
                  onChange={(e) => setMenudoLiterQty(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'porción' : 'porciones'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 4. Extras & Complementos */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Complementos y Extras</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                id="salsa-red"
                label="Salsa Roja (piezas - $5)"
                type="number"
                value={salsaRedQty}
                onChange={(e) => setSalsaRedQty(e.target.value)}
              />
              <Input
                id="salsa-green"
                label="Salsa Verde (piezas - $5)"
                type="number"
                value={salsaGreenQty}
                onChange={(e) => setSalsaGreenQty(e.target.value)}
              />
              <Input
                id="onion"
                label="Cebolla (piezas - $5)"
                type="number"
                value={onionQty}
                onChange={(e) => setOnionQty(e.target.value)}
              />
            </div>

            {/* Tortillas: Cantidad + Paquete */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-200">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tortillas-pkg-qty" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Cantidad de Paquetes
                </label>
                <select
                  id="tortillas-pkg-qty"
                  value={tortillasPkgQty}
                  onChange={(e) => setTortillasPkgQty(Number(e.target.value))}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'paquete' : 'paquetes'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="tortillas-option" className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  Tipo de Paquete
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
          </div>

          {/* 5. Envío e Indicaciones */}
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
