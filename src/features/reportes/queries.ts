import "server-only";
import { CanalVenta, EstadoPago, EstadoPedido, MetodoPago, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { claveDiaBogota, rangoDiaBogota } from "@/lib/formato";
import { condicionStockBajo } from "@/features/inventario/queries";
import { limitePorVencer } from "@/features/pedidos/queries";

/**
 * Definiciones usadas en todo el dashboard y los reportes:
 * - Una VENTA es un pedido confirmado en adelante (no PENDIENTE ni CANCELADO).
 * - Ventas ($)  = total cobrado del pedido (incluye envío).
 * - Utilidad    = total − envío − costo de los productos (el costo se guardó al momento de la venta).
 */
export const ESTADOS_VENTA: EstadoPedido[] = [
  EstadoPedido.CONFIRMADO,
  EstadoPedido.PAGADO,
  EstadoPedido.EN_PREPARACION,
  EstadoPedido.ENVIADO,
  EstadoPedido.LISTO_PARA_RECOGER,
  EstadoPedido.ENTREGADO,
];

const DIA = 24 * 60 * 60 * 1000;

async function ventasEntre(desde: Date, hasta: Date, extra: Prisma.PedidoWhereInput = {}) {
  return prisma.pedido.findMany({
    where: { estado: { in: ESTADOS_VENTA }, creadoEn: { gte: desde, lt: hasta }, ...extra },
    select: {
      id: true,
      codigo: true,
      canal: true,
      metodoPago: true,
      creadoEn: true,
      total: true,
      subtotal: true,
      descuento: true,
      costoEnvio: true,
      nombreClienta: true,
      items: {
        select: {
          varianteId: true,
          nombre: true,
          cantidad: true,
          precioUnit: true,
          costoUnit: true,
          descuento: true,
          variante: { select: { producto: { select: { categoria: { select: { nombre: true } } } } } },
        },
      },
      pagos: { where: { estado: EstadoPago.APROBADO }, select: { metodo: true, monto: true } },
    },
    orderBy: { creadoEn: "asc" },
  });
}
type Venta = Awaited<ReturnType<typeof ventasEntre>>[number];

const costo = (v: Venta) => v.items.reduce((t, i) => t + i.costoUnit * i.cantidad, 0);
const utilidad = (v: Venta) => v.total - v.costoEnvio - costo(v);

function resumir(ventas: Venta[]) {
  const total = ventas.reduce((t, v) => t + v.total, 0);
  const util = ventas.reduce((t, v) => t + utilidad(v), 0);
  const sinEnvio = ventas.reduce((t, v) => t + v.total - v.costoEnvio, 0);
  return {
    ventas: total,
    pedidos: ventas.length,
    ticket: ventas.length ? Math.round(total / ventas.length) : 0,
    utilidad: util,
    costo: ventas.reduce((t, v) => t + costo(v), 0),
    descuentos: ventas.reduce((t, v) => t + v.descuento + v.items.reduce((s, i) => s + i.descuento, 0), 0),
    envios: ventas.reduce((t, v) => t + v.costoEnvio, 0),
    margen: sinEnvio ? Math.round((util / sinEnvio) * 100) : 0,
  };
}

function porDia(ventas: Venta[], desde: string, dias: number) {
  const mapa = new Map<string, { dia: string; ventas: number; pedidos: number }>();
  const inicio = rangoDiaBogota(desde).desde.getTime();
  for (let i = 0; i < dias; i++) {
    const clave = claveDiaBogota(inicio + i * DIA + 12 * 60 * 60 * 1000);
    mapa.set(clave, { dia: clave, ventas: 0, pedidos: 0 });
  }
  for (const v of ventas) {
    const f = mapa.get(claveDiaBogota(v.creadoEn));
    if (f) {
      f.ventas += v.total;
      f.pedidos += 1;
    }
  }
  return [...mapa.values()];
}

function porCanal(ventas: Venta[]) {
  const m = new Map<CanalVenta, { canal: CanalVenta; ventas: number; pedidos: number }>();
  for (const v of ventas) {
    const f = m.get(v.canal) ?? { canal: v.canal, ventas: 0, pedidos: 0 };
    f.ventas += v.total;
    f.pedidos += 1;
    m.set(v.canal, f);
  }
  return [...m.values()];
}

function porProducto(ventas: Venta[]) {
  const m = new Map<string, { varianteId: string; nombre: string; categoria: string; unidades: number; ventas: number; costo: number }>();
  for (const v of ventas)
    for (const i of v.items) {
      const f = m.get(i.varianteId) ?? { varianteId: i.varianteId, nombre: i.nombre, categoria: i.variante.producto.categoria.nombre, unidades: 0, ventas: 0, costo: 0 };
      f.unidades += i.cantidad;
      f.ventas += i.precioUnit * i.cantidad - i.descuento;
      f.costo += i.costoUnit * i.cantidad;
      m.set(i.varianteId, f);
    }
  return [...m.values()].map((f) => ({ ...f, utilidad: f.ventas - f.costo })).sort((a, b) => b.ventas - a.ventas);
}

function porCategoria(ventas: Venta[]) {
  const m = new Map<string, { categoria: string; unidades: number; ventas: number; costo: number }>();
  for (const p of porProducto(ventas)) {
    const f = m.get(p.categoria) ?? { categoria: p.categoria, unidades: 0, ventas: 0, costo: 0 };
    f.unidades += p.unidades;
    f.ventas += p.ventas;
    f.costo += p.costo;
    m.set(p.categoria, f);
  }
  return [...m.values()].map((f) => ({ ...f, utilidad: f.ventas - f.costo })).sort((a, b) => b.ventas - a.ventas);
}

function porMetodo(ventas: Venta[]) {
  const m = new Map<MetodoPago, number>();
  for (const v of ventas) for (const p of v.pagos) m.set(p.metodo, (m.get(p.metodo) ?? 0) + p.monto);
  return [...m].map(([metodo, monto]) => ({ metodo, monto })).sort((a, b) => b.monto - a.monto);
}

// ------------------------------------------------------------------ Dashboard

export async function metricasDashboard() {
  const hoy = claveDiaBogota(new Date());
  const inicioHoy = rangoDiaBogota(hoy).desde;
  const finHoy = rangoDiaBogota(hoy).hasta;
  const diaSemana = (new Date(`${hoy}T12:00:00-05:00`).getUTCDay() + 6) % 7; // lunes = 0
  const inicioSemana = new Date(inicioHoy.getTime() - diaSemana * DIA);
  const inicioMes = rangoDiaBogota(`${hoy.slice(0, 8)}01`).desde;
  const desde30 = claveDiaBogota(inicioHoy.getTime() - 29 * DIA + 12 * 60 * 60 * 1000);
  const inicio30 = rangoDiaBogota(desde30).desde;

  const [ventas, stockBajo, pendientes, porVencer] = await Promise.all([
    ventasEntre(inicio30 < inicioMes ? inicio30 : inicioMes, finHoy),
    prisma.variante.findMany({
      where: condicionStockBajo(),
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, nombre: true, stock: true, stockMinimo: true, producto: { select: { nombre: true } } },
    }),
    prisma.pedido.findMany({
      where: { estado: { in: [EstadoPedido.PENDIENTE, EstadoPedido.CONFIRMADO, EstadoPedido.PAGADO, EstadoPedido.EN_PREPARACION] } },
      orderBy: { creadoEn: "asc" },
      take: 8,
      select: { id: true, codigo: true, estado: true, canal: true, total: true, nombreClienta: true, creadoEn: true },
    }),
    prisma.pedido.count({ where: { canal: CanalVenta.WHATSAPP, estado: EstadoPedido.PENDIENTE, creadoEn: { lt: limitePorVencer() } } }),
  ]);
  const totalStockBajo = await prisma.variante.count({ where: condicionStockBajo() });

  const delMes = ventas.filter((v) => v.creadoEn >= inicioMes);
  return {
    hoy: resumir(ventas.filter((v) => v.creadoEn >= inicioHoy)),
    semana: resumir(ventas.filter((v) => v.creadoEn >= inicioSemana)),
    mes: resumir(delMes),
    porDia: porDia(ventas.filter((v) => v.creadoEn >= inicio30), desde30, 30),
    porCanal: porCanal(delMes),
    top: porProducto(delMes).slice(0, 10),
    stockBajo,
    totalStockBajo,
    pendientes,
    porVencer,
  };
}

