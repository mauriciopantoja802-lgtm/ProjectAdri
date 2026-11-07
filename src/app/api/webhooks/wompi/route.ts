import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { procesarTransaccion, verificarEventoWompi, type EventoWompi } from "@/features/pagos/wompi";
import { revalidarTienda } from "@/lib/revalidar";

export const runtime = "nodejs";

/**
 * Webhook de eventos de Wompi. Configúralo en el panel de Wompi →
 * Desarrolladores → URL de eventos: https://TU-DOMINIO/api/webhooks/wompi
 *
 * Seguridad: se rechaza cualquier evento cuyo checksum no coincida con WOMPI_EVENTS_SECRET.
 * Idempotencia: si Wompi reenvía el mismo evento, el pago y el stock no se procesan dos veces.
 */
export async function POST(request: Request) {
  const evento = (await request.json().catch(() => null)) as EventoWompi | null;
  if (!evento || !verificarEventoWompi(evento)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (evento.event === "transaction.updated" && evento.data.transaction) {
    try {
      const estado = await procesarTransaccion(evento.data.transaction);
      if (estado) {
        revalidatePath("/admin", "layout");
        revalidarTienda();
      }
    } catch (error) {
      console.error("[wompi] Error procesando evento:", error);
      // 500 → Wompi reintenta el envío más tarde
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }
  return NextResponse.json({ ok: true });
}
