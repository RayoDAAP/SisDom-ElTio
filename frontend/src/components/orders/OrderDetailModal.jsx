/**
 * @module OrderDetailModal
 * @description Modal interactivo para inspeccionar y gestionar el detalle completo de un pedido.
 *              Incluye desglose de Tacos, Gorditas, Tostadas, Barbacoa, Menudo, Bebidas,
 *              Complementos y Métodos de Pago.
 *              Soporta la propiedad `hideFinancials` para usuarios con rol Auxiliar (oculta totales de venta).
 */
import { useEffect, useState } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  MapPin,
  Truck,
  FileText,
  CreditCard,
  Banknote,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, PAYMENT_METHODS, TRANSFER_STATUS } from '../../models/order.model';
import Button from '../common/Button';

const OrderDetailModal = ({
  order,
  onClose,
  onStatusChange,
  onPaymentStatusChange,
  hideFinancials = false,
}) => {
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const { client, items, pricing, status, id, createdAt, createdBy, notes, payment, missingReport } = order;
  const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.listo;
  const isLocked = status === 'entregado' || status === 'cancelado';

  const hasExtras =
    items?.extras &&
    (items.extras.salsaRed > 0 ||
      items.extras.salsaGreen > 0 ||
      items.extras.onion > 0 ||
      (items.extras.tortillas && items.extras.tortillas !== 'none'));

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* B1. Encabezado Oscuro */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Pedido
              </span>
              <h2 id="order-detail-title" className="text-xl font-bold tracking-tight text-white">
                {id}
              </h2>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {!hideFinancials && pricing?.total !== undefined && (
              <div className="text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Total
                </span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  ${pricing.total}
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar ventana"
              className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* B3. Cuerpo del Modal con scroll */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Reporte de Faltante si existe */}
          {missingReport && (
            <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wider text-rose-700">
                    Reporte de Faltante en Pedido
                  </span>
                  <span className="text-[11px] text-rose-600">
                    {missingReport.reportedAt
                      ? new Date(missingReport.reportedAt).toLocaleTimeString('es-MX', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </span>
                </div>
                <p className="font-semibold text-rose-900 bg-white/70 p-2 rounded border border-rose-200">
                  {missingReport.note}
                </p>
                <div className="text-[11px] text-rose-700">
                  Reportado por: <strong>{missingReport.reportedBy || 'Repartidor'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* 1. Información del Cliente */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Información del Cliente
            </span>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">{client?.name}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {client?.type === 'empresa' ? (
                    <>
                      <Building2 className="w-3 h-3 text-slate-500" />
                      <span>Empresa</span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-slate-500" />
                      <span>Particular</span>
                    </>
                  )}
                </span>
              </div>

              {client?.companyName && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    <strong>Empresa:</strong> {client.companyName}
                  </span>
                </div>
              )}

              {client?.phone && (
                <div className="text-xs text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">Teléfono:</span>
                  <a
                    href={`tel:${client.phone}`}
                    className="text-brand-red font-bold hover:underline"
                  >
                    {client.phone}
                  </a>
                </div>
              )}

              <div className="text-xs text-slate-600 space-y-2 pt-1 border-t border-slate-200/60">
                {client?.deliveryType === 'recoger' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-900 font-semibold">
                    Pedido para Recoger en Sucursal (Sin envío)
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Dirección:</strong> Calle {client?.street || 'N/A'} #{client?.number || 'S/N'}, Col. {client?.colonia || 'N/A'}, {client?.municipio || 'San Nicolás de los Garza'}
                    </span>
                  </div>
                )}

                {client?.crossStreets && (
                  <div className="text-xs text-slate-600 pl-5">
                    <strong>Entre Calles:</strong> {client.crossStreets}
                  </div>
                )}

                {client?.deliveryReferences && (
                  <div className="text-xs text-amber-900 bg-amber-50/90 p-2.5 rounded-lg border border-amber-200">
                    <strong>Referencias de Entrega:</strong> {client.deliveryReferences}
                  </div>
                )}

                {client?.lat && client?.lng && (
                  <div className="pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${client.lat},${client.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-300 shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-red" />
                      <span>Abrir en Maps</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Lo Pedido (Desglose compacto sin tarjetas de borde) */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Lo Pedido
            </span>

            <div className="space-y-3">
              {/* Tacos, Gorditas y Tostadas */}
              {items?.preparedItems && items.preparedItems.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tacos, Gorditas y Tostadas
                  </span>
                  <div className="space-y-1">
                    {items.preparedItems.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs text-slate-700 py-0.5"
                      >
                        <span>{item.label}</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">${item.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barbacoa */}
              {items?.barbacoa && items.barbacoa.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Barbacoa
                  </span>
                  <div className="space-y-1">
                    {items.barbacoa.map((b, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs text-slate-700 py-0.5"
                      >
                        <span>{b.label}</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">${b.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menudo */}
              {items?.menudo && items.menudo.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Menudo
                  </span>
                  <div className="space-y-1">
                    {items.menudo.map((m, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs text-slate-700 py-0.5"
                      >
                        <span>{m.label}</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">${m.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bebidas */}
              {items?.drinks && items.drinks.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Bebidas
                  </span>
                  <div className="space-y-1">
                    {items.drinks.map((d, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs text-slate-700 py-0.5"
                      >
                        <span>{d.label}</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">${d.price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complementos y Extras */}
              {hasExtras && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Complementos y Extras
                  </span>
                  <div className="space-y-1 text-xs text-slate-700">
                    {items.extras.salsaRed > 0 && (
                      <div className="flex justify-between items-center py-0.5">
                        <span>Salsa Roja ({items.extras.salsaRed} pza)</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">
                            ${items.extras.salsaRed * 4}
                          </span>
                        )}
                      </div>
                    )}
                    {items.extras.salsaGreen > 0 && (
                      <div className="flex justify-between items-center py-0.5">
                        <span>Salsa Verde ({items.extras.salsaGreen} pza)</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">
                            ${items.extras.salsaGreen * 4}
                          </span>
                        )}
                      </div>
                    )}
                    {items.extras.onion > 0 && (
                      <div className="flex justify-between items-center py-0.5">
                        <span>Cebolla ({items.extras.onion} pza)</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">
                            ${items.extras.onion * 4}
                          </span>
                        )}
                      </div>
                    )}
                    {items.extras.tortillas && items.extras.tortillas !== 'none' && (
                      <div className="flex justify-between items-center py-0.5">
                        <span>Tortillas ({items.extras.tortillasLabel || items.extras.tortillas})</span>
                        {!hideFinancials && (
                          <span className="font-semibold text-slate-900">
                            ${items.extras.tortillasPrice || 0}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Pago y Totales (Solo si !hideFinancials) */}
          {!hideFinancials && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pago y Totales
              </span>

              {/* Método de Pago */}
              {payment && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {payment.method === PAYMENT_METHODS.EFECTIVO ? (
                        <Banknote className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <CreditCard className="w-4 h-4 text-brand-red" />
                      )}
                      <span>Método de pago:</span>
                      <span className="capitalize text-slate-900">
                        {payment.method || 'Efectivo'}
                      </span>
                    </div>

                    {payment.method !== PAYMENT_METHODS.EFECTIVO && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          payment.transferStatus === TRANSFER_STATUS.ACCEPTED
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {payment.transferStatus === TRANSFER_STATUS.ACCEPTED
                          ? 'Transferencia Aceptada'
                          : 'Transferencia Pendiente'}
                      </span>
                    )}
                  </div>

                  {payment.method === PAYMENT_METHODS.EFECTIVO ? (
                    <div className="flex items-center gap-4 text-slate-600 pt-0.5">
                      {payment.amountPaid && (
                        <span>
                          Paga con: <strong>${payment.amountPaid}</strong>
                        </span>
                      )}
                      {payment.change !== null && payment.change !== undefined && (
                        <span className="text-emerald-700 font-semibold">
                          Cambio: ${payment.change}
                        </span>
                      )}
                    </div>
                  ) : (
                    onPaymentStatusChange && (
                      <div className="pt-0.5">
                        <button
                          type="button"
                          disabled={isUpdatingPayment}
                          onClick={async () => {
                            const isAccepted = payment.transferStatus === TRANSFER_STATUS.ACCEPTED;
                            const targetStatus = isAccepted ? 'pendiente' : 'aceptada';
                            const confirmMsg = isAccepted
                              ? '¿Marcar la transferencia como pendiente?'
                              : '¿Marcar la transferencia como aceptada?';

                            if (!window.confirm(confirmMsg)) return;

                            setIsUpdatingPayment(true);
                            try {
                              await onPaymentStatusChange(id, targetStatus);
                            } catch (err) {
                              console.error('Error al actualizar estado de transferencia:', err);
                            } finally {
                              setIsUpdatingPayment(false);
                            }
                          }}
                          className={`text-[11px] font-medium text-slate-500 hover:text-slate-800 underline cursor-pointer inline-flex items-center gap-1 ${
                            isUpdatingPayment ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isUpdatingPayment
                            ? 'Actualizando...'
                            : payment.transferStatus === TRANSFER_STATUS.ACCEPTED
                            ? 'Marcar como Pendiente'
                            : 'Marcar como Aceptada'}
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Totales */}
              {pricing && (
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal productos:</span>
                    <span className="font-semibold text-slate-800">${pricing.subtotal}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cargo por envío:</span>
                    </span>
                    <span className="font-semibold text-slate-800">${pricing.shippingFee}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-brand-red border-t border-slate-200 pt-2">
                    <span>TOTAL:</span>
                    <span>${pricing.total}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. Notas */}
          {notes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Notas de Entrega:</span>
                <span>{notes}</span>
              </div>
            </div>
          )}

          {/* 5. Metadatos al fondo */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-1">
            <span>
              Registrado por:{' '}
              <strong className="text-slate-600 font-semibold">{createdBy || 'Auxiliar'}</strong>
            </span>
            <span>{new Date(createdAt).toLocaleString('es-MX')}</span>
          </div>
        </div>

        {/* B2. Pie Fijo del Modal */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            {isLocked ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Pedido finalizado: estado bloqueado</span>
              </span>
            ) : onStatusChange ? (
              <div className="flex items-center gap-2">
                <label
                  htmlFor="modal-status-select"
                  className="text-xs font-semibold text-slate-600"
                >
                  Cambiar a:
                </label>
                <select
                  id="modal-status-select"
                  value={status}
                  onChange={(e) => onStatusChange(id, e.target.value)}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer"
                >
                  <option value="incompleto">Faltante (Urgente)</option>
                  <option value="listo">Listo</option>
                  <option value="asignado">Asignado</option>
                  <option value="en_camino">En Camino</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            ) : null}
          </div>

          <Button variant="outline" size="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
