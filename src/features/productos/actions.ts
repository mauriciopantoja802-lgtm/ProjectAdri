"use server";

import { revalidatePath } from "next/cache";
import { TipoMovimiento, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { revalidarTienda } from "@/lib/revalidar";
import { esquemaCategoria, esquemaMarca, esquemaProducto, type DatosVariante } from "./schemas";

function refrescar() {
  revalidatePath("/admin/productos", "layout");
  revalidarTienda();
}

function datosVariante(v: DatosVariante) {
  return {
    nombre: v.nombre,
    colorHex: v.colorHex,
    sku: v.sku.toUpperCase(),
    codigoBarras: v.codigoBarras,
    precio: v.precio,
    precioOferta: v.precioOferta,
    costo: v.costo,
    stockMinimo: v.stockMinimo,
    activo: v.activo,
  };
}

/**
 * Crea la variante y, si trae stock inicial, registra el movimiento correspondiente:
 * el stock nunca cambia sin dejar rastro en el kardex.
 */
async function crearVariante(tx: Prisma.TransactionClient, productoId: string, v: DatosVariante, usuarioId: string) {
  const creada = await tx.variante.create({ data: { productoId, ...datosVariante(v), stock: v.stock } });
  if (v.stock > 0) {
    await tx.movimientoInventario.create({
      data: {
        varianteId: creada.id,
        tipo: TipoMovimiento.AJUSTE_POSITIVO,
        cantidad: v.stock,
        stockFinal: v.stock,
        motivo: "Stock inicial al crear la variante",
        usuarioId,
      },
    });
  }
}

/** Crea (id = null) o actualiza un producto con sus imágenes y variantes. */
export async function guardarProducto(id: string | null, datos: unknown): Promise<Resultado<{ id: string }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaProducto.parse(datos);
    const campos = {
      nombre: d.nombre,
      slug: d.slug,
      descripcion: d.descripcion,
      modoUso: d.modoUso,
      categoriaId: d.categoriaId,
      marcaId: d.marcaId,
      esNuevo: d.esNuevo,
      destacado: d.destacado,
      activo: d.activo,
    };
    const imagenes = d.imagenes.map((img, orden) => ({ url: img.url, alt: img.alt, orden }));

    const productoId = await prisma.$transaction(async (tx) => {
      if (!id) {
        const p = await tx.producto.create({ data: { ...campos, imagenes: { create: imagenes } } });
        for (const v of d.variantes) await crearVariante(tx, p.id, v, sesion.user.id);
        return p.id;
      }

      const actual = await tx.producto.findUnique({
        where: { id },
        include: {
          variantes: { include: { _count: { select: { itemsPedido: true, movimientos: true, itemsCompra: true } } } },
        },
      });
      if (!actual) throw new ErrorNegocio("El producto ya no existe");

      await tx.producto.update({ where: { id }, data: campos });
      await tx.imagenProducto.deleteMany({ where: { productoId: id } });
      if (imagenes.length) await tx.imagenProducto.createMany({ data: imagenes.map((i) => ({ ...i, productoId: id })) });

      const existentes = new Map(actual.variantes.map((v) => [v.id, v]));
      const enFormulario = new Set(d.variantes.flatMap((v) => (v.id ? [v.id] : [])));

      // Variantes quitadas del formulario: se borran si no tienen historia; si la tienen, se desactivan
      // (borrarlas dañaría los reportes de ventas y el kardex).
      for (const v of actual.variantes) {
        if (enFormulario.has(v.id)) continue;
        const tieneHistoria = v._count.itemsPedido + v._count.movimientos + v._count.itemsCompra > 0;
        if (tieneHistoria) await tx.variante.update({ where: { id: v.id }, data: { activo: false } });
        else await tx.variante.delete({ where: { id: v.id } });
      }

      for (const v of d.variantes) {
        if (v.id) {
          if (!existentes.has(v.id)) throw new ErrorNegocio("Una de las variantes no pertenece a este producto");
          // El stock NO se edita aquí: se cambia desde Inventario con un movimiento.
          await tx.variante.update({ where: { id: v.id }, data: datosVariante(v) });
        } else {
          await crearVariante(tx, id, v, sesion.user.id);
        }
      }
      return id;
    });

    refrescar();
    return { id: productoId };
  }, id ? "Producto actualizado" : "Producto creado ✨");
}

export async function cambiarEstadoProducto(id: string, activo: boolean): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    await prisma.producto.update({ where: { id }, data: { activo } });
    refrescar();
    return null;
  }, activo ? "Producto activado: ya se ve en la tienda" : "Producto desactivado: ya no se ve en la tienda");
}

export async function eliminarProducto(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const conHistoria = await prisma.variante.count({
      where: {
        productoId: id,
        OR: [{ itemsPedido: { some: {} } }, { movimientos: { some: {} } }, { itemsCompra: { some: {} } }],
      },
    });
    if (conHistoria > 0) {
      throw new ErrorNegocio(
        "Este producto tiene ventas o movimientos de inventario. Desactívalo en lugar de eliminarlo para no perder el historial.",
      );
    }
    await prisma.producto.delete({ where: { id } });
    refrescar();
    return null;
  }, "Producto eliminado");
}

// ---------------------------------------------------------------- Categorías y marcas

export async function guardarCategoria(id: string | null, datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaCategoria.parse(datos);
    if (id) await prisma.categoria.update({ where: { id }, data: d });
    else await prisma.categoria.create({ data: d });
    refrescar();
    return null;
  }, id ? "Categoría actualizada" : "Categoría creada");
}

export async function eliminarCategoria(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const productos = await prisma.producto.count({ where: { categoriaId: id } });
    if (productos > 0) throw new ErrorNegocio(`No se puede eliminar: tiene ${productos} producto(s). Muévelos a otra categoría primero.`);
    await prisma.categoria.delete({ where: { id } });
    refrescar();
    return null;
  }, "Categoría eliminada");
}

export async function guardarMarca(id: string | null, datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaMarca.parse(datos);
    if (id) await prisma.marca.update({ where: { id }, data: d });
    else await prisma.marca.create({ data: d });
    refrescar();
    return null;
  }, id ? "Marca actualizada" : "Marca creada");
}

export async function eliminarMarca(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    // Los productos de la marca quedan "sin marca" en lugar de bloquear la eliminación.
    await prisma.$transaction([
      prisma.producto.updateMany({ where: { marcaId: id }, data: { marcaId: null } }),
      prisma.marca.delete({ where: { id } }),
    ]);
    refrescar();
    return null;
  }, "Marca eliminada");
}
