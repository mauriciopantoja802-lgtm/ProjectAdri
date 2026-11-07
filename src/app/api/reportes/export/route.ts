import { NextResponse } from "next/server";
import { CanalVenta } from "@prisma/client";
import { obtenerSesionAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CANAL_VENTA, METODO_PAGO } from "@/lib/etiquetas";
import { claveDiaBogota } from "@/lib/formato";
import { nombreCompleto } from "@/lib/nombres";
import { reporteVentas } from "@/features/reportes/queries";
import { listarClientasAdmin } from "@/features/clientas/queries";
import { generarCSV, generarExcel, type Hoja } from "@/features/reportes/exportar";

export const runtime = "nodejs";

const TIPOS = ["ventas", "productos", "categorias", "sin-movimiento", "inventario", "clientas"] as const;
type Tipo = (typeof TIPOS)[number];
const esDia = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

/**
 * Exporta reportes a Excel (.xlsx) o CSV.
 * /api/reportes/export?tipo=ventas&formato=xlsx&desde=2026-11-01&hasta=2026-11-30&canal=WEB
 * Solo para la administradora (las rutas /api no pasan por el middleware: se verifica aquí).
 */
export async function GET(request: Request) {
  if (!(await obtenerSesionAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const sp = new URL(request.url).searchParams;
  const tipo = TIPOS.find((t) => t === sp.get("tipo")) as Tipo | undefined;
  const formato = sp.get("formato") === "csv" ? "csv" : "xlsx";
  if (!tipo) return NextResponse.json({ error: "Tipo de reporte inválido" }, { status: 400 });

  const hoy = claveDiaBogota(new Date());
  const desde = esDia(sp.get("desde")) ?? `${hoy.slice(0, 8)}01`;
  const hasta = esDia(sp.get("hasta")) ?? hoy;
  const canal = Object.values(CanalVenta).find((c) => c === sp.get("canal"));

  let hoja: Hoja;
  if (tipo === "inventario") {
    const variantes = await prisma.variante.findMany({
      orderBy: [{ producto: { nombre: "asc" } }, { sku: "asc" }],
      include: { producto: { select: { nombre: true, activo: true, categoria: { select: { nombre: true } }, marca: { select: { nombre: true } } } } },
    });
    type V = (typeof variantes)[number];
    hoja = {
      nombre: "Inventario",
      filas: variantes,
      columnas: [
        { titulo: "SKU", valor: (v: V) => v.sku, ancho: 14 },
        { titulo: "Código de barras", valor: (v: V) => v.codigoBarras, ancho: 16 },
        { titulo: "Producto", valor: (v: V) => nombreCompleto(v.producto.nombre, v.nombre), ancho: 42 },
        { titulo: "Categoría", valor: (v: V) => v.producto.categoria.nombre, ancho: 14 },
        { titulo: "Marca", valor: (v: V) => v.producto.marca?.nombre ?? "", ancho: 16 },
        { titulo: "Stock", valor: (v: V) => v.stock, tipo: "numero" },
        { titulo: "Stock mínimo", valor: (v: V) => v.stockMinimo, tipo: "numero" },
        { titulo: "Costo", valor: (v: V) => v.costo, tipo: "pesos" },
        { titulo: "Precio", valor: (v: V) => v.precio, tipo: "pesos" },
        { titulo: "Precio oferta", valor: (v: V) => v.precioOferta, tipo: "pesos" },
        { titulo: "Ganancia por unidad", valor: (v: V) => ((v.precioOferta ?? v.precio) > 0 ? (v.precioOferta ?? v.precio) - v.costo : null), tipo: "pesos", ancho: 18 },
        { titulo: "Valor a costo", valor: (v: V) => v.stock * v.costo, tipo: "pesos" },
        { titulo: "Activo", valor: (v: V) => (v.activo && v.producto.activo ? "Sí" : "No"), ancho: 8 },
      ],
    } as Hoja;
  } else if (tipo === "clientas") {
    const { clientas } = await listarClientasAdmin({ pagina: 1, porPagina: 100000 });
    type C = (typeof clientas)[number];
    hoja = {
      nombre: "Clientas",
      filas: clientas,
      columnas: [
        { titulo: "Nombre", valor: (c: C) => c.nombre },
        { titulo: "Celular", valor: (c: C) => c.telefono.replace(/^57/, ""), ancho: 14 },
        { titulo: "Correo", valor: (c: C) => c.email },
        { titulo: "Compras", valor: (c: C) => c.compras, tipo: "numero" },
        { titulo: "Total gastado", valor: (c: C) => c.totalGastado, tipo: "pesos" },
        { titulo: "Última compra", valor: (c: C) => c.ultimaCompra, tipo: "fecha", ancho: 18 },
      ],
    } as Hoja;
  } else {
    const r = await reporteVentas({ desde, hasta, canal });
    if (tipo === "ventas") {
      type F = (typeof r.ventas)[number];
      hoja = {
        nombre: "Ventas",
        filas: r.ventas,
        columnas: [
          { titulo: "Pedido", valor: (v: F) => v.codigo, ancho: 10 },
          { titulo: "Fecha", valor: (v: F) => v.fecha, tipo: "fecha", ancho: 18 },
          { titulo: "Canal", valor: (v: F) => CANAL_VENTA[v.canal].etiqueta, ancho: 14 },
          { titulo: "Método de pago", valor: (v: F) => (v.metodoPago ? METODO_PAGO[v.metodoPago] : ""), ancho: 18 },
          { titulo: "Clienta", valor: (v: F) => v.clienta },
          { titulo: "Subtotal", valor: (v: F) => v.subtotal, tipo: "pesos" },
          { titulo: "Descuento", valor: (v: F) => v.descuento, tipo: "pesos" },
          { titulo: "Envío", valor: (v: F) => v.envio, tipo: "pesos" },
          { titulo: "Total", valor: (v: F) => v.total, tipo: "pesos" },
          { titulo: "Costo", valor: (v: F) => v.costo, tipo: "pesos" },
          { titulo: "Utilidad", valor: (v: F) => v.utilidad, tipo: "pesos" },
        ],
      } as Hoja;
    } else if (tipo === "productos" || tipo === "categorias") {
      const filas = tipo === "productos" ? r.porProducto : r.porCategoria;
      type F = (typeof r.porProducto)[number] & (typeof r.porCategoria)[number];
      hoja = {
        nombre: tipo === "productos" ? "Por producto" : "Por categoría",
        filas,
        columnas: [
          ...(tipo === "productos" ? [{ titulo: "Producto", valor: (f: F) => f.nombre, ancho: 42 }] : []),
          { titulo: "Categoría", valor: (f: F) => f.categoria, ancho: 16 },
          { titulo: "Unidades", valor: (f: F) => f.unidades, tipo: "numero" },
          { titulo: "Ventas", valor: (f: F) => f.ventas, tipo: "pesos" },
          { titulo: "Costo", valor: (f: F) => f.costo, tipo: "pesos" },
          { titulo: "Utilidad", valor: (f: F) => f.utilidad, tipo: "pesos" },
          { titulo: "Margen", valor: (f: F) => (f.ventas ? f.utilidad / f.ventas : 0), tipo: "porcentaje" },
        ],
      } as Hoja;
    } else {
      type F = (typeof r.sinMovimiento)[number];
      hoja = {
        nombre: "Sin movimiento",
        filas: r.sinMovimiento,
        columnas: [
          { titulo: "SKU", valor: (v: F) => v.sku, ancho: 14 },
          { titulo: "Producto", valor: (v: F) => nombreCompleto(v.producto.nombre, v.nombre), ancho: 42 },
          { titulo: "Stock", valor: (v: F) => v.stock, tipo: "numero" },
          { titulo: "Dinero quieto (a costo)", valor: (v: F) => v.stock * v.costo, tipo: "pesos", ancho: 22 },
        ],
      } as Hoja;
    }
  }

  const nombre = `glow-${tipo}-${tipo === "inventario" || tipo === "clientas" ? hoy : `${desde}_a_${hasta}`}`;
  if (formato === "csv") {
    return new NextResponse(generarCSV(hoja), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombre}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  }
  const excel = await generarExcel([hoja], nombre);
  return new NextResponse(new Uint8Array(excel), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
