import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { EstadoPago, EstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErrorNegocio } from "@/lib/errores";
import { descontarStockPedido } from "@/features/inventario/servicio";

/**
 * Integración con Wompi (Bancolombia) usando el Web Checkout:
 * 1. Armamos la URL de pago con una FIRMA DE INTEGRIDAD (así nadie puede cambiar el monto).
 * 2. La clienta paga en la página de Wompi y vuelve a /pedido/[codigo].
 * 3. Wompi avisa al webhook /api/webhooks/wompi; verificamos el checksum del evento y,
 *    si el pago fue APROBADO, marcamos el pedido como PAGADO y descontamos el stock.
 * Docs: https://docs.wompi.co/docs/colombia/widget-checkout-web/ y /eventos/
 */

const CHECKOUT_URL = "https://checkout.wompi.co/p/";

function config() {
  const publica = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  const integridad = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publica || !integridad || publica.includes("xxxx")) {
    throw new ErrorNegocio("El pago en línea no está disponible en este momento. Elige contra entrega o pide por WhatsApp.");
  }
  return { publica, integridad, api: process.env.WOMPI_API_URL ?? "https://sandbox.wompi.co/v1" };
}

export function wompiConfigurado() {
  const k = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
  return Boolean(k && !k.includes("xxxx") && process.env.WOMPI_INTEGRITY_SECRET && !process.env.WOMPI_INTEGRITY_SECRET.includes("xxxx"));
}

/** SHA-256 de: referencia + monto en centavos + moneda + secreto de integridad. */
export function firmaIntegridad(referencia: string, montoCentavos: number, secreto: string, moneda = "COP") {
  return createHash("sha256").update(`${referencia}${montoCentavos}${moneda}${secreto}`).digest("hex");
}

export function urlCheckoutWompi(p: {
  referencia: string;
  monto: number; // en pesos
  redirectUrl: string;
  email?: string | null;
  nombre?: string | null;
  telefono?: string | null;
}) {
  const { publica, integridad } = config();
  const centavos = p.monto * 100;
  const params = new URLSearchParams({
    "public-key": publica,
    currency: "COP",
    "amount-in-cents": String(centavos),
    reference: p.referencia,
    "signature:integrity": firmaIntegridad(p.referencia, centavos, integridad),
    "redirect-url": p.redirectUrl,
  });
  if (p.email) params.set("customer-data:email", p.email);
  if (p.nombre) params.set("customer-data:full-name", p.nombre);
  if (p.telefono) {
    params.set("customer-data:phone-number", p.telefono.replace(/^57/, ""));
    params.set("customer-data:phone-number-prefix", "+57");
  }
  return `${CHECKOUT_URL}?${params}`;
}

/** Referencia única por intento de pago (Wompi no acepta referencias repetidas). */
export function nuevaReferencia(codigo: string) {
  return `${codigo}-${Date.now().toString(36).toUpperCase()}`;
}

// ------------------------------------------------------------------ Eventos (webhook)

export interface EventoWompi {
  event: string;
  data: { transaction?: TransaccionWompi };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
}

export interface TransaccionWompi {
  id: string;
  status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
  reference: string;
  amount_in_cents: number;
  currency: string;
  payment_method_type?: string;
}

/**
 * Verifica que el evento venga realmente de Wompi:
 * checksum = SHA-256( valores de signature.properties (en orden) + timestamp + secreto de eventos ).
 */
