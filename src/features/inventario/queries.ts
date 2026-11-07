import "server-only";
import type { Prisma, TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const POR_PAGINA_INVENTARIO = 30;

/** Condición "stock bajo": stock <= stockMinimo (comparación entre dos columnas). */
export const condicionStockBajo = (): Prisma.VarianteWhereInput => ({
  activo: true,
  producto: { activo: true },
  stock: { lte: prisma.variante.fields.stockMinimo },
});

export async function listarInventario({ q, bajo, pagina = 1 }: { q?: string; bajo?: boolean; pagina?: number }) {
  const where: Prisma.VarianteWhereInput = {
    ...(bajo && condicionStockBajo()),
    ...(q && {
      OR: [
        { producto: { nombre: { contains: q, mode: "insensitive" } } },
        { nombre: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { codigoBarras: q },
      ],
    }),
  };
  const [variantes, total, totalBajo] = await Promise.all([
    prisma.variante.findMany({
      where,
      orderBy: [{ producto: { nombre: "asc" } }, { sku: "asc" }],
      skip: (pagina - 1) * POR_PAGINA_INVENTARIO,
      take: POR_PAGINA_INVENTARIO,
      include: { producto: { select: { nombre: true, activo: true, imagenes: { take: 1, orderBy: { orden: "asc" } } } } },
    }),
    prisma.variante.count({ where }),
    prisma.variante.count({ where: condicionStockBajo() }),
  ]);
  return { variantes, total, totalBajo, paginas: Math.max(1, Math.ceil(total / POR_PAGINA_INVENTARIO)) };
}

/** Valor del inventario a costo y a precio de venta (para el resumen). */
export async function resumenInventario() {
  const variantes = await prisma.variante.findMany({ where: { activo: true }, select: { stock: true, costo: true, precio: true, precioOferta: true } });
  return variantes.reduce(
    (r, v) => {
      const venta = v.precioOferta ?? v.precio;
      return {
        unidades: r.unidades + v.stock,
        valorCosto: r.valorCosto + v.stock * v.costo,
        valorVenta: r.valorVenta + v.stock * venta,
        // Solo cuenta lo que ya tiene precio de venta definido
        gananciaPotencial: r.gananciaPotencial + (venta > 0 ? v.stock * (venta - v.costo) : 0),
        sinPrecio: r.sinPrecio + (venta > 0 ? 0 : 1),
      };
    },
    { unidades: 0, valorCosto: 0, valorVenta: 0, gananciaPotencial: 0, sinPrecio: 0 },
  );
}

export async function obtenerKardex(varianteId: string) {
  return prisma.variante.findUnique({
    where: { id: varianteId },
    include: {
      producto: { select: { id: true, nombre: true } },
      movimientos: {
        orderBy: { creadoEn: "desc" },
        take: 500,
        include: {
          usuario: { select: { nombre: true } },
          pedido: { select: { id: true, codigo: true } },
          compra: { select: { id: true, proveedor: { select: { nombre: true } } } },
        },
      },
    },
  });
}

export async function listarMovimientos({ tipo, pagina = 1 }: { tipo?: TipoMovimiento; pagina?: number }) {
  const where: Prisma.MovimientoInventarioWhereInput = tipo ? { tipo } : {};
  const [movimientos, total] = await Promise.all([
    prisma.movimientoInventario.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * POR_PAGINA_INVENTARIO,
      take: POR_PAGINA_INVENTARIO,
      include: {
        variante: { select: { id: true, nombre: true, sku: true, producto: { select: { nombre: true } } } },
        usuario: { select: { nombre: true } },
        pedido: { select: { id: true, codigo: true } },
      },
    }),
    prisma.movimientoInventario.count({ where }),
  ]);
  return { movimientos, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA_INVENTARIO)) };
}

export async function listarProveedores() {
  return prisma.proveedor.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { compras: true } }, compras: { select: { total: true } } },
  });
}

export async function listarCompras({ pagina = 1 }: { pagina?: number } = {}) {
  const [compras, total] = await Promise.all([
    prisma.compra.findMany({
      orderBy: { fecha: "desc" },
      skip: (pagina - 1) * POR_PAGINA_INVENTARIO,
      take: POR_PAGINA_INVENTARIO,
      include: { proveedor: { select: { nombre: true } }, _count: { select: { items: true } } },
    }),
    prisma.compra.count(),
  ]);
  return { compras, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA_INVENTARIO)) };
}

export async function obtenerCompra(id: string) {
  return prisma.compra.findUnique({
    where: { id },
    include: {
      proveedor: true,
      items: { include: { variante: { select: { id: true, nombre: true, sku: true, producto: { select: { nombre: true } } } } } },
    },
  });
}
