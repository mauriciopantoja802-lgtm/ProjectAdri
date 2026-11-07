import "server-only";
import { CanalVenta, EstadoPedido, MetodoPago, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rangoDiaBogota } from "@/lib/formato";
import { HORAS_POR_VENCER } from "./schemas";

export const POR_PAGINA_PEDIDOS = 25;

export interface FiltrosPedidos {
  estado?: string;
  canal?: string;
  metodo?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  porVencer?: boolean;
  pagina?: number;
}

const enumValido = <T extends string>(valores: Record<string, T>, v?: string) => Object.values(valores).find((x) => x === v);
const esDia = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

export function limitePorVencer() {
  return new Date(Date.now() - HORAS_POR_VENCER * 60 * 60 * 1000);
}

export async function listarPedidos(f: FiltrosPedidos) {
  const estado = enumValido(EstadoPedido, f.estado);
  const canal = enumValido(CanalVenta, f.canal);
  const metodo = enumValido(MetodoPago, f.metodo);
  const desde = esDia(f.desde);
  const hasta = esDia(f.hasta);
  const q = f.q?.trim();
  const where: Prisma.PedidoWhereInput = {
    ...(estado && { estado }),
    ...(canal && { canal }),
    ...(metodo && { OR: [{ metodoPago: metodo }, { pagos: { some: { metodo } } }] }),
    ...((desde || hasta) && {
      creadoEn: { ...(desde && { gte: rangoDiaBogota(desde).desde }), ...(hasta && { lt: rangoDiaBogota(hasta).hasta }) },
    }),
    ...(f.porVencer && { canal: CanalVenta.WHATSAPP, estado: EstadoPedido.PENDIENTE, creadoEn: { lt: limitePorVencer() } }),
    ...(q && {
      AND: [
        {
          OR: [
            { codigo: { contains: q, mode: "insensitive" } },
            { nombreClienta: { contains: q, mode: "insensitive" } },
            { telefono: { contains: q.replace(/\D/g, "") || q } },
          ],
        },
      ],
    }),
  };
  const pagina = Math.max(1, f.pagina ?? 1);
  const [pedidos, total, porVencer, pendientes] = await Promise.all([
    prisma.pedido.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      skip: (pagina - 1) * POR_PAGINA_PEDIDOS,
      take: POR_PAGINA_PEDIDOS,
      include: { _count: { select: { items: true } } },
    }),
    prisma.pedido.count({ where }),
    prisma.pedido.count({ where: { canal: CanalVenta.WHATSAPP, estado: EstadoPedido.PENDIENTE, creadoEn: { lt: limitePorVencer() } } }),
    prisma.pedido.count({ where: { estado: EstadoPedido.PENDIENTE } }),
  ]);
  return { pedidos, total, porVencer, pendientes, paginas: Math.max(1, Math.ceil(total / POR_PAGINA_PEDIDOS)) };
}

export async function obtenerPedidoAdmin(id: string) {
  return prisma.pedido.findUnique({
    where: { id },
    include: {
      items: { include: { variante: { select: { id: true, sku: true, stock: true } } } },
      pagos: { orderBy: { creadoEn: "asc" } },
      historial: { orderBy: { creadoEn: "asc" } },
      cupon: { select: { codigo: true } },
      clienta: { select: { id: true, nombre: true, _count: { select: { pedidos: true } } } },
    },
  });
}

/** Pedido para la página pública de seguimiento. */
export async function obtenerPedidoPublico(codigo: string) {
  return prisma.pedido.findUnique({
    where: { codigo },
    include: {
      items: true,
      pagos: { orderBy: { creadoEn: "asc" } },
      historial: { orderBy: { creadoEn: "asc" } },
      clienta: { select: { usuarioId: true } },
    },
  });
}

export function estaPorVencer(p: { canal: CanalVenta; estado: EstadoPedido; creadoEn: Date }) {
  return p.canal === CanalVenta.WHATSAPP && p.estado === EstadoPedido.PENDIENTE && p.creadoEn < limitePorVencer();
}
