import { z } from "zod";
import { pesos } from "@/features/productos/schemas";

export const TIPOS_AJUSTE = ["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO", "DEVOLUCION"] as const;

export const MOTIVOS_AJUSTE: Record<(typeof TIPOS_AJUSTE)[number], string[]> = {
  AJUSTE_POSITIVO: ["Conteo físico (sobrante)", "Regalo de proveedor", "Corrección de error", "Otro"],
  AJUSTE_NEGATIVO: ["Daño", "Vencimiento", "Pérdida", "Regalo a clienta", "Uso como probador", "Conteo físico (faltante)", "Otro"],
  DEVOLUCION: ["Devolución de clienta", "Cambio de producto", "Otro"],
};

export const esquemaAjuste = z.object({
  varianteId: z.string().min(1),
  tipo: z.enum(TIPOS_AJUSTE, { error: "Elige el tipo de movimiento" }),
  cantidad: z.number({ error: "Escribe la cantidad" }).int("Debe ser un número entero").min(1, "Mínimo 1").max(10000),
  motivo: z.string().min(1, "Elige un motivo"),
  detalle: z.string().trim().max(200).nullable(),
});
export type DatosAjuste = z.infer<typeof esquemaAjuste>;

const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).nullable();

export const esquemaProveedor = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre").max(120),
  telefono: textoOpcional(30),
  email: z.email("Correo inválido").nullable(),
  nit: textoOpcional(30),
});
export type DatosProveedor = z.infer<typeof esquemaProveedor>;

export const esquemaCompra = z.object({
  proveedorId: z.string().min(1, "Elige el proveedor"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige la fecha"),
  notas: textoOpcional(500),
  actualizarCosto: z.boolean(),
  items: z
    .array(
      z.object({
        varianteId: z.string().min(1),
        nombre: z.string(), // solo para mostrar
        cantidad: z.number({ error: "Cantidad" }).int().min(1, "Mínimo 1").max(10000),
        costoUnit: pesos("Costo"),
      }),
    )
    .min(1, "Agrega al menos un producto a la compra"),
});
export type DatosCompra = z.infer<typeof esquemaCompra>;
