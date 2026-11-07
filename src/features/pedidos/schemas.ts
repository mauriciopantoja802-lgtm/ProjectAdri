import { z } from "zod";
import { EstadoPedido } from "@prisma/client";

export const esquemaItemsCarrito = z
  .array(
    z.object({
      varianteId: z.string().min(1),
      cantidad: z.number().int().min(1).max(50, "Máximo 50 unidades por producto"),
    }),
  )
  .min(1, "Tu carrito está vacío")
  .max(30, "Máximo 30 productos distintos por pedido");

export const TIPOS_ENTREGA = ["RECOGER_EN_TIENDA", "DOMICILIO_POPAYAN", "ENVIO_NACIONAL"] as const;
export const METODOS_CHECKOUT = ["WOMPI", "CONTRA_ENTREGA", "TRANSFERENCIA", "NEQUI", "DAVIPLATA"] as const;

const opcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres`).nullable();

export const esquemaCheckout = z
  .object({
    items: esquemaItemsCarrito,
    canal: z.enum(["WEB", "WHATSAPP"]),
    nombre: z.string().trim().min(3, "Escribe tu nombre completo").max(80),
    telefono: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^(57)?3\d{9}$/, "Escribe un celular de 10 dígitos, ej: 300 123 4567")),
    email: z.email("Correo inválido").nullable(),
    tipoEntrega: z.enum(TIPOS_ENTREGA, { error: "Elige cómo quieres recibir tu pedido" }),
    direccion: opcional(150),
    barrio: opcional(80),
    ciudad: opcional(60),
    referencia: opcional(150),
    metodoPago: z.enum(METODOS_CHECKOUT, { error: "Elige un método de pago" }),
    cupon: opcional(40),
    notas: opcional(300),
    guardarDireccion: z.boolean(),
    aceptaDatos: z.boolean().refine((v) => v, "Debes aceptar la política de tratamiento de datos"),
  })
  .superRefine((d, ctx) => {
    if (d.tipoEntrega !== "RECOGER_EN_TIENDA" && (!d.direccion || d.direccion.length < 5)) {
      ctx.addIssue({ code: "custom", path: ["direccion"], message: "Escribe la dirección de entrega" });
    }
    if (d.tipoEntrega === "ENVIO_NACIONAL" && (!d.ciudad || d.ciudad.length < 3)) {
      ctx.addIssue({ code: "custom", path: ["ciudad"], message: "Escribe la ciudad de destino" });
    }
    if (d.metodoPago === "CONTRA_ENTREGA" && d.tipoEntrega === "ENVIO_NACIONAL") {
      ctx.addIssue({ code: "custom", path: ["metodoPago"], message: "Contra entrega solo está disponible en Popayán" });
    }
    if (d.canal === "WEB" && !["WOMPI", "CONTRA_ENTREGA"].includes(d.metodoPago)) {
      ctx.addIssue({ code: "custom", path: ["metodoPago"], message: "Elige pago en línea o contra entrega" });
    }
  });
export type DatosCheckout = z.input<typeof esquemaCheckout>;

export const esquemaPedidoRapido = z.object({
  items: esquemaItemsCarrito,
  tipoEntrega: z.enum(TIPOS_ENTREGA).nullable(),
});

/** Transiciones de estado permitidas en el panel. */
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  PENDIENTE: ["CONFIRMADO", "PAGADO", "CANCELADO"],
  CONFIRMADO: ["PAGADO", "EN_PREPARACION", "ENVIADO", "LISTO_PARA_RECOGER", "ENTREGADO", "CANCELADO"],
  PAGADO: ["EN_PREPARACION", "ENVIADO", "LISTO_PARA_RECOGER", "ENTREGADO", "CANCELADO"],
  EN_PREPARACION: ["ENVIADO", "LISTO_PARA_RECOGER", "ENTREGADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO", "CANCELADO"],
  LISTO_PARA_RECOGER: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: ["CANCELADO"],
  CANCELADO: [],
};

export const esquemaCambioEstado = z.object({
  pedidoId: z.string().min(1),
  estado: z.enum(EstadoPedido),
  nota: z.string().trim().max(300).nullable(),
});

/** Horas que un pedido de WhatsApp puede estar PENDIENTE antes de marcarse "por vencer". */
export const HORAS_POR_VENCER = 48;
