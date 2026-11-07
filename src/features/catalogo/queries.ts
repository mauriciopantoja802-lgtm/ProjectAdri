import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { EstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ETIQUETA_CATALOGO } from "@/lib/revalidar";
import { familiaDeColor, type FamiliaTono } from "@/lib/tonos";

export const POR_PAGINA_CATALOGO = 12;
export const ORDENES = {
  relevancia: "Destacados",
  "mas-vendidos": "Más vendidos",
  nuevos: "Novedades",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
} as const;
export type Orden = keyof typeof ORDENES;

export interface ProductoTarjeta {
  id: string;
  nombre: string;
  slug: string;
  marca: { nombre: string; slug: string } | null;
  categoria: { nombre: string; slug: string };
  imagenes: { url: string; alt: string | null }[];
  precio: number; // precio más bajo a pagar (con oferta)
  precioAnterior: number | null; // precio normal tachado, si esa variante está en oferta
  descuentoPct: number | null;
  esNuevo: boolean;
  destacado: boolean;
  stock: number;
  tonos: string[]; // colores hex para los circulitos
  familias: FamiliaTono[];
  ventas: number;
  creadoEn: number;
  busqueda: string; // texto normalizado para el buscador
  varianteUnica: { id: string; nombre: string; stock: number } | null; // para "Agregar" rápido
}

export const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Todo el catálogo activo, listo para mostrar, en caché por 5 minutos (y se limpia al editar
 * en el panel). Con cientos de productos, filtrar en memoria es más rápido que muchas consultas
 * y permite ordenar por precio efectivo (con ofertas) y por más vendidos.
 */
export const obtenerCatalogo = unstable_cache(
  async (): Promise<ProductoTarjeta[]> => {
    const [productos, vendidos] = await Promise.all([
      prisma.producto.findMany({
        where: { activo: true, variantes: { some: { activo: true } } },
        include: {
          marca: { select: { nombre: true, slug: true } },
          categoria: { select: { nombre: true, slug: true } },
          imagenes: { orderBy: { orden: "asc" }, take: 2, select: { url: true, alt: true } },
          variantes: { where: { activo: true }, select: { id: true, nombre: true, colorHex: true, precio: true, precioOferta: true, stock: true } },
        },
      }),
      prisma.itemPedido.groupBy({
        by: ["varianteId"],
        where: { pedido: { estado: { not: EstadoPedido.CANCELADO } } },
        _sum: { cantidad: true },
      }),
    ]);
    const ventasVariante = new Map(vendidos.map((v) => [v.varianteId, v._sum.cantidad ?? 0]));

    return productos.map((p) => {
      const masBarata = [...p.variantes].sort((a, b) => (a.precioOferta ?? a.precio) - (b.precioOferta ?? b.precio))[0];
      const precio = masBarata.precioOferta ?? masBarata.precio;
      const precioAnterior = masBarata.precioOferta ? masBarata.precio : null;
      const tonos = [...new Set(p.variantes.map((v) => v.colorHex).filter((c): c is string => Boolean(c)))];
      return {
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        marca: p.marca,
        categoria: p.categoria,
        imagenes: p.imagenes,
        precio,
        precioAnterior,
        descuentoPct: precioAnterior ? Math.round((1 - precio / precioAnterior) * 100) : null,
        esNuevo: p.esNuevo,
        destacado: p.destacado,
        stock: p.variantes.reduce((t, v) => t + Math.max(0, v.stock), 0),
        tonos,
        familias: [...new Set(tonos.map(familiaDeColor).filter((f): f is FamiliaTono => f !== null))],
        ventas: p.variantes.reduce((t, v) => t + (ventasVariante.get(v.id) ?? 0), 0),
        creadoEn: p.creadoEn.getTime(),
        busqueda: normalizar([p.nombre, p.marca?.nombre, p.categoria.nombre, ...p.variantes.map((v) => v.nombre)].join(" ")),
        varianteUnica: p.variantes.length === 1 ? { id: p.variantes[0].id, nombre: p.variantes[0].nombre, stock: p.variantes[0].stock } : null,
      };
    });
  },
  ["catalogo-publico"],
  { revalidate: 300, tags: [ETIQUETA_CATALOGO] },
);

