/**
 * @module OrderFormModal
 * @description Formulario modular de captura rápida de pedidos para Tacos El Tío.
 *              Incluye:
 *              - Búsqueda por teléfono y autollenado de cliente / colonia.
 *              - Tacos ($24), Gorditas ($26), Tostadas ($26) con 14 guisos y precio especial para Chile Relleno ($30).
 *              - Barbacoa (Por Precio default, Por Gramos con atajos, Por Platillos dinámicos a $480/kg).
 *              - Menudo (selectores 0-10 para Medio Litro $100 y Litro $160).
 *              - Bebidas: Coca-Cola ($24).
 *              - Complementos a $4 (default 0) y paquetes de tortillas ($7, $9, $15, $30).
 *              - Métodos de pago: Efectivo (cálculo de cambio en tiempo real) y Transferencia (pendiente / aceptada).
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
  UtensilsCrossed,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Coffee,
} from 'lucide-react';
import {
  PRICES,
  GUISOS_CATALOG,
  FOOD_ITEM_TYPES,
  PAYMENT_METHODS,
  TRANSFER_STATUS,
} from '../../models/order.model';
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

  // ─── Estado: Tacos, Gorditas y Tostadas ─────────────────────────────────────
  const [preparedItems, setPreparedItems] = useState([]);

  // ─── Estado: Barbacoa (Pestaña por defecto: "monto" / Por Precio) ───────────
  const [barbacoaMode, setBarbacoaMode] = useState('monto');
  const [barbacoaGrams, setBarbacoaGrams] = useState(0);
  const [barbacoaAmount, setBarbacoaAmount] = useState(0);

  // Lista dinámica para Barbacoa por Platillos
  const [barbacoaPlatillosList, setBarbacoaPlatillosList] = useState([]);

  // ─── Estado: Menudo (Selects 0 al 10) ──────────────────────────────────────
  const [menudoHalfLiterQty, setMenudoHalfLiterQty] = useState(0);
  const [menudoLiterQty, setMenudoLiterQty] = useState(0);

  // ─── Estado: Bebidas ────────────────────────────────────────────────────────
  const [cocaColaQty, setCocaColaQty] = useState(0);

  // ─── Estado: Extras (Todos con valor por defecto 0) ────────────────────────
  const [salsaRedQty, setSalsaRedQty] = useState(0);
  const [salsaGreenQty, setSalsaGreenQty] = useState(0);
  const [onionQty, setOnionQty] = useState(0);

  // Tortillas: Cantidad de paquetes x Tipo de paquete (default: none)
  const [tortillasPkgQty, setTortillasPkgQty] = useState(1);
  const [tortillasOption, setTortillasOption] = useState('none');

  // ─── Estado: Envío y Notas ──────────────────────────────────────────────────
  const [shippingFee, setShippingFee] = useState(40);
  const [notes, setNotes] = useState('');

  // ─── Estado: Método de Pago ────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.EFECTIVO);
  const [amountPaid, setAmountPaid] = useState('');
  const [transferStatus, setTransferStatus] = useState(TRANSFER_STATUS.PENDING);

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

  // ─── Métodos para Tacos, Gorditas y Tostadas ──────────────────────────────
  const handleAddPreparedItem = () => {
    setPreparedItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'taco', // taco | gordita | tostada
        variant: 'Maíz', // Maíz | Harina | Natural | Dorada | Tradicional
        guiso: 'barbacoa',
        quantity: 1,
      },
    ]);
  };

  const handleRemovePreparedItem = (id) => {
    setPreparedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdatePreparedItem = (id, field, value) => {
    setPreparedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        // Ajustar variante por defecto si cambia el tipo
        if (field === 'type') {
          if (value === 'taco') updated.variant = 'Maíz';
          else if (value === 'gordita') updated.variant = 'Natural';
          else if (value === 'tostada') updated.variant = 'Tradicional';
        }
        return updated;
      })
    );
  };

  // ─── Métodos para Platillos de Barbacoa Dinámicos ──────────────────────────
  const handleAddPlatilloRow = () => {
    setBarbacoaPlatillosList((prev) => [
      ...prev,
      { id: Date.now().toString(), quantity: 1, unitPrice: 100 },
    ]);
  };

  const handleRemovePlatilloRow = (id) => {
    setBarbacoaPlatillosList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdatePlatilloRow = (id, field, value) => {
    setBarbacoaPlatillosList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: Number(value) || 0 } : p))
    );
  };

  // ─── Cálculo en Tiempo Real ─────────────────────────────────────────────────
  const calculations = useMemo(() => {
    // 1. Tacos, Gorditas, Tostadas
    let preparedItemsTotal = 0;
    const preparedItemsList = [];

    preparedItems.forEach((item) => {
      const qty = Number(item.quantity) || 0;
      if (qty <= 0) return;

      const guisoObj = GUISOS_CATALOG.find((g) => g.id === item.guiso);
      const isChileRelleno = item.guiso === 'chiles_rellenos';

      // Precio unitario: $30 si es Chile Relleno, sino basePrice según el producto
      const unitPrice = isChileRelleno
        ? PRICES.chileRelleno
        : item.type === 'taco'
        ? PRICES.taco
        : item.type === 'gordita'
        ? PRICES.gordita
        : PRICES.tostada;

      const rowTotal = qty * unitPrice;
      preparedItemsTotal += rowTotal;

      const typeLabel =
        item.type === 'taco'
          ? `Taco (${item.variant})`
          : item.type === 'gordita'
          ? `Gordita (${item.variant})`
          : 'Tostada';

      preparedItemsList.push({
        id: item.id,
        type: item.type,
        variant: item.variant,
        guiso: guisoObj ? guisoObj.name : item.guiso,
        quantity: qty,
        unitPrice,
        price: rowTotal,
        label: `${qty}x ${typeLabel} de ${guisoObj?.name || item.guiso}`,
      });
    });

    // 2. Barbacoa
    let barbacoaTotal = 0;
    const barbacoaItems = [];

    if (barbacoaMode === 'gramos') {
      const g = Number(barbacoaGrams) || 0;
      barbacoaTotal = Math.round((g / 1000) * PRICES.barbacoaPerKg);
      if (barbacoaTotal > 0) {
        barbacoaItems.push({
          type: 'gramos',
          amount: g,
          label: `${g}g de Barbacoa`,
          price: barbacoaTotal,
        });
      }
    } else if (barbacoaMode === 'monto') {
      barbacoaTotal = Number(barbacoaAmount) || 0;
      if (barbacoaTotal > 0) {
        barbacoaItems.push({
          type: 'monto',
          amount: barbacoaTotal,
          label: `Barbacoa por Precio ($${barbacoaTotal})`,
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
    }

    // 3. Menudo
    const menudoHalfTotal = (Number(menudoHalfLiterQty) || 0) * PRICES.menudoHalfLiter;
    const menudoLiterTotal = (Number(menudoLiterQty) || 0) * PRICES.menudoLiter;
    const menudoTotal = menudoHalfTotal + menudoLiterTotal;

    // 4. Bebidas
    const drinksTotal = (Number(cocaColaQty) || 0) * PRICES.cocaCola;

    // 5. Extras ($4 cada uno)
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
    const tortillasTotal =
      tortillasOption === 'none' ? 0 : tortillasPkgCount * tortillasUnitTotal;

    const extrasTotal = redTotal + greenTotal + onionTotal + tortillasTotal;

    // 6. Subtotal y Total
    const subtotal =
      preparedItemsTotal + barbacoaTotal + menudoTotal + drinksTotal + extrasTotal;
    const fee = Number(shippingFee) || 0;
    const total = subtotal + fee;

    // 7. Cálculo de Cambio en Efectivo
    const paidNum = parseFloat(amountPaid) || 0;
    const change = paidNum > 0 ? Math.max(0, paidNum - total) : 0;
    const isUnderpaid = paidNum > 0 && paidNum < total;

    return {
      preparedItemsTotal,
      preparedItemsList,
      barbacoaTotal,
      barbacoaItems,
      menudoHalfTotal,
      menudoLiterTotal,
      menudoTotal,
      drinksTotal,
      extrasTotal,
      tortillasTotal,
      tortillasOptionLabel,
      tortillasPkgCount,
      subtotal,
      fee,
      total,
      paidNum,
      change,
      isUnderpaid,
    };
  }, [
    preparedItems,
    barbacoaMode,
    barbacoaGrams,
    barbacoaAmount,
    barbacoaPlatillosList,
    menudoHalfLiterQty,
    menudoLiterQty,
    cocaColaQty,
    salsaRedQty,
    salsaGreenQty,
    onionQty,
    tortillasPkgQty,
    tortillasOption,
    shippingFee,
    amountPaid,
  ]);

  // ─── Enviar Formulario ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      setErrorMsg('Nombre y teléfono del cliente son requeridos');
      return;
    }

    if (calculations.total <= 0) {
      setErrorMsg('Debe seleccionar al menos un producto en el pedido');
      return;
    }

    if (paymentMethod === PAYMENT_METHODS.EFECTIVO && calculations.isUnderpaid) {
      setErrorMsg(
        `El monto pagado ($${calculations.paidNum}) es menor al total del pedido ($${calculations.total})`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const items = {
        preparedItems: calculations.preparedItemsList,
        barbacoa: calculations.barbacoaItems,
        menudo: [
          ...(menudoHalfLiterQty > 0
            ? [
                {
                  size: '0.5L',
                  quantity: menudoHalfLiterQty,
                  label: `${menudoHalfLiterQty} Medio Litro de Menudo`,
                  price: calculations.menudoHalfTotal,
                },
              ]
            : []),
          ...(menudoLiterQty > 0
            ? [
                {
                  size: '1L',
                  quantity: menudoLiterQty,
                  label: `${menudoLiterQty} Litro de Menudo`,
                  price: calculations.menudoLiterTotal,
                },
              ]
            : []),
        ],
        drinks: [
          ...(cocaColaQty > 0
            ? [
                {
                  name: 'Coca-Cola',
                  quantity: cocaColaQty,
                  unitPrice: PRICES.cocaCola,
                  price: calculations.drinksTotal,
                  label: `${cocaColaQty} Coca-Cola ($${PRICES.cocaCola} c/u)`,
                },
              ]
            : []),
        ],
        extras: {
          salsaRed: salsaRedQty,
          salsaGreen: salsaGreenQty,
          onion: onionQty,
          tortillas: tortillasOption,
          tortillasPkgQty: calculations.tortillasPkgCount,
          tortillasLabel:
            tortillasOption === 'none'
              ? 'Ninguno'
              : `${calculations.tortillasPkgCount} paquete(s) de ${calculations.tortillasOptionLabel}`,
          tortillasPrice: calculations.tortillasTotal,
        },
      };

      const payment = {
        method: paymentMethod,
        amountPaid:
          paymentMethod === PAYMENT_METHODS.EFECTIVO ? calculations.paidNum : null,
        change:
          paymentMethod === PAYMENT_METHODS.EFECTIVO ? calculations.change : null,
        transferStatus:
          paymentMethod === PAYMENT_METHODS.TRANSFERENCIA ? transferStatus : null,
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
        payment,
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-form-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-brand-red text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-yellow">
              Captura Rápida
            </span>
            <h2 id="order-form-title" className="text-xl font-bold tracking-tight">
              Registrar Nuevo Pedido
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="text-white/80 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div
              className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800 font-medium"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Datos del Cliente */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-red" />
                <span>Datos del Cliente y Entrega</span>
              </h3>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setClientType('particular')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    clientType === 'particular'
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Particular
                </button>
                <button
                  type="button"
                  onClick={() => setClientType('empresa')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    clientType === 'empresa'
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Empresa
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="relative">
                <Input
                  id="client-phone"
                  name="phone"
                  label="Teléfono (Búsqueda automática)"
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="6141234567"
                  icon={Phone}
                  required
                />
                {isSearchingClient && (
                  <span className="absolute right-3 top-8 text-[11px] text-slate-400">
                    Buscando...
                  </span>
                )}
                {clientFound && (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Cliente recurrente autocompletado
                  </span>
                )}
              </div>

              <Input
                id="client-name"
                name="name"
                label={clientType === 'empresa' ? 'Persona de Contacto' : 'Nombre del Cliente'}
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nombre completo"
                icon={User}
                required
              />

              {clientType === 'empresa' && (
                <Input
                  id="client-company"
                  name="companyName"
                  label="Razón Social / Empresa"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Empresa o Negocio"
                  icon={Building2}
                  required
                />
              )}

              <Input
                id="client-street"
                name="street"
                label="Calle"
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Av. Universidad"
                icon={MapPin}
              />

              <Input
                id="client-number"
                name="number"
                label="Número"
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1402 int 3"
              />

              <Input
                id="client-colonia"
                name="colonia"
                label="Colonia (Tarifa auto)"
                type="text"
                value={colonia}
                onChange={(e) => handleColoniaChange(e.target.value)}
                placeholder="Centro"
              />
            </div>
          </section>

          {/* 2. Tacos, Gorditas y Tostadas */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-brand-red" />
                  <span>Tacos, Gorditas y Tostadas</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tacos $24 (maíz o harina), Gorditas $26 (natural o dorada), Tostadas $26. Chiles rellenos $30 c/u.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPreparedItem}
                className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-brand-red" />
                <span>Agregar Platillo</span>
              </Button>
            </div>

            {preparedItems.length === 0 ? (
              <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center text-xs text-slate-400">
                No hay tacos ni gorditas agregados. Haz clic en &ldquo;Agregar Platillo&rdquo; para ordenar piezas individuales.
              </div>
            ) : (
              <div className="space-y-2.5">
                {preparedItems.map((item, idx) => {
                  const isChile = item.guiso === 'chiles_rellenos';
                  const unitPrice = isChile
                    ? PRICES.chileRelleno
                    : item.type === 'taco'
                    ? PRICES.taco
                    : item.type === 'gordita'
                    ? PRICES.gordita
                    : PRICES.tostada;
                  const rowTotal = (Number(item.quantity) || 0) * unitPrice;

                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs"
                    >
                      {/* Tipo de Producto */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Producto
                        </label>
                        <select
                          value={item.type}
                          onChange={(e) => handleUpdatePreparedItem(item.id, 'type', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-red"
                        >
                          <option value="taco">Taco ($24)</option>
                          <option value="gordita">Gordita ($26)</option>
                          <option value="tostada">Tostada ($26)</option>
                        </select>
                      </div>

                      {/* Variante */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Presentación
                        </label>
                        {item.type === 'taco' ? (
                          <select
                            value={item.variant}
                            onChange={(e) => handleUpdatePreparedItem(item.id, 'variant', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                          >
                            <option value="Maíz">Maíz</option>
                            <option value="Harina">Harina</option>
                          </select>
                        ) : item.type === 'gordita' ? (
                          <select
                            value={item.variant}
                            onChange={(e) => handleUpdatePreparedItem(item.id, 'variant', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-red"
                          >
                            <option value="Natural">Natural</option>
                            <option value="Dorada">Dorada</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            disabled
                            value="Tradicional"
                            className="w-full bg-slate-100 border border-slate-200 rounded-md p-1.5 text-xs text-slate-500"
                          />
                        )}
                      </div>

                      {/* Guiso */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Guiso (14 disponibles)
                        </label>
                        <select
                          value={item.guiso}
                          onChange={(e) => handleUpdatePreparedItem(item.id, 'guiso', e.target.value)}
                          className={`w-full border rounded-md p-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-red ${
                            isChile
                              ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                              : 'bg-slate-50 border-slate-300'
                          }`}
                        >
                          {GUISOS_CATALOG.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} {g.specialPrice ? `($${g.specialPrice} c/u)` : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad */}
                      <div className="sm:col-span-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Cant.
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleUpdatePreparedItem(item.id, 'quantity', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-md p-1.5 text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-brand-red"
                        />
                      </div>

                      {/* Subtotal y Eliminar */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-4">
                        <span className="font-extrabold text-slate-900 text-xs">
                          ${rowTotal}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePreparedItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          aria-label="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. Barbacoa */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-brand-red" />
                <span>Barbacoa ($480 / kg)</span>
              </h3>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setBarbacoaMode('monto')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    barbacoaMode === 'monto'
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Precio ($)
                </button>
                <button
                  type="button"
                  onClick={() => setBarbacoaMode('gramos')}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    barbacoaMode === 'gramos'
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Gramos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBarbacoaMode('platillos');
                    if (barbacoaPlatillosList.length === 0) handleAddPlatilloRow();
                  }}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    barbacoaMode === 'platillos'
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Por Platillos
                </button>
              </div>
            </div>

            {/* Modo 1: Por Monto (Default) */}
            {barbacoaMode === 'monto' && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Monto a despachar en Pesos ($):
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative max-w-xs w-full">
                    <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={barbacoaAmount || ''}
                      onChange={(e) => setBarbacoaAmount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Equivalente aprox: {barbacoaAmount > 0 ? Math.round((barbacoaAmount / PRICES.barbacoaPerKg) * 1000) : 0}g
                  </span>
                </div>
              </div>
            )}

            {/* Modo 2: Por Gramos con atajos */}
            {barbacoaMode === 'gramos' && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">
                  Seleccione o escriba el gramaje:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBarbacoaGrams(500)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      barbacoaGrams === 500
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    1/2 kg (500g) — $240
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarbacoaGrams(1000)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      barbacoaGrams === 1000
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    1 kg (1000g) — $480
                  </button>
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={barbacoaGrams || ''}
                      onChange={(e) => setBarbacoaGrams(Number(e.target.value) || 0)}
                      placeholder="Gramos"
                      className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-brand-red"
                    />
                    <span className="text-xs text-slate-500 font-medium">gramos</span>
                  </div>
                </div>
              </div>
            )}

            {/* Modo 3: Por Platillos dinámicos */}
            {barbacoaMode === 'platillos' && (
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">
                    Grupos de Platillos (Ej. 5 platillos de $100):
                  </span>
                  <button
                    type="button"
                    onClick={handleAddPlatilloRow}
                    className="inline-flex items-center gap-1 text-xs text-brand-red font-bold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar otro grupo</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {barbacoaPlatillosList.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <label className="text-slate-500">Cantidad:</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={p.quantity}
                          onChange={(e) => handleUpdatePlatilloRow(p.id, 'quantity', e.target.value)}
                          className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-center font-bold"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-slate-500">Precio c/u ($):</label>
                        <input
                          type="number"
                          min="10"
                          step="10"
                          value={p.unitPrice}
                          onChange={(e) => handleUpdatePlatilloRow(p.id, 'unitPrice', e.target.value)}
                          className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-center font-bold"
                        />
                      </div>
                      <span className="font-extrabold text-slate-800 ml-auto">
                        = ${p.quantity * p.unitPrice}
                      </span>
                      {barbacoaPlatillosList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlatilloRow(p.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Eliminar grupo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 4. Menudo */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-3">
              <Soup className="w-4 h-4 text-brand-red" />
              <span>Menudo</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Medio Litro</span>
                  <span className="text-[11px] text-slate-500">${PRICES.menudoHalfLiter} c/u</span>
                </div>
                <select
                  value={menudoHalfLiterQty}
                  onChange={(e) => setMenudoHalfLiterQty(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-red cursor-pointer"
                >
                  {[...Array(11).keys()].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Litro</span>
                  <span className="text-[11px] text-slate-500">${PRICES.menudoLiter} c/u</span>
                </div>
                <select
                  value={menudoLiterQty}
                  onChange={(e) => setMenudoLiterQty(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-red cursor-pointer"
                >
                  {[...Array(11).keys()].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 5. Bebidas y Refrescos */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-3">
              <Coffee className="w-4 h-4 text-brand-red" />
              <span>Bebidas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Coca-Cola</span>
                  <span className="text-[11px] text-slate-500">${PRICES.cocaCola} c/u</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={cocaColaQty}
                    onChange={(e) => setCocaColaQty(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-red cursor-pointer"
                  >
                    {[...Array(21).keys()].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-extrabold text-slate-900 w-12 text-right">
                    ${cocaColaQty * PRICES.cocaCola}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Complementos y Tortillas */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-3">
              <PlusCircle className="w-4 h-4 text-brand-red" />
              <span>Complementos y Tortillas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Salsa Roja</span>
                  <span className="text-[10px] text-slate-500">${PRICES.salsa} c/pza</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={salsaRedQty}
                  onChange={(e) => setSalsaRedQty(Number(e.target.value) || 0)}
                  className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-center"
                />
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Salsa Verde</span>
                  <span className="text-[10px] text-slate-500">${PRICES.salsa} c/pza</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={salsaGreenQty}
                  onChange={(e) => setSalsaGreenQty(Number(e.target.value) || 0)}
                  className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-center"
                />
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Cebolla</span>
                  <span className="text-[10px] text-slate-500">${PRICES.onion} c/pza</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={onionQty}
                  onChange={(e) => setOnionQty(Number(e.target.value) || 0)}
                  className="w-14 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-xs font-bold text-center"
                />
              </div>
            </div>

            {/* Tortillas: Paquetes */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Paquetes de Tortillas</span>
                <span className="text-[11px] text-slate-500">
                  5 pzas ($7) | 10 pzas ($9) | 1/2 kg ($15) | 1 kg ($30)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <label className="text-slate-500">Paquetes:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tortillasPkgQty}
                    onChange={(e) => setTortillasPkgQty(Number(e.target.value) || 1)}
                    className="w-12 px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-center font-bold"
                  />
                </div>

                <select
                  value={tortillasOption}
                  onChange={(e) => setTortillasOption(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer"
                >
                  <option value="none">Ninguno ($0)</option>
                  <option value="5_piezas">5 piezas ($7)</option>
                  <option value="10_piezas">10 piezas ($9)</option>
                  <option value="medio_kg">1/2 kg ($15)</option>
                  <option value="kilo">1 kg ($30)</option>
                </select>

                <span className="font-extrabold text-slate-900 w-14 text-right">
                  ${calculations.tortillasTotal}
                </span>
              </div>
            </div>
          </section>

          {/* 7. Envío y Notas */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <Input
                  id="shipping-fee"
                  name="shippingFee"
                  label="Tarifa de Envío ($)"
                  type="number"
                  min="0"
                  step="5"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                  icon={Truck}
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  id="order-notes"
                  name="notes"
                  label="Notas de Entrega o Instrucciones"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sin cebolla, tocar portón negro..."
                  icon={FileText}
                />
              </div>
            </div>
          </section>

          {/* 8. Método de Pago */}
          <section className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-brand-red" />
                <span>Método de Pago</span>
              </h3>

              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.EFECTIVO)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                    paymentMethod === PAYMENT_METHODS.EFECTIVO
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Efectivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod(PAYMENT_METHODS.TRANSFERENCIA)}
                  className={`px-3 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                    paymentMethod === PAYMENT_METHODS.TRANSFERENCIA
                      ? 'bg-brand-red text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transferencia</span>
                </button>
              </div>
            </div>

            {paymentMethod === PAYMENT_METHODS.EFECTIVO ? (
              <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      ¿Con cuánto pagará el cliente? ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="Ej. 500"
                        className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-brand-red"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                      Cambio a Devolver
                    </span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span
                        className={`text-xl font-black ${
                          calculations.isUnderpaid
                            ? 'text-red-600'
                            : calculations.paidNum > 0
                            ? 'text-emerald-600'
                            : 'text-slate-700'
                        }`}
                      >
                        ${calculations.change.toFixed(2)}
                      </span>
                      {calculations.isUnderpaid && (
                        <span className="text-[10px] text-red-600 font-bold">
                          Faltan ${(calculations.total - calculations.paidNum).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Estado de la Transferencia
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Selecciona si ya fue confirmada o está en validación
                  </p>
                </div>

                <select
                  value={transferStatus}
                  onChange={(e) => setTransferStatus(e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                    transferStatus === TRANSFER_STATUS.ACCEPTED
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}
                >
                  <option value={TRANSFER_STATUS.PENDING}>Pendiente de Confirmar</option>
                  <option value={TRANSFER_STATUS.ACCEPTED}>Aceptada / Validada</option>
                </select>
              </div>
            )}
          </section>

          {/* 9. Resumen Financiero en Vivo */}
          <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="text-slate-300 flex items-center gap-2">
                <span>Subtotal productos:</span>
                <span className="font-bold text-white">${calculations.subtotal}</span>
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span>Cargo por envío:</span>
                <span className="font-bold text-white">${calculations.fee}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-brand-yellow uppercase tracking-wider block">
                Total a Cobrar
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white">
                ${calculations.total}
              </span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={calculations.total <= 0 || (paymentMethod === PAYMENT_METHODS.EFECTIVO && calculations.isUnderpaid)}
            >
              <Save className="w-4 h-4 mr-2" />
              <span>Guardar y Levantar Pedido</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
