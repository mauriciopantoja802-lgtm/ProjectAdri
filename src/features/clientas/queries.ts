import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ESTADOS_VENTA } from "@/features/reportes/queries";

export async function listarClientasAdmin({ q, pagina = 1, porPagina = 25, orden = "gastado" }: { q?: string; pagina?: number; porPagina?: number; orden?: "gastado" | "recientes" | "nombre" }) {
  const where: Prisma.ClientaWhereInput = q
    ? {
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q.replace(/\D/g, "") || q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const todas = await prisma.clienta.findMany({
    where,
    include: {
      pedidos: { where: { estado: { in: ESTADOS_VENTA } }, select: { total: true, creadoEn: true } },
      usuario: { select: { id: true } },
    },
  });
  const filas = todas.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
    conCuenta: Boolean(c.usuario),
    compras: c.pedidos.length,
    totalGastado: c.pedidos.reduce((t, p) => t + p.total, 0),
    ultimaCompra: c.pedidos.reduce<Date | null>((u, p) => (!u || p.creadoEn > u ? p.creadoEn : u), null),
  }));
  filas.sort((a, b) =>
    orden === "nombre"
      ? a.nombre.localeCompare(b.nombre)
      : orden === "recientes"
        ? (b.ultimaCompra?.getTime() ?? 0) - (a.ultimaCompra?.getTime() ?? 0)
        : b.totalGastado - a.totalGastado,
  );
  return {
    clientas: filas.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: filas.length,
    paginas: Math.max(1, Math.ceil(filas.length / porPagina)),
  };
}

export async function obtenerClienta(id: string) {
  return prisma.clienta.findUnique({
    where: { id },
    include: {
      direcciones: true,
      usuario: { select: { email: true, creadoEn: true } },
      pedidos: {
        orderBy: { creadoEn: "desc" },
        select: { id: true, codigo: true, creadoEn: true, estado: true, canal: true, total: true, _count: { select: { items: true } } },
      },
    },
  });
}
