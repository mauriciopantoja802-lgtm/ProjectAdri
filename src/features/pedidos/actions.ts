"use server";

import { revalidatePath } from "next/cache";
import { EstadoPago, EstadoPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { revalidarTienda } from "@/lib/revalidar";
import { ESTADO_PEDIDO } from "@/lib/etiquetas";
import { descontarStockPedido, devolverStockPedido } from "@/features/inventario/servicio";
import { esquemaCambioEstado, TRANSICIONES } from "./schemas";

/** Estados en los que el pedido ya "cuenta" como venta y el stock debe estar descontado. */
const ESTADOS_CON_STOCK: EstadoPedido[] = [
  EstadoPedido.CONFIRMADO,
  EstadoPedido.PAGADO,
  EstadoPedido.EN_PREPARACION,
  EstadoPedido.ENVIADO,
  EstadoPedido.LISTO_PARA_RECOGER,
  EstadoPedido.ENTREGADO,
];

/**
 * Cambia el estado de un pedido aplicando las reglas de negocio en una sola transacción:
 * - Al confirmar (o cualquier estado posterior) se descuenta el stock, una sola vez.
 * - Al cancelar se devuelve el stock (DEVOLUCION) si ya se había descontado,
 *   los pagos pendientes quedan rechazados y se libera el uso del cupón.
 * - Al marcar PAGADO o ENTREGADO, los pagos pendientes (transferencia, contra entrega) se aprueban.
 */
export async function cambiarEstadoPedido(datos: unknown): Promise<Resultado<{ estado: EstadoPedido }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaCambioEstado.parse(datos);

    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id: d.pedidoId }, select: { estado: true, cuponId: true } });
      if (!pedido) throw new ErrorNegocio("El pedido ya no existe");
      if (!TRANSICIONES[pedido.estado].includes(d.estado)) {
        throw new ErrorNegocio(`No se puede pasar de “${ESTADO_PEDIDO[pedido.estado].etiqueta}” a “${ESTADO_PEDIDO[d.estado].etiqueta}”`);
      }

      // Bloqueo optimista: si otra pestaña cambió el estado en paralelo, esta operación no aplica.
      const cambio = await tx.pedido.updateMany({ where: { id: d.pedidoId, estado: pedido.estado }, data: { estado: d.estado } });
      if (cambio.count === 0) throw new ErrorNegocio("El pedido cambió mientras lo editabas. Recarga la página.");

      if (d.estado === EstadoPedido.CANCELADO) {
        await devolverStockPedido(tx, d.pedidoId, sesion.user.id);
        await tx.pago.updateMany({ where: { pedidoId: d.pedidoId, estado: EstadoPago.PENDIENTE }, data: { estado: EstadoPago.RECHAZADO } });
        if (pedido.cuponId) await tx.cupon.updateMany({ where: { id: pedido.cuponId, usos: { gt: 0 } }, data: { usos: { decrement: 1 } } });
      } else if (ESTADOS_CON_STOCK.includes(d.estado)) {
        await descontarStockPedido(tx, d.pedidoId, sesion.user.id);
      }

      if (d.estado === EstadoPedido.PAGADO || d.estado === EstadoPedido.ENTREGADO) {
        await tx.pago.updateMany({ where: { pedidoId: d.pedidoId, estado: EstadoPago.PENDIENTE }, data: { estado: EstadoPago.APROBADO } });
      }

      await tx.historialEstado.create({
        data: { pedidoId: d.pedidoId, estado: d.estado, nota: d.nota ?? `Cambio realizado por ${sesion.user.name ?? "admin"}` },
      });
    });

    revalidatePath("/admin/pedidos", "layout");
    revalidatePath("/admin");
    revalidarTienda();
    return { estado: d.estado };
  }, "Estado actualizado");
}
