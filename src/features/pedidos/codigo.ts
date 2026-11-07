import type { Prisma } from "@prisma/client";

/** 7 → "GA-0007". Con más de 9.999 pedidos crece solo: "GA-10000". */
export function formatearCodigoPedido(numero: number): string {
  return `GA-${String(numero).padStart(4, "0")}`;
}

/**
 * Reserva el siguiente código consecutivo. Debe llamarse DENTRO de un $transaction:
 * el incremento es atómico, así que dos ventas simultáneas nunca reciben el mismo código,
 * y si la transacción falla el número no se consume.
 */
export async function siguienteCodigoPedido(tx: Prisma.TransactionClient): Promise<string> {
  const { valor } = await tx.consecutivo.upsert({
    where: { clave: "PEDIDO" },
    create: { clave: "PEDIDO", valor: 1 },
    update: { valor: { increment: 1 } },
  });
  return formatearCodigoPedido(valor);
}
