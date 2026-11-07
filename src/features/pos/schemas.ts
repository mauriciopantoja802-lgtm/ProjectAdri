import { z } from "zod";
import { pesos } from "@/features/productos/schemas";

export const CANALES_POS = ["TIENDA_FISICA", "WHATSAPP", "INSTAGRAM", "OTRO"] as const;
export const METODOS_POS = ["EFECTIVO", "TRANSFERENCIA", "NEQUI", "DAVIPLATA", "TARJETA", "MIXTO"] as const;
/** Métodos que se pueden combinar en un pago MIXTO. */
export const METODOS_SIMPLES = ["EFECTIVO", "TRANSFERENCIA", "NEQUI", "DAVIPLATA", "TARJETA"] as const;

export const esquemaVentaPOS = z
  .object({
    canal: z.enum(CANALES_POS),
    items: z
      .array(
        z.object({
          varianteId: z.string().min(1),
          cantidad: z.number().int().min(1, "Cantidad mínima 1").max(999),
          descuento: pesos("Descuento"),
        }),
      )
      .min(1, "Agrega al menos un producto al ticket"),
    descuentoTotal: pesos("Descuento"),
    clienta: z.object({
      nombre: z.string().trim().max(80).nullable(),
      telefono: z
        .string()
        .trim()
        .regex(/^(57)?3\d{9}$/, "Celular inválido (10 dígitos)")
        .nullable(),
    }),
    metodoPago: z.enum(METODOS_POS),
    pagos: z.array(z.object({ metodo: z.enum(METODOS_SIMPLES), monto: pesos("Monto") })),
    recibido: pesos().nullable(), // efectivo entregado por la clienta (para calcular el cambio)
    notas: z.string().trim().max(300).nullable(),
  })
  .refine((v) => v.metodoPago !== "MIXTO" || v.pagos.filter((p) => p.monto > 0).length >= 2, {
    path: ["pagos"],
    error: "En un pago mixto, reparte el total entre al menos dos métodos",
  });

export type DatosVentaPOS = z.infer<typeof esquemaVentaPOS>;

export const esquemaCierre = z.object({
  dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baseInicial: pesos("Escribe la base inicial"),
  efectivoContado: pesos("Escribe el efectivo contado"),
  notas: z.string().trim().max(500).nullable(),
});
export type DatosCierre = z.infer<typeof esquemaCierre>;
