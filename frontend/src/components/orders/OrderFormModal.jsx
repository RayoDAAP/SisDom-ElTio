/**
 * @module OrderFormModal
 * @description Formulario modular para registrar pedidos en el portal de trabajadores.
 */
import { useState, useMemo } from 'react';
import { PRICES } from '../../models/order.model';

const OrderFormModal = ({ onClose, onSubmitSuccess }) => {
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
  const [tortillasOption, setTortillasOption] = useState('10_piezas'); // none, 5_piezas, 10_piezas, medio_kg, kilo

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-container--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="modal-subtitle">Captura Rápida</span>
            <h2 className="modal-title">🌮 Nuevo Pedido</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body form-grid">
          {errorMsg && <div className="login-form__error">{errorMsg}</div>}

          {/* 1. Datos del Cliente */}
          <div className="form-card">
            <h3 className="section-heading">👤 Datos del Cliente</h3>
            <div className="radio-toggle">
              <label className={`toggle-option ${clientType === 'particular' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="clientType"
                  value="particular"
                  checked={clientType === 'particular'}
                  onChange={() => setClientType('particular')}
                />
                🏠 Particular
              </label>
              <label className={`toggle-option ${clientType === 'empresa' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="clientType"
                  value="empresa"
                  checked={clientType === 'empresa'}
                  onChange={() => setClientType('empresa')}
                />
                🏢 Empresa
              </label>
            </div>

            <div className="input-row-2">
              <div>
                <label className="input-group__label">Nombre del Cliente *</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="input-group__label">Teléfono *</label>
                <input
                  type="tel"
                  className="input-group__field"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="6141234567"
                  required
                />
              </div>
            </div>

            {clientType === 'empresa' && (
              <div style={{ marginTop: '0.5rem' }}>
                <label className="input-group__label">Nombre de la Empresa</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej. Constructora del Norte"
                />
              </div>
            )}

            <div className="input-row-3" style={{ marginTop: '0.5rem' }}>
              <div>
                <label className="input-group__label">Calle</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Av. Juárez"
                />
              </div>
              <div>
                <label className="input-group__label">Número</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="123"
                />
              </div>
              <div>
                <label className="input-group__label">Colonia</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={colonia}
                  onChange={(e) => setColonia(e.target.value)}
                  placeholder="Centro"
                />
              </div>
            </div>
          </div>

          {/* 2. Barbacoa */}
          <div className="form-card">
            <h3 className="section-heading">🥩 Barbacoa</h3>
            <div className="tab-buttons">
              <button
                type="button"
                className={`tab-btn ${barbacoaMode === 'gramos' ? 'active' : ''}`}
                onClick={() => setBarbacoaMode('gramos')}
              >
                Por Gramos
              </button>
              <button
                type="button"
                className={`tab-btn ${barbacoaMode === 'monto' ? 'active' : ''}`}
                onClick={() => setBarbacoaMode('monto')}
              >
                Por Monto ($)
              </button>
              <button
                type="button"
                className={`tab-btn ${barbacoaMode === 'platillos' ? 'active' : ''}`}
                onClick={() => setBarbacoaMode('platillos')}
              >
                Por Platillos
              </button>
            </div>

            {barbacoaMode === 'gramos' && (
              <div className="input-row-2" style={{ marginTop: '0.5rem' }}>
                <div>
                  <label className="input-group__label">Gramos (g)</label>
                  <input
                    type="number"
                    step="50"
                    className="input-group__field"
                    value={barbacoaGrams}
                    onChange={(e) => setBarbacoaGrams(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-group__label">Precio estimado</label>
                  <div className="price-badge">${calculations.barbacoaTotal}</div>
                </div>
              </div>
            )}

            {barbacoaMode === 'monto' && (
              <div className="input-row-2" style={{ marginTop: '0.5rem' }}>
                <div>
                  <label className="input-group__label">Monto deseado ($)</label>
                  <input
                    type="number"
                    step="10"
                    className="input-group__field"
                    value={barbacoaAmount}
                    onChange={(e) => setBarbacoaAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-group__label">Total Barbacoa</label>
                  <div className="price-badge">${calculations.barbacoaTotal}</div>
                </div>
              </div>
            )}

            {barbacoaMode === 'platillos' && (
              <div className="input-row-2" style={{ marginTop: '0.5rem' }}>
                <div>
                  <label className="input-group__label">Cantidad de Platillos</label>
                  <input
                    type="number"
                    min="1"
                    className="input-group__field"
                    value={barbacoaPlatillosQty}
                    onChange={(e) => setBarbacoaPlatillosQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="input-group__label">Precio por Platillo ($)</label>
                  <input
                    type="number"
                    min="10"
                    className="input-group__field"
                    value={barbacoaPlatillosPrice}
                    onChange={(e) => setBarbacoaPlatillosPrice(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Menudo */}
          <div className="form-card">
            <h3 className="section-heading">🍲 Menudo</h3>
            <div className="input-row-2">
              <div>
                <label className="input-group__label">Medio Litro (0.5L) — $65 c/u</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={menudoHalfLiterQty}
                  onChange={(e) => setMenudoHalfLiterQty(e.target.value)}
                />
              </div>
              <div>
                <label className="input-group__label">Litro Completo (1L) — $120 c/u</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={menudoLiterQty}
                  onChange={(e) => setMenudoLiterQty(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 4. Extras */}
          <div className="form-card">
            <h3 className="section-heading">🌶️ Extras</h3>
            <div className="input-row-3">
              <div>
                <label className="input-group__label">Salsa Roja (pzas)</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={salsaRedQty}
                  onChange={(e) => setSalsaRedQty(e.target.value)}
                />
              </div>
              <div>
                <label className="input-group__label">Salsa Verde (pzas)</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={salsaGreenQty}
                  onChange={(e) => setSalsaGreenQty(e.target.value)}
                />
              </div>
              <div>
                <label className="input-group__label">Cebolla (porciones)</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={onionQty}
                  onChange={(e) => setOnionQty(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label className="input-group__label">Paquete de Tortillas</label>
              <select
                className="input-group__field"
                value={tortillasOption}
                onChange={(e) => setTortillasOption(e.target.value)}
              >
                <option value="none">Ninguno ($0)</option>
                <option value="5_piezas">5 piezas ($10)</option>
                <option value="10_piezas">10 piezas ($20)</option>
                <option value="medio_kg">1/2 kg ($25)</option>
                <option value="kilo">1 kg ($45)</option>
              </select>
            </div>
          </div>

          {/* 5. Costo de Envío y Notas */}
          <div className="form-card">
            <h3 className="section-heading">🚚 Envío e Indicaciones</h3>
            <div className="input-row-2">
              <div>
                <label className="input-group__label">Costo de Envío ($)</label>
                <input
                  type="number"
                  min="0"
                  className="input-group__field"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                />
              </div>
              <div>
                <label className="input-group__label">Notas Especiales</label>
                <input
                  type="text"
                  className="input-group__field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Sin picante, llamar al llegar"
                />
              </div>
            </div>
          </div>

          {/* 6. Totales y Envío */}
          <div className="summary-banner">
            <div>
              <span className="summary-banner__label">Subtotal:</span>
              <strong className="summary-banner__value">${calculations.subtotal}</strong>
            </div>
            <div>
              <span className="summary-banner__label">Envío:</span>
              <strong className="summary-banner__value">${calculations.fee}</strong>
            </div>
            <div>
              <span className="summary-banner__label">TOTAL:</span>
              <strong className="summary-banner__total">${calculations.total}</strong>
            </div>
          </div>

          <div className="modal-footer" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : '💾 Registrar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
