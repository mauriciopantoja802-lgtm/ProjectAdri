"use server";

import { revalidatePath } from "next/cache";
import { EstadoPago, EstadoPedido, type MetodoPago, type Prisma, type TipoEntrega } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { ipCliente, verificarLimite } from "@/lib/limite";
import { nombreCompleto } from "@/lib/nombres";
import { urlSeguimiento } from "@/lib/token-pedido";
import { METODO_PAGO } from "@/lib/etiquetas";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { crearEnlaceWhatsapp, normalizarNumeroWhatsapp } from "@/features/whatsapp/enlaces";
import { mensajePedido } from "@/features/whatsapp/mensajes";
import { nuevaReferencia, urlCheckoutWompi, wompiConfigurado } from "@/features/pagos/wompi";
import { siguienteCodigoPedido } from "./codigo";
import { calcularTotales } from "./calculos";
import { calcularEnvio, permiteContraEntrega } from "./envio";
import { consumirCupon, evaluarCupon } from "./cupones";
import { esquemaCheckout, esquemaItemsCarrito, esquemaPedidoRapido, TIPOS_ENTREGA } from "./schemas";

type Db = Prisma.TransactionClient | typeof prisma;

/** Lee precios, costos y stock reales de la BD. Nunca se confía en el precio del carrito. */
async function prepararItems(db: Db, items: { varianteId: string; cantidad: number }[]) {
  const variantes = await db.variante.findMany({
    where: { id: { in: items.map((i) => i.varianteId) } },
    include: { producto: { select: { nombre: true, activo: true } } },
  });
  const porId = new Map(variantes.map((v) => [v.id, v]));
  return items.map((it) => {
    const v = porId.get(it.varianteId);
    if (!v || !v.activo || !v.producto.activo) throw new ErrorNegocio("Uno de los productos de tu carrito ya no está disponible");
    const nombre = nombreCompleto(v.producto.nombre, v.nombre);
    if (it.cantidad > v.stock) {
      throw new ErrorNegocio(v.stock > 0 ? `Solo quedan ${v.stock} unidad(es) de ${nombre}` : `${nombre} se agotó`);
    }
    return { varianteId: v.id, nombre, cantidad: it.cantidad, precioUnit: v.precioOferta ?? v.precio, costoUnit: v.costo, descuento: 0 };
  });
}

// ------------------------------------------------------------------ Carrito

export interface ItemValidado {
  varianteId: string;
  disponible: boolean;
  precio: number;
  stock: number;
}

/** Actualiza el carrito con precios y stock actuales (los precios pudieron cambiar desde que se agregó). */
export async function validarCarrito(items: unknown): Promise<ItemValidado[]> {
  const lista = esquemaItemsCarrito.safeParse(items);
  if (!lista.success) return [];
  const variantes = await prisma.variante.findMany({
    where: { id: { in: lista.data.map((i) => i.varianteId) } },
    select: { id: true, activo: true, precio: true, precioOferta: true, stock: true, producto: { select: { activo: true } } },
  });
  return variantes.map((v) => ({
    varianteId: v.id,
    disponible: v.activo && v.producto.activo && v.stock > 0,
    precio: v.precioOferta ?? v.precio,
    stock: Math.max(0, v.stock),
  }));
}

/** Resumen en vivo del checkout (subtotal, cupón, envío y total), calculado en el servidor. */
export async function cotizarPedido(datos: {
  items: { varianteId: string; cantidad: number }[];
  tipoEntrega: TipoEntrega;
  cupon: string | null;
}) {
  const config = await obtenerConfiguracion();
  const items = esquemaItemsCarrito.safeParse(datos.items);
  if (!items.success || !TIPOS_ENTREGA.includes(datos.tipoEntrega)) return null;
  try {
    const lineas = await prepararItems(prisma, items.data);
    const base = calcularTotales(lineas);
    let descuento = 0;
    let errorCupon: string | null = null;
    if (datos.cupon?.trim()) {
      try {
        descuento = (await evaluarCupon(datos.cupon, base.subtotal)).descuento;
      } catch (e) {
        errorCupon = e instanceof ErrorNegocio ? e.message : "Cupón inválido";
      }
    }
    const costoEnvio = calcularEnvio(datos.tipoEntrega, base.subtotal - descuento, config);
    return { ...calcularTotales(lineas, descuento, costoEnvio), errorCupon, error: null as string | null };
  } catch (e) {
    return { subtotal: 0, descuento: 0, costoEnvio: 0, total: 0, errorCupon: null, error: e instanceof ErrorNegocio ? e.message : "Error al calcular" };
  }
}

