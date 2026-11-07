"use server";

import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { nombreCompleto } from "@/lib/nombres";

export interface VarianteEncontrada {
  id: string;
  sku: string;
  codigoBarras: string | null;
  nombre: string; // "Labial Mate (Tono 03 - Rosa Nude)"
  imagen: string | null;
  precio: number; // precio final (con oferta si hay)
  precioNormal: number;
  costo: number;
  stock: number;
  activo: boolean;
}

/**
 * Busca variantes por nombre, SKU o código de barras (para el POS y las compras).
 * Si el texto coincide exacto con un código de barras o SKU, ese resultado va primero:
 * así el lector de código de barras agrega el producto de inmediato.
 */
export async function buscarVariantes(q: string, opciones: { soloActivas?: boolean } = {}): Promise<VarianteEncontrada[]> {
  await requerirAdmin();
  const texto = q.trim();
  if (texto.length < 2) return [];

  const variantes = await prisma.variante.findMany({
    where: {
      ...(opciones.soloActivas && { activo: true, producto: { activo: true } }),
      OR: [
        { codigoBarras: texto },
        { sku: { equals: texto, mode: "insensitive" } },
        { sku: { contains: texto, mode: "insensitive" } },
        { nombre: { contains: texto, mode: "insensitive" } },
        { producto: { nombre: { contains: texto, mode: "insensitive" } } },
      ],
    },
    take: 15,
    orderBy: { producto: { nombre: "asc" } },
    include: { producto: { select: { nombre: true, imagenes: { take: 1, orderBy: { orden: "asc" } } } } },
  });

  const exacto = (v: (typeof variantes)[number]) =>
    v.codigoBarras === texto || v.sku.toLowerCase() === texto.toLowerCase() ? 0 : 1;

  return variantes
    .sort((a, b) => exacto(a) - exacto(b))
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      codigoBarras: v.codigoBarras,
      nombre: nombreCompleto(v.producto.nombre, v.nombre),
      imagen: v.producto.imagenes[0]?.url ?? null,
      precio: v.precioOferta ?? v.precio,
      precioNormal: v.precio,
      costo: v.costo,
      stock: v.stock,
      activo: v.activo,
    }));
}
