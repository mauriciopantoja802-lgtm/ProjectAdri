import "server-only";
import { prisma } from "@/lib/prisma";

export async function datosCuenta(usuarioId: string, limitePedidos = 5) {
  const clienta = await prisma.clienta.findUnique({
    where: { usuarioId },
    include: {
      direcciones: true,
      pedidos: {
        orderBy: { creadoEn: "desc" },
        take: limitePedidos,
        select: { id: true, codigo: true, creadoEn: true, estado: true, total: true, canal: true, _count: { select: { items: true } } },
      },
      _count: { select: { pedidos: true } },
    },
  });
  return clienta;
}
