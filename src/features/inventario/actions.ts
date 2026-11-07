"use server";

import { revalidatePath } from "next/cache";
import { TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { revalidarTienda } from "@/lib/revalidar";
import { moverStock } from "./servicio";
import { esquemaAjuste, esquemaCompra, esquemaProveedor } from "./schemas";

function refrescar() {
  revalidatePath("/admin/inventario", "layout");
  revalidatePath("/admin/proveedores", "layout");
  revalidatePath("/admin/productos");
  revalidarTienda(); // el stock disponible se muestra en la tienda
}

/** Ajuste manual: positivo, negativo (daño, pérdida…) o devolución de una clienta. */
export async function registrarAjuste(datos: unknown): Promise<Resultado<{ stock: number }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaAjuste.parse(datos);
    const signo = d.tipo === TipoMovimiento.AJUSTE_NEGATIVO ? -1 : 1;
    const stock = await prisma.$transaction((tx) =>
      moverStock(tx, {
        varianteId: d.varianteId,
        tipo: d.tipo,
        cantidad: signo * d.cantidad,
        motivo: d.detalle ? `${d.motivo}: ${d.detalle}` : d.motivo,
        usuarioId: sesion.user.id,
      }),
    );
    refrescar();
    return { stock };
  }, "Movimiento registrado");
}

// ---------------------------------------------------------------- Proveedores

export async function guardarProveedor(id: string | null, datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaProveedor.parse(datos);
    if (id) await prisma.proveedor.update({ where: { id }, data: d });
    else await prisma.proveedor.create({ data: d });
    refrescar();
    return null;
  }, id ? "Proveedor actualizado" : "Proveedor creado");
}

export async function eliminarProveedor(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const compras = await prisma.compra.count({ where: { proveedorId: id } });
    if (compras > 0) throw new ErrorNegocio(`No se puede eliminar: tiene ${compras} compra(s) registradas.`);
    await prisma.proveedor.delete({ where: { id } });
    refrescar();
    return null;
  }, "Proveedor eliminado");
}

// ---------------------------------------------------------------- Compras

/**
 * Registra una compra a proveedor. En la misma transacción crea una ENTRADA_COMPRA por ítem
 * (sube el stock) y, si se pide, actualiza el costo de cada variante al de esta compra.
 */
export async function registrarCompra(datos: unknown): Promise<Resultado<{ id: string }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaCompra.parse(datos);

    // Si la misma variante aparece dos veces, se suman (un solo movimiento por variante).
    const agrupados = new Map<string, { cantidad: number; costoUnit: number }>();
    for (const it of d.items) {
      const previo = agrupados.get(it.varianteId);
      agrupados.set(it.varianteId, { cantidad: (previo?.cantidad ?? 0) + it.cantidad, costoUnit: it.costoUnit });
    }
    const items = [...agrupados].map(([varianteId, v]) => ({ varianteId, ...v }));
    const total = items.reduce((t, it) => t + it.cantidad * it.costoUnit, 0);

    const compra = await prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.findUnique({ where: { id: d.proveedorId }, select: { nombre: true } });
      if (!proveedor) throw new ErrorNegocio("El proveedor no existe");

      const c = await tx.compra.create({
        data: {
          proveedorId: d.proveedorId,
          // Mediodía en Bogotá: evita que la fecha "salte" de día por la zona horaria.
          fecha: new Date(`${d.fecha}T12:00:00-05:00`),
          notas: d.notas,
          total,
          items: { create: items },
        },
      });
      for (const it of items) {
        await moverStock(tx, {
          varianteId: it.varianteId,
          tipo: TipoMovimiento.ENTRADA_COMPRA,
          cantidad: it.cantidad,
          motivo: `Compra a ${proveedor.nombre}`,
          compraId: c.id,
          usuarioId: sesion.user.id,
        });
        if (d.actualizarCosto) await tx.variante.update({ where: { id: it.varianteId }, data: { costo: it.costoUnit } });
      }
      return c;
    });
    refrescar();
    return { id: compra.id };
  }, "Compra registrada: el stock ya se actualizó ✨");
}