// ------------------------------------------------------------------ Crear pedidos

async function clientaDelPedido(tx: Prisma.TransactionClient, telefono: string | null, nombre: string | null, email: string | null) {
  const sesion = await auth();
  if (sesion?.user?.id) {
    const propia = await tx.clienta.findUnique({ where: { usuarioId: sesion.user.id } });
    if (propia) return propia;
  }
  if (!telefono) return null;
  return tx.clienta.upsert({
    where: { telefono },
    create: { telefono, nombre: nombre ?? "Clienta", email },
    update: {},
  });
}

/**
 * Checkout completo (Fase 7/8). Crea el pedido PENDIENTE sin descontar stock:
 * - Web con Wompi: el stock se descuenta cuando el webhook confirma el pago.
 * - Web contra entrega y WhatsApp: el stock se descuenta cuando Adri confirma el pedido.
 */
export async function crearPedidoTienda(
  datos: unknown,
): Promise<Resultado<{ codigo: string; url: string; whatsapp: string | null; pago: string | null }>> {
  return ejecutar(async () => {
    verificarLimite(`pedido:${await ipCliente()}`, 10, 10 * 60 * 1000);
    const d = esquemaCheckout.parse(datos);
    if (d.metodoPago === "CONTRA_ENTREGA" && !permiteContraEntrega(d.tipoEntrega)) {
      throw new ErrorNegocio("Contra entrega solo está disponible en Popayán");
    }
    if (d.metodoPago === "WOMPI" && !wompiConfigurado()) {
      throw new ErrorNegocio("El pago en línea no está disponible en este momento. Elige contra entrega o pide por WhatsApp.");
    }
    const config = await obtenerConfiguracion();
    const telefono = normalizarNumeroWhatsapp(d.telefono);
    const sesion = await auth();
    const metodo = d.metodoPago as MetodoPago;
    const direccionCompleta = d.tipoEntrega === "RECOGER_EN_TIENDA" ? null : [d.direccion, d.barrio, d.referencia].filter(Boolean).join(" · ");
    const ciudad = d.tipoEntrega === "ENVIO_NACIONAL" ? d.ciudad : d.tipoEntrega === "DOMICILIO_POPAYAN" ? "Popayán" : null;

    const resultado = await prisma.$transaction(async (tx) => {
      const lineas = await prepararItems(tx, d.items);
      const base = calcularTotales(lineas);
      const cupon = d.cupon?.trim() ? await evaluarCupon(d.cupon, base.subtotal, tx) : null;
      const costoEnvio = calcularEnvio(d.tipoEntrega, base.subtotal - (cupon?.descuento ?? 0), config);
      const totales = calcularTotales(lineas, cupon?.descuento ?? 0, costoEnvio);
      if (cupon) await consumirCupon(tx, cupon.cupon.id);

      const clienta = await clientaDelPedido(tx, telefono, d.nombre, d.email);
      if (clienta && d.guardarDireccion && sesion?.user && clienta.usuarioId === sesion.user.id && d.direccion) {
        const existe = await tx.direccion.findFirst({ where: { clientaId: clienta.id, direccion: d.direccion } });
        if (!existe) {
          await tx.direccion.create({
            data: { clientaId: clienta.id, direccion: d.direccion, barrio: d.barrio, referencia: d.referencia, ciudad: ciudad ?? "Popayán" },
          });
        }
      }

      const codigo = await siguienteCodigoPedido(tx);
      const referencia = metodo === "WOMPI" ? nuevaReferencia(codigo) : null;
      const pedido = await tx.pedido.create({
        data: {
          codigo,
          canal: d.canal,
          estado: EstadoPedido.PENDIENTE,
          metodoPago: metodo,
          clientaId: clienta?.id,
          nombreClienta: d.nombre,
          telefono,
          tipoEntrega: d.tipoEntrega,
          direccionEnvio: direccionCompleta,
          ciudadEnvio: ciudad,
          ...totales,
          cuponId: cupon?.cupon.id,
          notas: d.notas,
          items: { create: lineas },
          pagos: { create: { metodo, monto: totales.total, estado: EstadoPago.PENDIENTE, referencia } },
          historial: {
            create: {
              estado: EstadoPedido.PENDIENTE,
              nota: d.canal === "WHATSAPP" ? "Pedido enviado por WhatsApp desde la web" : `Pedido web (${METODO_PAGO[metodo]})`,
            },
          },
        },
      });
      return { pedido, lineas, totales, referencia };
    });

    const { pedido, lineas, totales, referencia } = resultado;
    const url = urlSeguimiento(pedido.codigo);
    const whatsapp =
      d.canal === "WHATSAPP"
        ? crearEnlaceWhatsapp(
            config.whatsapp,
            mensajePedido({
              codigo: pedido.codigo,
              items: lineas.map((l) => ({ cantidad: l.cantidad, nombre: l.nombre, total: l.precioUnit * l.cantidad })),
              ...totales,
              tipoEntrega: d.tipoEntrega,
              nombre: d.nombre,
              direccion: direccionCompleta ? `${direccionCompleta}${ciudad ? `, ${ciudad}` : ""}` : null,
              metodoPago: METODO_PAGO[metodo],
            }),
          )
        : null;

    const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const pago =
      referencia !== null
        ? urlCheckoutWompi({ referencia, monto: totales.total, redirectUrl: `${sitio}${url}`, email: d.email, nombre: d.nombre, telefono })
        : null;

    revalidatePath("/admin/pedidos");
    return { codigo: pedido.codigo, url, whatsapp, pago };
  }, "¡Pedido recibido! 💖");
}

