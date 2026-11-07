import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { obtenerSesionAdmin } from "@/lib/auth";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { generarComprobantePDF } from "@/features/pedidos/comprobante-pdf";

// react-pdf necesita el runtime de Node.js (no Edge).
export const runtime = "nodejs";

/** Devuelve el comprobante en PDF (tirilla de 80 mm) listo para imprimir desde el navegador. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await obtenerSesionAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const pedido = await prisma.pedido.findUnique({
    where: { id },
    include: { items: { orderBy: { id: "asc" } }, pagos: { orderBy: { creadoEn: "asc" } } },
  });
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const pdf = await generarComprobantePDF(pedido, await obtenerConfiguracion());
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      // inline: se abre en el visor del navegador, donde se imprime con Ctrl+P
      "Content-Disposition": `inline; filename="comprobante-${pedido.codigo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
