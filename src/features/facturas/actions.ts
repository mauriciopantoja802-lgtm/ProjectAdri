"use server";

import { revalidatePath } from "next/cache";
import { TipoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { verificarLimite } from "@/lib/limite";
import { revalidarTienda } from "@/lib/revalidar";
import { slugify } from "@/lib/slug";
import { nombreCompleto } from "@/lib/nombres";
import { normalizar } from "@/features/catalogo/queries";
import { moverStock } from "@/features/inventario/servicio";
import { leerFacturaConIA } from "./lector";
import { esquemaImportacion, type FacturaExtraida } from "./schemas";

const TAMANO_MAXIMO = 8 * 1024 * 1024;

/** Palabras clave → categoría sugerida para los productos nuevos. */
const PISTAS_CATEGORIA: [RegExp, string][] = [
  [/labial|gloss|balsamo|lip|labio/, "labios"],
  // (labios va primero: "delineador de labios" ya quedó clasificado arriba)
  [/sombra|mascara|pestan|delineador|kajal|eyeliner|paleta|rimel/, "ojos"],
  [/ceja|brow/, "cejas"],
  [/esmalte|una|manicure|pedicure|nail/, "unas"],
  [/serum|micelar|crema|hidrat|limpiador|tonico|protector|bloqueador|mascarilla|skin/, "skincare"],
  [/brocha|esponja|cosmetiquera|pinza|rizador|accesorio/, "accesorios"],
  [/base|corrector|polvo|rubor|iluminador|bronzer|contorno|primer|fijador|rostro/, "rostro"],
];

export interface LineaSugerida {
  varianteId: string | null;
  nombreVariante: string | null;
  categoriaId: string | null;
  marcaId: string | null;
}

/**
 * Paso 1: lee la factura con IA y sugiere, para cada línea, si corresponde a un producto
 * que ya existe (por código de barras, SKU o nombre + tono) o si hay que crearlo.
 */
export async function leerFactura(
  formData: FormData,
): Promise<Resultado<{ factura: FacturaExtraida; sugerencias: LineaSugerida[]; proveedorId: string | null }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    verificarLimite(`factura:${sesion.user.id}`, 30, 60 * 60 * 1000);

    const archivo = formData.get("factura");
    if (!(archivo instanceof File) || archivo.size === 0) throw new ErrorNegocio("Elige la foto o el PDF de la factura");
    if (archivo.size > TAMANO_MAXIMO) throw new ErrorNegocio("El archivo pesa más de 8 MB. Toma la foto con menos resolución o divide el PDF.");

    const base64 = Buffer.from(await archivo.arrayBuffer()).toString("base64");
    const factura = await leerFacturaConIA(base64, archivo.type);

    const [variantes, categorias, marcas, proveedores] = await Promise.all([
      prisma.variante.findMany({ select: { id: true, nombre: true, sku: true, codigoBarras: true, producto: { select: { nombre: true } } } }),
      prisma.categoria.findMany({ select: { id: true, slug: true } }),
      prisma.marca.findMany({ select: { id: true, nombre: true } }),
      prisma.proveedor.findMany({ select: { id: true, nombre: true, nit: true } }),
    ]);

    const sugerencias = factura.items.map((item): LineaSugerida => {
      const codigo = item.codigoBarras?.replace(/\D/g, "");
      const ref = item.referencia?.trim().toLowerCase();
      const nombreP = normalizar(item.nombreProducto);
      const tono = item.tono ? normalizar(item.tono) : null;
      const candidata =
        (codigo && variantes.find((v) => v.codigoBarras === codigo)) ||
        (ref && variantes.find((v) => v.sku.toLowerCase() === ref)) ||
        (() => {
          const porNombre = variantes.filter((v) => {
            const prod = normalizar(v.producto.nombre);
            const mismoProducto = prod.includes(nombreP) || nombreP.includes(prod);
            const mismoTono = tono ? normalizar(v.nombre).includes(tono) || tono.includes(normalizar(v.nombre)) : v.nombre === "Única";
            return mismoProducto && mismoTono;
          });
          return porNombre.length === 1 ? porNombre[0] : null; // solo si no hay ambigüedad
        })();

      const texto = normalizar(`${item.nombreProducto} ${item.descripcion}`);
      const slugCategoria = PISTAS_CATEGORIA.find(([re]) => re.test(texto))?.[1];
      const marca = item.marca ? marcas.find((m) => normalizar(m.nombre) === normalizar(item.marca!)) : null;
      return {
        varianteId: candidata ? candidata.id : null,
        nombreVariante: candidata ? nombreCompleto(candidata.producto.nombre, candidata.nombre) : null,
        categoriaId: categorias.find((c) => c.slug === slugCategoria)?.id ?? null,
        marcaId: marca?.id ?? null,
      };
    });

    const nit = factura.proveedor.nit?.replace(/\D/g, "");
    const proveedor =
      (nit && proveedores.find((p) => p.nit?.replace(/\D/g, "").startsWith(nit.slice(0, 9)))) ||
      proveedores.find((p) => normalizar(p.nombre) === normalizar(factura.proveedor.nombre));

    return { factura, sugerencias, proveedorId: proveedor?.id ?? null };
  }, "Factura leída. Revisa los datos antes de guardar ✨");
}

async function slugDisponible(base: string, usados: Set<string>) {
  let slug = slugify(base) || "producto";
  for (let n = 2; usados.has(slug) || (await prisma.producto.findUnique({ where: { slug }, select: { id: true } })); n++) {
    slug = `${slugify(base)}-${n}`;
  }
  usados.add(slug);
  return slug;
}

