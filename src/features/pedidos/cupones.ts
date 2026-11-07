import "server-only";
import type { Cupon, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErrorNegocio } from "@/lib/errores";
import { formatoCOP } from "@/lib/formato";

type Cliente = Prisma.TransactionClient | typeof prisma;

/** Revisa que el cupón exista, esté vigente y aplique; devuelve el descuento en pesos. */
export async function evaluarCupon(codigo: string, subtotal: number, db: Cliente = prisma): Promise<{ cupon: Cupon; descuento: number }> {
  const cupon = await db.cupon.findUnique({ where: { codigo: codigo.trim().toUpperCase() } });
  if (!cupon || !cupon.activo) throw new ErrorNegocio("Este cupón no existe o ya no está activo");
  if (cupon.venceEn && cupon.venceEn < new Date()) throw new ErrorNegocio("Este cupón ya venció");
  if (cupon.usosMaximos !== null && cupon.usos >= cupon.usosMaximos) throw new ErrorNegocio("Este cupón ya alcanzó su límite de usos");
  if (subtotal < cupon.minimoCompra) {
    throw new ErrorNegocio(`Este cupón aplica para compras desde ${formatoCOP(cupon.minimoCompra)}`);
  }
  const bruto = cupon.porcentaje ? Math.round((subtotal * cupon.porcentaje) / 100) : (cupon.valorFijo ?? 0);
  return { cupon, descuento: Math.min(bruto, subtotal) };
}

/**
 * Suma un uso al cupón de forma atómica: si dos clientas usan el último cupón disponible
 * al mismo tiempo, solo una lo logra.
 */
export async function consumirCupon(tx: Prisma.TransactionClient, cuponId: string) {
  const r = await tx.cupon.updateMany({
    where: { id: cuponId, OR: [{ usosMaximos: null }, { usos: { lt: tx.cupon.fields.usosMaximos } }] },
    data: { usos: { increment: 1 } },
  });
  if (r.count === 0) throw new ErrorNegocio("Este cupón ya alcanzó su límite de usos");
}