export function verificarEventoWompi(evento: EventoWompi): boolean {
  const secreto = process.env.WOMPI_EVENTS_SECRET;
  if (!secreto || !evento?.signature?.properties || !evento.signature.checksum) return false;
  const valores = evento.signature.properties
    .map((ruta) => ruta.split(".").reduce<unknown>((obj, k) => (obj as Record<string, unknown> | undefined)?.[k], evento.data))
    .map((v) => String(v ?? ""))
    .join("");
  const calculado = createHash("sha256").update(`${valores}${evento.timestamp}${secreto}`).digest("hex");
  const a = Buffer.from(calculado.toLowerCase());
  const b = Buffer.from(String(evento.signature.checksum).toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Consulta una transacción directamente a Wompi (respaldo si el webhook no llega, ej. en local). */
export async function consultarTransaccion(id: string): Promise<TransaccionWompi | null> {
  const { api } = config();
  const r = await fetch(`${api}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
  if (!r.ok) return null;
  const json = (await r.json()) as { data?: TransaccionWompi };
  return json.data ?? null;
}

/**
 * Aplica el resultado de una transacción. Idempotente: si llega dos veces, la segunda no hace nada.
 * Devuelve el estado final del pago.
 */
export async function procesarTransaccion(t: TransaccionWompi): Promise<EstadoPago | null> {
  const pago = await prisma.pago.findFirst({
    where: { referencia: t.reference, metodo: "WOMPI" },
    include: { pedido: { select: { id: true, estado: true, codigo: true } } },
  });
  if (!pago) return null;
  if (pago.estado === EstadoPago.APROBADO) return pago.estado; // ya procesado

  // El monto debe coincidir exactamente con lo que cobramos.
  if (t.currency !== "COP" || t.amount_in_cents !== pago.monto * 100) {
    await prisma.historialEstado.create({
      data: { pedidoId: pago.pedidoId, estado: pago.pedido.estado, nota: `⚠️ Wompi reportó un monto distinto (${t.amount_in_cents / 100}). Revisar.` },
    });
    return pago.estado;
  }

  if (t.status === "APPROVED") {
    const marcado = await prisma.$transaction(async (tx) => {
      const r = await tx.pago.updateMany({ where: { id: pago.id, estado: { not: EstadoPago.APROBADO } }, data: { estado: EstadoPago.APROBADO } });
      if (r.count === 0) return false;
      // Otros intentos pendientes del mismo pedido quedan sin efecto
      await tx.pago.updateMany({
        where: { pedidoId: pago.pedidoId, id: { not: pago.id }, estado: EstadoPago.PENDIENTE },
        data: { estado: EstadoPago.RECHAZADO },
      });
      if (pago.pedido.estado === EstadoPedido.PENDIENTE || pago.pedido.estado === EstadoPedido.CONFIRMADO) {
        await tx.pedido.update({ where: { id: pago.pedidoId }, data: { estado: EstadoPedido.PAGADO } });
        await tx.historialEstado.create({
          data: { pedidoId: pago.pedidoId, estado: EstadoPedido.PAGADO, nota: `Pago aprobado por Wompi (transacción ${t.id})` },
        });
      }
      return true;
    });
    if (marcado) {
      // El stock se descuenta en una transacción aparte: si justo se agotó, el pago ya quedó
      // registrado y Adri ve la alerta para resolver (cambio de tono o reembolso).
      try {
        await prisma.$transaction((tx) => descontarStockPedido(tx, pago.pedidoId, null));
      } catch (error) {
        const detalle = error instanceof ErrorNegocio ? error.message : "error desconocido";
        await prisma.historialEstado.create({
          data: { pedidoId: pago.pedidoId, estado: EstadoPedido.PAGADO, nota: `⚠️ Pago aprobado pero no se pudo descontar el stock: ${detalle}` },
        });
      }
    }
    return EstadoPago.APROBADO;
  }

  if (t.status === "DECLINED" || t.status === "ERROR" || t.status === "VOIDED") {
    await prisma.$transaction([
      prisma.pago.update({ where: { id: pago.id }, data: { estado: EstadoPago.RECHAZADO } }),
      prisma.historialEstado.create({
        data: { pedidoId: pago.pedidoId, estado: pago.pedido.estado, nota: `Pago en línea ${t.status === "DECLINED" ? "rechazado" : "fallido"} (Wompi ${t.id})` },
      }),
    ]);
    return EstadoPago.RECHAZADO;
  }
  return pago.estado; // PENDING: seguimos esperando
}