/**
 * Paso 2: con los datos ya revisados por Adri, crea los productos nuevos (INACTIVOS y sin precio
 * de venta, para que no aparezcan en la tienda hasta que ella los complete), registra la compra
 * y sube el stock con una ENTRADA_COMPRA por línea, todo en una sola transacción.
 */
export async function registrarFactura(datos: unknown): Promise<Resultado<{ compraId: string; productosNuevos: { id: string; nombre: string }[] }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaImportacion.parse(datos);
    const lineas = d.items.filter((i) => i.accion !== "omitir");
    if (!lineas.length) throw new ErrorNegocio("No hay productos para registrar");

    // Los slugs se calculan antes de la transacción (consultas de solo lectura)
    const nuevos = lineas.filter((i): i is Extract<typeof i, { accion: "nuevo" }> => i.accion === "nuevo");
    const grupos = new Map<string, typeof nuevos>();
    for (const n of nuevos) {
      const clave = `${normalizar(n.nombreProducto)}|${n.categoriaId}|${n.marcaId ?? ""}`;
      grupos.set(clave, [...(grupos.get(clave) ?? []), n]);
    }
    const usados = new Set<string>();
    const slugs = new Map<string, string>();
    for (const [clave, items] of grupos) slugs.set(clave, await slugDisponible(items[0].nombreProducto, usados));

    const resultado = await prisma.$transaction(
      async (tx) => {
        const proveedorId =
          d.proveedor.id ??
          (
            await tx.proveedor.create({
              data: { nombre: d.proveedor.nombre, nit: d.proveedor.nit, telefono: d.proveedor.telefono },
            })
          ).id;

        // 1. Productos nuevos (agrupando tonos del mismo producto)
        const productosNuevos: { id: string; nombre: string }[] = [];
        const lineasCompra: { varianteId: string; cantidad: number; costoUnit: number }[] = [];
        const marcaSku = Date.now().toString(36).toUpperCase().slice(-5);
        let consecutivo = 0;
        for (const [clave, items] of grupos) {
          const primero = items[0];
          const producto = await tx.producto.create({
            data: {
              nombre: primero.nombreProducto,
              slug: slugs.get(clave)!,
              descripcion: `Producto creado desde la factura ${d.numeroFactura ?? ""} de ${d.proveedor.nombre}. Completa la descripción, las fotos y el precio de venta.`.replace(/\s+/g, " "),
              categoriaId: primero.categoriaId,
              marcaId: primero.marcaId,
              activo: false, // no se ve en la tienda hasta que Adri defina precio y fotos
              esNuevo: true,
            },
          });
          productosNuevos.push({ id: producto.id, nombre: producto.nombre });
          const nombresUsados = new Set<string>();
          for (const it of items) {
            let nombre = it.tono?.trim() || "Única";
            for (let n = 2; nombresUsados.has(nombre); n++) nombre = `${it.tono?.trim() || "Única"} ${n}`;
            nombresUsados.add(nombre);
            const codigo = it.codigoBarras || null;
            const codigoLibre = codigo ? !(await tx.variante.findUnique({ where: { codigoBarras: codigo }, select: { id: true } })) : false;
            const variante = await tx.variante.create({
              data: {
                productoId: producto.id,
                nombre,
                sku: `GA-F${marcaSku}-${String(++consecutivo).padStart(2, "0")}`,
                codigoBarras: codigoLibre ? codigo : null,
                precio: 0, // pendiente: Adri define el precio de venta al editar el producto
                costo: it.costoUnit,
                stock: 0, // el stock entra con la compra (movimiento ENTRADA_COMPRA)
                stockMinimo: 3,
              },
            });
            lineasCompra.push({ varianteId: variante.id, cantidad: it.cantidad, costoUnit: it.costoUnit });
          }
        }

        // 2. Productos existentes
        for (const it of lineas) {
          if (it.accion !== "existente") continue;
          lineasCompra.push({ varianteId: it.varianteId, cantidad: it.cantidad, costoUnit: it.costoUnit });
          if (d.actualizarCosto) await tx.variante.update({ where: { id: it.varianteId }, data: { costo: it.costoUnit } });
        }

        // 3. Compra + entradas de inventario
        const compra = await tx.compra.create({
          data: {
            proveedorId,
            fecha: new Date(`${d.fecha}T12:00:00-05:00`),
            total: lineasCompra.reduce((t, l) => t + l.cantidad * l.costoUnit, 0),
            notas: `Factura ${d.numeroFactura ?? "sin número"} (leída con IA y revisada)`,
            items: { create: lineasCompra },
          },
        });
        for (const l of lineasCompra) {
          await moverStock(tx, {
            varianteId: l.varianteId,
            tipo: TipoMovimiento.ENTRADA_COMPRA,
            cantidad: l.cantidad,
            motivo: `Compra a ${d.proveedor.nombre}${d.numeroFactura ? ` (factura ${d.numeroFactura})` : ""}`,
            compraId: compra.id,
            usuarioId: sesion.user.id,
          });
        }
        return { compraId: compra.id, productosNuevos };
      },
      { timeout: 60_000, maxWait: 10_000 },
    );

    revalidatePath("/admin", "layout");
    revalidarTienda();
    return resultado;
  }, "¡Compra registrada y stock actualizado! 🎉");
}
