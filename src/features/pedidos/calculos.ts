/**
 * Cálculo de totales, igual para el POS, el checkout web y los reportes.
 *
 * - subtotal  = Σ (precioUnit × cantidad − descuento del ítem)
 * - descuento = descuento del pedido completo (cupón o descuento manual del POS)
 * - total     = subtotal − descuento + costoEnvio
 *
 * La utilidad de una venta es: total − costoEnvio − Σ (costoUnit × cantidad).
 */
export interface ItemCalculo {
  precioUnit: number;
  cantidad: number;
  descuento?: number;
}

export function calcularTotales(items: ItemCalculo[], descuentoPedido = 0, costoEnvio = 0) {
  const subtotal = items.reduce((t, it) => t + it.precioUnit * it.cantidad - (it.descuento ?? 0), 0);
  const descuento = Math.min(Math.max(0, descuentoPedido), subtotal);
  return { subtotal, descuento, costoEnvio, total: subtotal - descuento + costoEnvio };
}
