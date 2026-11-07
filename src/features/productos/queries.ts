import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const POR_PAGINA_ADMIN = 20;

export interface FiltrosProductosAdmin {
  q?: string;
  categoria?: string;
  estado?: "activos" | "inactivos" | "todos";
  pagina?: number;
}

export async function listarProductosAdmin({ q, categoria, estado = "todos", pagina = 1 }: FiltrosProductosAdmin) {
  const where: Prisma.ProductoWhereInput = {
    ...(categoria && { categoriaId: categoria }),
    ...(estado === "activos" && { activo: true }),
    ...(estado === "inactivos" && { activo: false }),
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { marca: { nombre: { contains: q, mode: "insensitive" } } },
        { variantes: { some: { OR: [{ sku: { contains: q, mode: "insensitive" } }, { codigoBarras: q }] } } },
      ],
    }),
  };

  const [productos, total] = await Promise.all([
    prisma.producto.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * POR_PAGINA_ADMIN,
      take: POR_PAGINA_ADMIN,
      include: {
        categoria: { select: { nombre: true } },
        marca: { select: { nombre: true } },
        imagenes: { orderBy: { orden: "asc" }, take: 1 },
        variantes: { select: { precio: true, precioOferta: true, stock: true, stockMinimo: true, activo: true } },
      },
    }),
    prisma.producto.count({ where }),
  ]);

  return { productos, total, paginas: Math.max(1, Math.ceil(total / POR_PAGINA_ADMIN)) };
}

export async function obtenerProductoAdmin(id: string) {
  return prisma.producto.findUnique({
    where: { id },
    include: {
      imagenes: { orderBy: { orden: "asc" } },
      variantes: { orderBy: { sku: "asc" } },
    },
  });
}

export async function listarCategorias() {
  return prisma.categoria.findMany({
    orderBy: [{ orden: "asc" }, { nombre: "asc" }],
    include: { _count: { select: { productos: true } } },
  });
}

export async function listarMarcas() {
  return prisma.marca.findMany({ orderBy: { nombre: "asc" }, include: { _count: { select: { productos: true } } } });
}