export interface FiltrosCatalogo {
  q?: string;
  categoria?: string;
  marca?: string;
  tono?: string;
  min?: number;
  max?: number;
  oferta?: boolean;
  orden?: Orden;
  pagina?: number;
}

const ordenar: Record<Orden, (a: ProductoTarjeta, b: ProductoTarjeta) => number> = {
  // Destacados primero, luego con stock, luego más vendidos
  relevancia: (a, b) => Number(b.destacado) - Number(a.destacado) || Number(b.stock > 0) - Number(a.stock > 0) || b.ventas - a.ventas,
  "mas-vendidos": (a, b) => b.ventas - a.ventas,
  nuevos: (a, b) => b.creadoEn - a.creadoEn,
  "precio-asc": (a, b) => a.precio - b.precio,
  "precio-desc": (a, b) => b.precio - a.precio,
};

export async function buscarCatalogo(f: FiltrosCatalogo) {
  const todos = await obtenerCatalogo();
  const palabras = f.q ? normalizar(f.q).split(/\s+/).filter(Boolean) : [];
  const filtrados = todos
    .filter(
      (p) =>
        (!f.categoria || p.categoria.slug === f.categoria) &&
        (!f.marca || p.marca?.slug === f.marca) &&
        (!f.tono || p.familias.includes(f.tono as FamiliaTono)) &&
        (f.min === undefined || p.precio >= f.min) &&
        (f.max === undefined || p.precio <= f.max) &&
        (!f.oferta || p.precioAnterior !== null) &&
        palabras.every((w) => p.busqueda.includes(w)),
    )
    .sort(ordenar[f.orden ?? "relevancia"]);

  const pagina = Math.max(1, f.pagina ?? 1);
  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA_CATALOGO));
  return {
    productos: filtrados.slice((pagina - 1) * POR_PAGINA_CATALOGO, pagina * POR_PAGINA_CATALOGO),
    total: filtrados.length,
    pagina: Math.min(pagina, paginas),
    paginas,
  };
}

/** Opciones para los filtros (solo las que tienen productos activos). */
export async function opcionesFiltros() {
  const todos = await obtenerCatalogo();
  const categorias = await prisma.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }] });
  const marcas = new Map<string, string>();
  const familias = new Set<FamiliaTono>();
  for (const p of todos) {
    if (p.marca) marcas.set(p.marca.slug, p.marca.nombre);
    p.familias.forEach((fa) => familias.add(fa));
  }
  return {
    categorias: categorias
      .map((c) => ({ ...c, cantidad: todos.filter((p) => p.categoria.slug === c.slug).length }))
      .filter((c) => c.cantidad > 0),
    marcas: [...marcas].map(([slug, nombre]) => ({ slug, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    familias: [...familias],
    precioMax: Math.max(0, ...todos.map((p) => p.precio)),
  };
}

export async function seccionesInicio() {
  const todos = await obtenerCatalogo();
  const conStock = todos.filter((p) => p.stock > 0);
  const top = (lista: ProductoTarjeta[], orden: Orden, n = 8) => [...lista].sort(ordenar[orden]).slice(0, n);
  return {
    masVendidos: top(conStock.filter((p) => p.ventas > 0 || p.destacado), "mas-vendidos"),
    novedades: top(conStock.filter((p) => p.esNuevo), "nuevos"),
    ofertas: top(conStock.filter((p) => p.precioAnterior !== null), "relevancia"),
  };
}

export async function obtenerBanners() {
  return prisma.banner.findMany({ where: { activo: true }, orderBy: { orden: "asc" } });
}

/** Detalle de producto (React cache: lo comparten la página y generateMetadata). */
export const obtenerProductoPorSlug = cache(async (slug: string) => {
  return prisma.producto.findFirst({
    where: { slug, activo: true },
    include: {
      marca: true,
      categoria: true,
      imagenes: { orderBy: { orden: "asc" } },
      variantes: { where: { activo: true }, orderBy: { sku: "asc" } },
    },
  });
});

export async function productosRelacionados(categoriaSlug: string, excluirId: string, n = 4) {
  const todos = await obtenerCatalogo();
  return todos
    .filter((p) => p.categoria.slug === categoriaSlug && p.id !== excluirId && p.stock > 0)
    .sort(ordenar.relevancia)
    .slice(0, n);
}
