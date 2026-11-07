import { z } from "zod";
import { esUrlImagenPermitida } from "@/lib/imagenes";

/** Pesos colombianos: enteros, sin decimales, no negativos. */
export const pesos = (mensaje = "Escribe un valor") =>
  z.number({ error: mensaje }).int("Debe ser un número entero").min(0, "No puede ser negativo").max(100_000_000, "Valor demasiado alto");

const slug = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(100, "Máximo 100 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: labial-mate)");

export const esquemaVariante = z
  .object({
    id: z.string().optional(),
    nombre: z.string().trim().min(1, "Escribe el tono o nombre").max(80, "Máximo 80 caracteres"),
    colorHex: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido")
      .nullable(),
    sku: z
      .string()
      .trim()
      .min(2, "Escribe el SKU")
      .max(40, "Máximo 40 caracteres")
      .regex(/^[A-Za-z0-9._-]+$/, "Solo letras, números, puntos y guiones"),
    codigoBarras: z.string().trim().max(32, "Máximo 32 dígitos").regex(/^\d+$/, "Solo números").nullable(),
    precio: pesos("Escribe el precio").min(100, "Precio muy bajo"),
    precioOferta: pesos().nullable(),
    costo: pesos("Escribe el costo"),
    stock: pesos("Escribe el stock inicial"), // solo se usa al crear la variante
    stockMinimo: pesos("Escribe el stock mínimo"),
    activo: z.boolean(),
  })
  .refine((v) => v.precioOferta === null || v.precioOferta < v.precio, {
    path: ["precioOferta"],
    error: "La oferta debe ser menor que el precio normal",
  });

export const esquemaImagen = z.object({
  url: z.string().refine(esUrlImagenPermitida, "La imagen debe venir de Cloudinary (https://res.cloudinary.com/…)"),
  alt: z.string().trim().max(150, "Máximo 150 caracteres").nullable(),
});

export const esquemaProducto = z
  .object({
    nombre: z.string().trim().min(3, "Escribe el nombre del producto").max(120, "Máximo 120 caracteres"),
    slug,
    descripcion: z.string().trim().min(10, "Escribe una descripción (mínimo 10 caracteres)").max(3000),
    modoUso: z.string().trim().max(2000).nullable(),
    categoriaId: z.string().min(1, "Elige una categoría"),
    marcaId: z.string().nullable(),
    esNuevo: z.boolean(),
    destacado: z.boolean(),
    activo: z.boolean(),
    imagenes: z.array(esquemaImagen).max(10, "Máximo 10 imágenes"),
    variantes: z.array(esquemaVariante).min(1, "Agrega al menos una variante (tono o presentación)"),
  })
  .superRefine((p, ctx) => {
    const repetido = (valores: (string | null)[]) => {
      const vistos = new Set<string>();
      return valores.findIndex((v) => v !== null && (vistos.has(v.toUpperCase()) || !vistos.add(v.toUpperCase())));
    };
    const iSku = repetido(p.variantes.map((v) => v.sku));
    if (iSku >= 0) ctx.addIssue({ code: "custom", path: ["variantes", iSku, "sku"], message: "SKU repetido en otra variante" });
    const iBarras = repetido(p.variantes.map((v) => v.codigoBarras));
    if (iBarras >= 0)
      ctx.addIssue({ code: "custom", path: ["variantes", iBarras, "codigoBarras"], message: "Código repetido en otra variante" });
  });

export type DatosProducto = z.infer<typeof esquemaProducto>;
export type DatosVariante = z.infer<typeof esquemaVariante>;

export const esquemaCategoria = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre").max(60, "Máximo 60 caracteres"),
  slug,
  imagen: z.string().refine(esUrlImagenPermitida, "Usa una imagen de Cloudinary").nullable(),
  orden: pesos("Escribe el orden").max(999),
});

export const esquemaMarca = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre").max(60, "Máximo 60 caracteres"),
  slug,
});

export type DatosCategoria = z.infer<typeof esquemaCategoria>;
export type DatosMarca = z.infer<typeof esquemaMarca>;
