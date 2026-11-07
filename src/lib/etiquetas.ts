import type { CanalVenta, EstadoPago, EstadoPedido, MetodoPago, TipoEntrega, TipoMovimiento } from "@prisma/client";

/** Textos en español y colores de los valores de cada enum (se usan en todo el panel y la tienda). */

export const TIPO_MOVIMIENTO: Record<TipoMovimiento, { etiqueta: string; clase: string }> = {
  ENTRADA_COMPRA: { etiqueta: "Entrada por compra", clase: "bg-green-100 text-green-800" },
  SALIDA_VENTA: { etiqueta: "Salida por venta", clase: "bg-secondary text-berry" },
  AJUSTE_POSITIVO: { etiqueta: "Ajuste positivo", clase: "bg-sky-100 text-sky-800" },
  AJUSTE_NEGATIVO: { etiqueta: "Ajuste negativo", clase: "bg-red-100 text-red-800" },
  DEVOLUCION: { etiqueta: "Devolución", clase: "bg-amber-100 text-amber-800" },
};

export const ESTADO_PEDIDO: Record<EstadoPedido, { etiqueta: string; clase: string }> = {
  PENDIENTE: { etiqueta: "Pendiente", clase: "bg-amber-100 text-amber-800" },
  CONFIRMADO: { etiqueta: "Confirmado", clase: "bg-sky-100 text-sky-800" },
  PAGADO: { etiqueta: "Pagado", clase: "bg-green-100 text-green-800" },
  EN_PREPARACION: { etiqueta: "En preparación", clase: "bg-violet-100 text-violet-800" },
  ENVIADO: { etiqueta: "Enviado", clase: "bg-indigo-100 text-indigo-800" },
  LISTO_PARA_RECOGER: { etiqueta: "Listo para recoger", clase: "bg-teal-100 text-teal-800" },
  ENTREGADO: { etiqueta: "Entregado", clase: "bg-emerald-700 text-white" },
  CANCELADO: { etiqueta: "Cancelado", clase: "bg-zinc-200 text-zinc-700" },
};

/**
 * Colores de canal validados con el script de la guía de visualización (brillo, croma,
 * separación para daltonismo entre vecinos). El ORDEN_CANALES es fijo: las gráficas siempre
 * pintan los canales en este orden para que ningún par parecido quede uno al lado del otro.
 */
export const CANAL_VENTA: Record<CanalVenta, { etiqueta: string; color: string }> = {
  WEB: { etiqueta: "Página web", color: "#E91E8C" },
  TIENDA_FISICA: { etiqueta: "Tienda física", color: "#3B7DD8" },
  WHATSAPP: { etiqueta: "WhatsApp", color: "#1F9D55" },
  INSTAGRAM: { etiqueta: "Instagram", color: "#8E3B9E" },
  OTRO: { etiqueta: "Otro", color: "#D9861C" },
};
export const ORDEN_CANALES: CanalVenta[] = ["WEB", "TIENDA_FISICA", "WHATSAPP", "INSTAGRAM", "OTRO"];

export const METODO_PAGO: Record<MetodoPago, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  NEQUI: "Nequi",
  DAVIPLATA: "Daviplata",
  TARJETA: "Tarjeta",
  WOMPI: "Pago en línea (Wompi)",
  CONTRA_ENTREGA: "Contra entrega",
  MIXTO: "Mixto",
};

export const ESTADO_PAGO: Record<EstadoPago, { etiqueta: string; clase: string }> = {
  PENDIENTE: { etiqueta: "Pendiente", clase: "bg-amber-100 text-amber-800" },
  APROBADO: { etiqueta: "Aprobado", clase: "bg-green-100 text-green-800" },
  RECHAZADO: { etiqueta: "Rechazado", clase: "bg-red-100 text-red-800" },
  REEMBOLSADO: { etiqueta: "Reembolsado", clase: "bg-zinc-200 text-zinc-700" },
};

export const TIPO_ENTREGA: Record<TipoEntrega, string> = {
  RECOGER_EN_TIENDA: "Recoger en la tienda",
  DOMICILIO_POPAYAN: "Domicilio en Popayán",
  ENVIO_NACIONAL: "Envío nacional",
};
