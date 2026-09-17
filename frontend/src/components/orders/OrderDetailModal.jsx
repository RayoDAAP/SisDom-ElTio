/**
 * @module OrderDetailModal
 * @description Modal interactivo para visualizar absolutamente todos los detalles de un pedido.
 */
import { ORDER_STATUS_LABELS } from '../../models/order.model';

const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
  if (!order) return null;

  const { client, items, pricing, status, id, createdAt, createdBy, notes } = order;
  const statusInfo = ORDER_STATUS_LABELS[status] || ORDER_STATUS_LABELS.pendiente;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <span className="modal-subtitle">Detalles de Pedido</span>
            <h2 className="modal-title">{id}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Status bar */}
        <div className="status-bar" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>
          <span>Estado actual: <strong>{statusInfo.label}</strong></span>
          {onStatusChange && (
            <select
              className="status-select"
              value={status}
              onChange={(e) => onStatusChange(id, e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo">Listo</option>
              <option value="en_camino">En Camino</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          )}
        </div>

        {/* Content */}
        <div className="modal-body">
          {/* Metadata */}
          <div className="detail-grid-2">
            <div>
              <p className="detail-label">Tomado por</p>
              <p className="detail-value">{createdBy || 'Trabajador'}</p>
            </div>
            <div>
              <p className="detail-label">Fecha y Hora</p>
              <p className="detail-value">{new Date(createdAt).toLocaleString('es-MX')}</p>
            </div>
          </div>

          <hr className="divider" />

          {/* Datos del Cliente */}
          <div className="detail-section">
            <h3 className="section-heading">👤 Datos del Cliente</h3>
            <div className="detail-card">
              <p className="detail-card__title">
                {client.name}{' '}
                <span className="badge-tag">
                  {client.type === 'empresa' ? '🏢 Empresa' : '🏠 Particular'}
                </span>
              </p>
              {client.companyName && (
                <p className="detail-card__sub">
                  <strong>Empresa:</strong> {client.companyName}
                </p>
              )}
              <p className="detail-card__sub">
                <strong>Teléfono:</strong> {client.phone}
              </p>
              <p className="detail-card__sub">
                <strong>Dirección:</strong> Calle {client.street} #{client.number}, Col. {client.colonia}
              </p>
            </div>
          </div>

          {/* Desglose de Productos */}
          <div className="detail-section">
            <h3 className="section-heading">🌮 Desglose de Pedido</h3>

            {/* Barbacoa */}
            {items.barbacoa && items.barbacoa.length > 0 && (
              <div className="item-group">
                <h4 className="item-group__title">🥩 Barbacoa</h4>
                {items.barbacoa.map((b, i) => (
                  <div key={i} className="item-row">
                    <span>{b.label}</span>
                    <strong>${b.price}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Menudo */}
            {items.menudo && items.menudo.length > 0 && (
              <div className="item-group">
                <h4 className="item-group__title">🍲 Menudo</h4>
                {items.menudo.map((m, i) => (
                  <div key={i} className="item-row">
                    <span>{m.label}</span>
                    <strong>${m.price}</strong>
                  </div>
                ))}
              </div>
            )}

            {/* Extras */}
            {items.extras && (
              <div className="item-group">
                <h4 className="item-group__title">🌶️ Extras</h4>
                {items.extras.salsaRed > 0 && (
                  <div className="item-row">
                    <span>Salsa Roja ({items.extras.salsaRed} pza)</span>
                    <span>${items.extras.salsaRed * 5}</span>
                  </div>
                )}
                {items.extras.salsaGreen > 0 && (
                  <div className="item-row">
                    <span>Salsa Verde ({items.extras.salsaGreen} pza)</span>
                    <span>${items.extras.salsaGreen * 5}</span>
                  </div>
                )}
                {items.extras.onion > 0 && (
                  <div className="item-row">
                    <span>Cebolla ({items.extras.onion} pza/porción)</span>
                    <span>${items.extras.onion * 5}</span>
                  </div>
                )}
                {items.extras.tortillas && (
                  <div className="item-row">
                    <span>Tortillas ({items.extras.tortillasLabel || items.extras.tortillas})</span>
                    <span>${items.extras.tortillasPrice || 0}</span>
                  </div>
                )}
              </div>
            )}

            {notes && (
              <div className="notes-box">
                <strong>Notas / Indicaciones:</strong> {notes}
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Totales */}
          <div className="totals-summary">
            <div className="totals-row">
              <span>Subtotal:</span>
              <span>${pricing.subtotal}</span>
            </div>
            <div className="totals-row">
              <span>Costo de Envío:</span>
              <span>${pricing.shippingFee}</span>
            </div>
            <div className="totals-row totals-row--total">
              <span>TOTAL:</span>
              <span>${pricing.total}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
