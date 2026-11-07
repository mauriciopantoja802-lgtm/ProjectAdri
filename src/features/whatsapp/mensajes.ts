import type { TipoEntrega } from "@prisma/client";
import { formatoCOP } from "@/lib/formato";
import { TIPO_ENTREGA } from "@/lib/etiquetas";

export interface DatosMensajePedido {
  codigo: string;
  items: { cantidad: number; nombre: string; total: number }[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  tipoEntrega: TipoEntrega | null; // null = por definir
  nombre: string | null;
  direccion: string | null;
  metodoPago?: string | null;
}

/**
 * Mensaje que la clienta envía a Adri. Ejemplo:
 *   ¡Hola Adri! 💖 Quiero hacer este pedido:
 *   • 1 x Labial Mate Rosa Nude (Tono 03) — $32.000
 *   Subtotal: $68.000
 *   Entrega: Domicilio en Popayán
 *   Nombre: ___  |  Barrio/Dirección: ___
 *   Pedido #GA-0123
 */
export function mensajePedido(d: DatosMensajePedido): string {
  const lineas = [
    "¡Hola Adri! 💖 Quiero hacer este pedido:",
    ...d.items.map((i) => `• ${i.cantidad} x ${i.nombre} — ${formatoCOP(i.total)}`),
    `Subtotal: ${formatoCOP(d.subtotal)}`,
  ];
  if (d.descuento > 0) lineas.push(`Descuento: -${formatoCOP(d.descuento)}`);
  if (d.costoEnvio > 0) lineas.push(`Envío: ${formatoCOP(d.costoEnvio)}`);
  if (d.descuento > 0 || d.costoEnvio > 0) lineas.push(`Total: ${formatoCOP(d.total)}`);
  lineas.push(`Entrega: ${d.tipoEntrega ? TIPO_ENTREGA[d.tipoEntrega] : "___"}`);
  if (d.metodoPago) lineas.push(`Pago: ${d.metodoPago}`);
  const necesitaDireccion = d.tipoEntrega !== "RECOGER_EN_TIENDA";
  lineas.push(
    necesitaDireccion
      ? `Nombre: ${d.nombre ?? "___"}  |  Barrio/Dirección: ${d.direccion ?? "___"}`
      : `Nombre: ${d.nombre ?? "___"}`,
  );
  lineas.push(`Pedido #${d.codigo}`);
  return lineas.join("\n");
}

/** Reemplaza {variable} en una plantilla. Las variables desconocidas se dejan tal cual. */
export function rellenarPlantilla(plantilla: string, variables: Record<string, string>): string {
  return plantilla.replace(/\{(\w+)\}/g, (completo, clave: string) => variables[clave] ?? completo);
}

export const PLANTILLAS_WHATSAPP = {
  PEDIDO_CONFIRMADO: "Pedido confirmado",
  DATOS_PAGO: "Datos para transferencia / Nequi",
  ENVIADO: "Pedido enviado",
  LISTO_RECOGER: "Listo para recoger en tienda",
  GRACIAS: "Gracias por tu compra",
} as const;
export type ClavePlantilla = keyof typeof PLANTILLAS_WHATSAPP;

export const VARIABLES_PLANTILLA = ["{nombre}", "{codigo}", "{total}", "{direccionTienda}", "{datosPago}"];
