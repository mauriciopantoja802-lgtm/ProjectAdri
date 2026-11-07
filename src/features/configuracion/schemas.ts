import { z } from "zod";
import { pesos } from "@/features/productos/schemas";
import { esUrlImagenPermitida } from "@/lib/imagenes";
import { PLANTILLAS_WHATSAPP, type ClavePlantilla } from "@/features/whatsapp/mensajes";

const opcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).nullable();

export const esquemaTienda = z.object({
  nombre: z.string().trim().min(2).max(60),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^(57)?3\d{9}$/, "Celular colombiano de 10 dígitos")),
  instagram: opcional(40),
  facebook: opcional(100),
  tiktok: opcional(40),
  direccion: z.string().trim().min(5, "Escribe la dirección").max(150),
  ciudad: z.string().trim().min(2).max(60),
  horario: z.string().trim().min(3, "Escribe el horario").max(150),
  // Se carga en un iframe: solo se permite el enlace "Insertar mapa" de Google Maps.
  mapaUrl: z
    .string()
    .trim()
    .refine((v) => v.startsWith("https://www.google.com/maps/embed"), "Pega el enlace de Google Maps → Compartir → Insertar mapa (https://www.google.com/maps/embed…)")
    .nullable(),
  costoDomicilio: pesos("Escribe el costo"),
  costoNacional: pesos("Escribe el costo"),
  envioGratisDesde: pesos().nullable(),
  datosPago: opcional(800),
});
export type DatosTienda = z.input<typeof esquemaTienda>;

const claves = Object.keys(PLANTILLAS_WHATSAPP) as [ClavePlantilla, ...ClavePlantilla[]];
export const esquemaPlantillas = z.object({
  plantillas: z.array(z.object({ clave: z.enum(claves), mensaje: z.string().trim().min(5, "Escribe el mensaje").max(1000) })),
});
export type DatosPlantillas = z.infer<typeof esquemaPlantillas>;

export const esquemaCupon = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "Solo letras, números y guiones (3 a 30)"),
    tipo: z.enum(["porcentaje", "valor"]),
    valor: pesos("Escribe el valor").min(1, "Debe ser mayor que 0"),
    minimoCompra: pesos("Escribe el mínimo"),
    usosMaximos: z.number().int().min(1).nullable(),
    venceEn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    activo: z.boolean(),
  })
  .refine((c) => c.tipo !== "porcentaje" || c.valor <= 90, { path: ["valor"], error: "El porcentaje máximo es 90%" });
export type DatosCupon = z.input<typeof esquemaCupon>;

export const esquemaBanner = z.object({
  titulo: z.string().trim().min(3, "Escribe el título").max(80),
  subtitulo: opcional(140),
  imagen: z.string().refine(esUrlImagenPermitida, "Sube la imagen a Cloudinary"),
  enlace: z
    .string()
    .trim()
    .regex(/^\/[\w\-/?=&%.]*$/, "Debe ser una ruta de la tienda, ej: /categoria/labios")
    .nullable(),
  orden: pesos("Orden").max(99),
  activo: z.boolean(),
});
export type DatosBanner = z.infer<typeof esquemaBanner>;
