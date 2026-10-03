/**
 * @module OrderDetailModal
 * @description Modal interactivo para inspeccionar y gestionar el detalle completo de un pedido.
 *              Incluye desglose de Tacos, Gorditas, Tostadas, Barbacoa, Menudo, Bebidas,
 *              Complementos y Métodos de Pago.
 *              Soporta la propiedad `hideFinancials` para usuarios con rol Auxiliar (oculta totales de venta).
 */
import { useEffect } from 'react';
import {
  X,
  User,
  Building2,
  Phone,
  MapPin,
  Calendar,
  UserCheck,
  ShoppingBag,
  Flame,
  Soup,
  PlusCircle,
  Truck,
  FileText,
  CreditCard,
  UtensilsCrossed,
  Coffee,
  Banknote,
  ArrowRightLeft,
} from 'lucide-react';
import { ORDER_STATUS_CONFIG, PAYMENT_METHODS, TRANSFER_STATUS } from '../../models/order.model';
import Button from '../common/Button';

const OrderDetailModal = ({ order, onClose, onStatusChange, hideFinancials = false }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const { client, items, pricing, status, id, createdAt, createdBy, notes, payment } = order;
  const statusConfig = ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.pendiente;

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
        {/* Encabezado del Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-yellow">
              Detalles de Orden
            </span>
            <h2 id="order-detail-title" className="text-xl font-bold tracking-tight">
              {id}
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

        {/* Barra de Estado */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado:</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.badgeClass}`}>
              {statusConfig.label}
            </span>
          </div>

          {onStatusChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="status-change-select" className="text-xs font-medium text-slate-600">
                Cambiar a:
              </label>
              <select
                id="status-change-select"
                value={status}
                onChange={(e) => onStatusChange(id, e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red cursor-pointer"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_preparacion">En Preparación</option>
                <option value="listo">Listo para Entrega</option>
                <option value="en_camino">En Camino</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Metadatos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Registrado por</span>
                <span className="font-semibold">{createdBy || 'Auxiliar'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-slate-400 block font-medium">Fecha y Hora</span>
                <span className="font-semibold">{new Date(createdAt).toLocaleString('es-MX')}</span>
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Información del Cliente</span>
            </h3>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-base">{client?.name}</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
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
                <div className="text-xs text-slate-600 flex items-center gap-1.5 pt-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span><strong>Empresa:</strong> {client.companyName}</span>
                </div>
              )}

              <div className="text-xs text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span><strong>Teléfono:</strong> {client?.phone}</span>
              </div>

              <div className="text-xs text-slate-600 flex items-start gap-1.5 pt-1 border-t border-slate-100">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Dirección:</strong> Calle {client?.street || 'N/A'} #{client?.number || 'S/N'}, Col. {client?.colonia || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Desglose de Ítems */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Desglose del Pedido</span>
            </h3>

            <div className="space-y-2.5">
              {/* Tacos, Gorditas y Tostadas */}
              {items?.preparedItems && items.preparedItems.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <UtensilsCrossed className="w-4 h-4 text-brand-red" />
                    <span>Tacos, Gorditas y Tostadas</span>
                  </div>
                  {items.preparedItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-200/60 last:border-none"
                    >
                      <span>{item.label}</span>
                      {!hideFinancials && <span className="font-semibold">${item.price}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Barbacoa */}
              {items?.barbacoa && items.barbacoa.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>Barbacoa</span>
                  </div>
                  {items.barbacoa.map((b, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-200/60 last:border-none"
                    >
                      <span>{b.label}</span>
                      {!hideFinancials && <span className="font-semibold">${b.price}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Menudo */}
              {items?.menudo && items.menudo.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Soup className="w-4 h-4 text-red-600" />
                    <span>Menudo</span>
                  </div>
                  {items.menudo.map((m, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-200/60 last:border-none"
                    >
                      <span>{m.label}</span>
                      {!hideFinancials && <span className="font-semibold">${m.price}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Bebidas */}
              {items?.drinks && items.drinks.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <Coffee className="w-4 h-4 text-rose-600" />
                    <span>Bebidas</span>
                  </div>
                  {items.drinks.map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs text-slate-700 py-1 border-b border-slate-200/60 last:border-none"
                    >
                      <span>{d.label}</span>
                      {!hideFinancials && <span className="font-semibold">${d.price}</span>}
                    </div>
                  ))}
                </div>
              )}

              {/* Extras */}
              {items?.extras && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-2">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Complementos y Extras</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-700">
                    {items.extras.salsaRed > 0 && (
                      <div className="flex justify-between py-0.5">
                        <span>Salsa Roja ({items.extras.salsaRed} pza)</span>
                        {!hideFinancials && (
                          <span className="font-medium">${items.extras.salsaRed * 4}</span>
                        )}
                      </div>
                    )}
                    {items.extras.salsaGreen > 0 && (
                      <div className="flex justify-between py-0.5">
                        <span>Salsa Verde ({items.extras.salsaGreen} pza)</span>
                        {!hideFinancials && (
                          <span className="font-medium">${items.extras.salsaGreen * 4}</span>
                        )}
                      </div>
                    )}
                    {items.extras.onion > 0 && (
                      <div className="flex justify-between py-0.5">
                        <span>Cebolla ({items.extras.onion} pza)</span>
                        {!hideFinancials && (
                          <span className="font-medium">${items.extras.onion * 4}</span>
                        )}
                      </div>
                    )}
                    {items.extras.tortillas && items.extras.tortillas !== 'none' && (
                      <div className="flex justify-between py-0.5">
                        <span>Tortillas ({items.extras.tortillasLabel || items.extras.tortillas})</span>
                        {!hideFinancials && (
                          <span className="font-medium">${items.extras.tortillasPrice || 0}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Método de Pago */}
            {payment && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <CreditCard className="w-4 h-4 text-brand-red" />
                  <span>Método de Pago:</span>
                  <span className="capitalize font-semibold text-slate-900">
                    {payment.method || 'Efectivo'}
                  </span>
                </div>

                {payment.method === PAYMENT_METHODS.EFECTIVO ? (
                  <div className="flex items-center gap-4 text-slate-600">
                    {!hideFinancials && payment.amountPaid && (
                      <span>
                        Paga con: <strong>${payment.amountPaid}</strong>
                      </span>
                    )}
                    {!hideFinancials && payment.change !== null && (
                      <span className="text-emerald-700 font-semibold">
                        Cambio: ${payment.change}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Estado transferencia:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        payment.transferStatus === TRANSFER_STATUS.ACCEPTED
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {payment.transferStatus === TRANSFER_STATUS.ACCEPTED
                        ? 'Aceptada / Validada'
                        : 'Pendiente de Confirmar'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {notes && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Notas de Entrega:</span>
                  <span>{notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Resumen Financiero (Oculto para Auxiliar) */}
          {!hideFinancials && pricing && (
            <div className="border-t border-slate-200 pt-4 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal productos:</span>
                <span className="font-medium text-slate-800">${pricing.subtotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cargo por envío:</span>
                </span>
                <span className="font-medium text-slate-800">${pricing.shippingFee}</span>
              </div>
              <div className="flex justify-between items-center text-base font-extrabold text-brand-red border-t border-slate-200 pt-2.5">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>TOTAL PEDIDO:</span>
                </span>
                <span>${pricing.total}</span>
              </div>
            </div>
          )}
        </div>

        {/* Pie de Página */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex justify-end">
          <Button variant="outline" size="md" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
