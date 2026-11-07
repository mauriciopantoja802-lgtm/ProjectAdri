import { z } from "zod";
import { pesos } from "@/features/productos/schemas";

/**
 * Lo que Claude devuelve al leer la foto o PDF de una factura de proveedor.
 * Es el formato de "salida estructurada": la API garantiza que la respuesta cumple este esquema.
 */
export const esquemaFacturaExtraida = z.object({
  proveedor: z.object({
    nombre: z.string().describe("Razón social o nombre del proveedor tal como aparece en la factura"),
    nit: z.string().nullable().describe("NIT o cédula del proveedor, sin puntos; null si no aparece"),
    telefono: z.string().nullable(),
  }),
  numeroFactura: z.string().nullable(),
  fecha: z.string().nullable().describe("Fecha de la factura en formato AAAA-MM-DD; null si no se lee"),
  items: z
    .array(
      z.object({
        descripcion: z.string().describe("Texto del producto tal como aparece en la línea de la factura"),
        nombreProducto: z.string().describe("Nombre del producto sin el tono/color, en formato título, ej: 'Labial Mate Larga Duración'"),
        tono: z.string().nullable().describe("Tono, color o referencia de color si la línea lo indica, ej: 'Tono 03 - Rosa Nude'; null si no aplica"),
        marca: z.string().nullable(),
        referencia: z.string().nullable().describe("Código o referencia del proveedor para esa línea"),
        codigoBarras: z.string().nullable().describe("Código EAN/UPC si aparece (solo dígitos)"),
        cantidad: z.number().int().describe("Unidades compradas"),
        costoUnitario: z.number().int().describe("Costo final por unidad en pesos colombianos, entero, con IVA y descuentos de línea incluidos"),
      }),
    )
    .describe("Una entrada por cada línea de producto de la factura"),
  total: z.number().int().nullable().describe("Total a pagar de la factura en pesos, si aparece"),
  observaciones: z.string().nullable().describe("Dudas de lectura o supuestos hechos (ej: 'IVA del 19% sumado al costo unitario')"),
});
export type FacturaExtraida = z.infer<typeof esquemaFacturaExtraida>;

/** Lo que Adri confirma en la pantalla de revisión antes de crear productos y registrar la compra. */
export const esquemaImportacion = z.object({
  proveedor: z.object({
    id: z.string().nullable(),
    nombre: z.string().trim().min(2, "Escribe el proveedor").max(120),
    nit: z.string().trim().max(30).nullable(),
    telefono: z.string().trim().max(30).nullable(),
  }),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  numeroFactura: z.string().trim().max(60).nullable(),
  actualizarCosto: z.boolean(),
  items: z
    .array(
      z.discriminatedUnion("accion", [
        z.object({
          accion: z.literal("existente"),
          varianteId: z.string().min(1, "Elige el producto"),
          cantidad: z.number().int().min(1).max(10000),
          costoUnit: pesos("Costo"),
        }),
        z.object({
          accion: z.literal("nuevo"),
          nombreProducto: z.string().trim().min(3, "Nombre del producto").max(120),
          tono: z.string().trim().max(80).nullable(),
          categoriaId: z.string().min(1, "Elige la categoría"),
          marcaId: z.string().nullable(),
          codigoBarras: z.string().trim().regex(/^\d*$/, "Solo números").max(32).nullable(),
          cantidad: z.number().int().min(1).max(10000),
          costoUnit: pesos("Costo"),
        }),
        z.object({ accion: z.literal("omitir") }),
      ]),
    )
    .min(1),
});
export type DatosImportacion = z.infer<typeof esquemaImportacion>;
