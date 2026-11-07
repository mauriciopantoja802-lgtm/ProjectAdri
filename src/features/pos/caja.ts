import "server-only";
import { EstadoPago, EstadoPedido, type MetodoPago } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rangoDiaBogota } from "@/lib/formato";

/**
 * Dinero recibido en un día (hora de Bogotá), agrupado por método de pago.
 * Cuenta los pagos APROBADOS de pedidos no cancelados; un pago MIXTO ya está
 * guardado como varios pagos (efectivo + Nequi…), así que cada parte suma donde corresponde.
 */
export async function resumenCaja(dia: string) {
  const { desde, hasta } = rangoDiaBogota(dia);
  const pagos = await prisma.pago.groupBy({
    by: ["metodo"],
    where: {
      estado: EstadoPago.APROBADO,
      creadoEn: { gte: desde, lt: hasta },
      pedido: { estado: { not: EstadoPedido.CANCELADO } },
    },
    _sum: { monto: true },
    _count: true,
  });
  const ventas = await prisma.pedido.count({
    where: { creadoEn: { gte: desde, lt: hasta }, estado: { not: EstadoPedido.CANCELADO } },
  });

  const porMetodo = Object.fromEntries(pagos.map((p) => [p.metodo, p._sum.monto ?? 0])) as Partial<Record<MetodoPago, number>>;
  const total = pagos.reduce((t, p) => t + (p._sum.monto ?? 0), 0);
  return { porMetodo, total, efectivo: porMetodo.EFECTIVO ?? 0, ventas, pagos: pagos.reduce((t, p) => t + p._count, 0) };
}

export async function listarCierres() {
  return prisma.cierreCaja.findMany({ orderBy: { fecha: "desc" }, take: 30, include: { usuario: { select: { nombre: true } } } });
}

export async function cierresDelDia(dia: string) {
  const { desde, hasta } = rangoDiaBogota(dia);
  return prisma.cierreCaja.count({ where: { fecha: { gte: desde, lt: hasta } } });
}