/**
 * "Pedir por WhatsApp" desde un producto o el carrito, sin llenar formulario.
 * Guarda el pedido (canal WHATSAPP, PENDIENTE) para que su código aparezca en el mensaje
 * y Adri lo encuentre en el panel. No descuenta stock.
 */
export async function crearPedidoWhatsappRapido(datos: unknown): Promise<Resultado<{ codigo: string; whatsapp: string }>> {
  return ejecutar(async () => {
    verificarLimite(`pedido:${await ipCliente()}`, 10, 10 * 60 * 1000);
    const d = esquemaPedidoRapido.parse(datos);
    const config = await obtenerConfiguracion();
    const sesion = await auth();

    const { pedido, lineas, totales, clienta } = await prisma.$transaction(async (tx) => {
      const lineas = await prepararItems(tx, d.items);
      const totales = calcularTotales(lineas);
      const clienta = sesion?.user?.id ? await tx.clienta.findUnique({ where: { usuarioId: sesion.user.id } }) : null;
      const codigo = await siguienteCodigoPedido(tx);
      const pedido = await tx.pedido.create({
        data: {
          codigo,
          canal: "WHATSAPP",
          estado: EstadoPedido.PENDIENTE,
          clientaId: clienta?.id,
          nombreClienta: clienta?.nombre ?? null,
          telefono: clienta?.telefono ?? null,
          tipoEntrega: d.tipoEntrega ?? "RECOGER_EN_TIENDA",
          ...totales,
          notas: d.tipoEntrega ? null : "Tipo de entrega por definir con la clienta",
          items: { create: lineas },
          historial: { create: { estado: EstadoPedido.PENDIENTE, nota: "Pedido rápido por WhatsApp desde la web" } },
        },
      });
      return { pedido, lineas, totales, clienta };
    });

    const whatsapp = crearEnlaceWhatsapp(
      config.whatsapp,
      mensajePedido({
        codigo: pedido.codigo,
        items: lineas.map((l) => ({ cantidad: l.cantidad, nombre: l.nombre, total: l.precioUnit * l.cantidad })),
        ...totales,
        tipoEntrega: d.tipoEntrega,
        nombre: clienta?.nombre ?? null,
        direccion: null,
      }),
    );
    revalidatePath("/admin/pedidos");
    return { codigo: pedido.codigo, whatsapp };
  }, "Abriendo WhatsApp… 💬");
}
