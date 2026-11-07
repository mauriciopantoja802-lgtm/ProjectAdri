import "server-only";
import { TipoMovimiento, type Prisma } from "@prisma/client";
import { ErrorNegocio } from "@/lib/errores";

type Tx = Prisma.TransactionClient;

const SALIDAS: TipoMovimiento[] = [TipoMovimiento.SALIDA_VENTA, TipoMovimiento.AJUSTE_NEGATIVO];

interface Movimiento {
  varianteId: string;
  tipo: TipoMovimiento;
  /** Positiva para entradas, negativa para salidas. */
  cantidad: number;
  motivo: string;
  usuarioId?: string | null;
  pedidoId?: string | null;
  compraId?: string | null;
}

/**
 * ÚNICA forma de cambiar el stock en todo el sistema. Siempre se llama dentro de un $transaction.
 *
 * 1. Actualiza el stock con un UPDATE condicional (`WHERE stock >= cantidad`): es atómico en
 *    PostgreSQL, así que dos ventas simultáneas (POS y web) nunca dejan el stock negativo.
 * 2. Registra el movimiento en el kardex con el stock resultante.
 */
export async function moverStock(tx: Tx, m: Movimiento): Promise<number> {
  if (!Number.isInteger(m.cantidad) || m.cantidad === 0) {
    throw new ErrorNegocio("La cantidad debe ser un número entero distinto de cero");
  }
  const esSalida = SALIDAS.includes(m.tipo);
  if (esSalida !== m.cantidad < 0) {
    throw new ErrorNegocio("El signo de la cantidad no corresponde al tipo de movimiento");
  }

  const actualizado = await tx.variante.updateMany({
    where: { id: m.varianteId, ...(m.cantidad < 0 && { stock: { gte: -m.cantidad } }) },
    data: { stock: { increment: m.cantidad } },
  });

  if (actualizado.count === 0) {
    const v = await tx.variante.findUnique({
      where: { id: m.varianteId },
      select: { nombre: true, stock: true, producto: { select: { nombre: true } } },
    });
    if (!v) throw new ErrorNegocio("Uno de los productos ya no existe");
    const nombre = v.nombre === "Única" ? v.producto.nombre : `${v.producto.nombre} (${v.nombre})`;
    throw new ErrorNegocio(`No hay stock suficiente de ${nombre}: quedan ${v.stock} unidad(es).`);
  }

  const { stock } = await tx.variante.findUniqueOrThrow({ where: { id: m.varianteId }, select: { stock: true } });
  await tx.movimientoInventario.create({
    data: {
      varianteId: m.varianteId,
      tipo: m.tipo,
      cantidad: m.cantidad,
      stockFinal: stock,
      motivo: m.motivo,
      usuarioId: m.usuarioId ?? null,
      pedidoId: m.pedidoId ?? null,
      compraId: m.compraId ?? null,
    },
  });
  return stock;
}

/**
 * Descuenta el stock de todos los ítems de un pedido (SALIDA_VENTA).
 * Es idempotente: marca `stockDescontado` con un UPDATE condicional, así que si se llama
 * dos veces (ej: el webhook de Wompi repetido) solo descuenta una vez.
 * Devuelve false si ya estaba descontado.
 */
export async function descontarStockPedido(tx: Tx, pedidoId: string, usuarioId?: string | null): Promise<boolean> {
  const marcado = await tx.pedido.updateMany({
    where: { id: pedidoId, stockDescontado: false },
    data: { stockDescontado: true },
  });
  if (marcado.count === 0) return false;

  const pedido = await tx.pedido.findUniqueOrThrow({ where: { id: pedidoId }, include: { items: true } });
  for (const item of pedido.items) {
    await moverStock(tx, {
      varianteId: item.varianteId,
      tipo: TipoMovimiento.SALIDA_VENTA,
      cantidad: -item.cantidad,
      motivo: `Venta ${pedido.codigo}`,
      pedidoId,
      usuarioId,
    });
  }
  return true;
}

/** Devuelve al inventario el stock de un pedido cancelado (DEVOLUCION). Idempotente. */
export async function devolverStockPedido(tx: Tx, pedidoId: string, usuarioId?: string | null): Promise<boolean> {
  const marcado = await tx.pedido.updateMany({
    where: { id: pedidoId, stockDescontado: true },
    data: { stockDescontado: false },
  });
  if (marcado.count === 0) return false;

  const pedido = await tx.pedido.findUniqueOrThrow({ where: { id: pedidoId }, include: { items: true } });
  for (const item of pedido.items) {
    await moverStock(tx, {
      varianteId: item.varianteId,
      tipo: TipoMovimiento.DEVOLUCION,
      cantidad: item.cantidad,
      motivo: `Cancelación ${pedido.codigo}`,
      pedidoId,
      usuarioId,
    });
  }
  return true;
}
