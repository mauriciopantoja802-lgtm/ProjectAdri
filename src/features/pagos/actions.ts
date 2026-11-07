"use server";

import { EstadoPago, EstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { ipCliente, verificarLimite } from "@/lib/limite";
import { urlSeguimiento, verificarTokenPedido } from "@/lib/token-pedido";
import { nuevaReferencia, urlCheckoutWompi } from "./wompi";

/** Genera un nuevo intento de pago en línea para un pedido pendiente (si el anterior fue rechazado). */
export async function reintentarPago(codigo: string, token: string): Promise<Resultado<{ url: string }>> {
  return ejecutar(async () => {
    verificarLimite(`reintento:${await ipCliente()}`, 10, 10 * 60 * 1000);
    if (!verificarTokenPedido(codigo, token)) throw new ErrorNegocio("Enlace inválido");
    const pedido = await prisma.pedido.findUnique({ where: { codigo }, include: { pagos: true } });
    if (!pedido || pedido.estado !== EstadoPedido.PENDIENTE) throw new ErrorNegocio("Este pedido ya no está pendiente de pago");
    if (pedido.pagos.some((p) => p.estado === EstadoPago.APROBADO)) throw new ErrorNegocio("Este pedido ya fue pagado");

    const referencia = nuevaReferencia(codigo);
    await prisma.$transaction([
      prisma.pago.updateMany({ where: { pedidoId: pedido.id, estado: EstadoPago.PENDIENTE }, data: { estado: EstadoPago.RECHAZADO } }),
      prisma.pago.create({ data: { pedidoId: pedido.id, metodo: "WOMPI", monto: pedido.total, referencia, estado: EstadoPago.PENDIENTE } }),
    ]);
    const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return {
      url: urlCheckoutWompi({ referencia, monto: pedido.total, redirectUrl: `${sitio}${urlSeguimiento(codigo)}`, nombre: pedido.nombreClienta, telefono: pedido.telefono }),
    };
  });
}