// ------------------------------------------------------------------ Reportes

export interface FiltrosReporte {
  desde: string;
  hasta: string;
  canal?: CanalVenta;
}

export async function reporteVentas(f: FiltrosReporte) {
  const desde = rangoDiaBogota(f.desde).desde;
  const hasta = rangoDiaBogota(f.hasta).hasta;
  const dias = Math.max(1, Math.round((hasta.getTime() - desde.getTime()) / DIA));
  const ventas = await ventasEntre(desde, hasta, f.canal ? { canal: f.canal } : {});

  // Productos sin movimiento: variantes activas con stock que no se vendieron en el rango
  const vendidas = new Set(ventas.flatMap((v) => v.items.map((i) => i.varianteId)));
  const conStock = await prisma.variante.findMany({
    where: { activo: true, stock: { gt: 0 }, producto: { activo: true } },
    select: { id: true, nombre: true, sku: true, stock: true, costo: true, producto: { select: { nombre: true } } },
    orderBy: { producto: { nombre: "asc" } },
  });

  return {
    resumen: resumir(ventas),
    porDia: dias <= 120 ? porDia(ventas, f.desde, dias) : [],
    porCanal: porCanal(ventas),
    porMetodo: porMetodo(ventas),
    porCategoria: porCategoria(ventas),
    porProducto: porProducto(ventas),
    sinMovimiento: conStock.filter((v) => !vendidas.has(v.id)),
    ventas: ventas.map((v) => ({
      codigo: v.codigo,
      fecha: v.creadoEn,
      canal: v.canal,
      metodoPago: v.metodoPago,
      clienta: v.nombreClienta,
      subtotal: v.subtotal,
      descuento: v.descuento,
      envio: v.costoEnvio,
      total: v.total,
      costo: costo(v),
      utilidad: utilidad(v),
    })),
  };
}
