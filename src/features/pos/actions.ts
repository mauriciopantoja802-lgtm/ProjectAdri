"use server";

import { revalidatePath } from "next/cache";
import { EstadoPago, EstadoPedido, MetodoPago, TipoEntrega } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";
import { revalidarTienda } from "@/lib/revalidar";
import { formatoCOP } from "@/lib/formato";
import { nombreCompleto } from "@/lib/nombres";
import { normalizarNumeroWhatsapp } from "@/features/whatsapp/enlaces";
import { siguienteCodigoPedido } from "@/features/pedidos/codigo";
import { calcularTotales } from "@/features/pedidos/calculos";
import { descontarStockPedido } from "@/features/inventario/servicio";
import { resumenCaja } from "./caja";
import { esquemaCierre, esquemaVentaPOS } from "./schemas";

/**
 * Cobra una venta del POS (tienda física, WhatsApp, Instagram u otro canal).
 * En UNA transacción: crea el pedido ENTREGADO con su código consecutivo, registra los pagos
 * y descuenta el stock. Si algo falla (ej: falta stock), no se guarda nada.
 */
export async function registrarVentaPOS(datos: unknown): Promise<Resultado<{ id: string; codigo: string }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaVentaPOS.parse(datos);

    // Precios y costos SIEMPRE desde la base de datos, nunca desde el navegador.
    const variantes = await prisma.variante.findMany({
      where: { id: { in: d.items.map((i) => i.varianteId) } },
      include: { producto: { select: { nombre: true, activo: true } } },
    });
    const porId = new Map(variantes.map((v) => [v.id, v]));

    const items = d.items.map((it) => {
      const v = porId.get(it.varianteId);
      if (!v || !v.activo || !v.producto.activo) throw new ErrorNegocio("Uno de los productos ya no está disponible");
      const precioUnit = v.precioOferta ?? v.precio;
      if (it.descuento > precioUnit * it.cantidad) {
        throw new ErrorNegocio(`El descuento de ${v.producto.nombre} es mayor que su valor`);
      }
      return {
        varianteId: v.id,
        nombre: nombreCompleto(v.producto.nombre, v.nombre),
        cantidad: it.cantidad,
        precioUnit,
        costoUnit: v.costo,
        descuento: it.descuento,
      };
    });

    const { subtotal, descuento, total } = calcularTotales(items, d.descuentoTotal);
    if (d.descuentoTotal > subtotal) throw new ErrorNegocio("El descuento es mayor que el valor de la venta");

    // Pagos: uno solo por el total, o varios si es MIXTO (deben sumar exactamente el total).
    const pagos =
      d.metodoPago === "MIXTO"
        ? d.pagos.filter((p) => p.monto > 0)
        : [{ metodo: d.metodoPago as Exclude<(typeof d)["metodoPago"], "MIXTO">, monto: total }];
    const sumaPagos = pagos.reduce((t, p) => t + p.monto, 0);
    if (sumaPagos !== total) {
      throw new ErrorNegocio(`Los pagos suman ${formatoCOP(sumaPagos)} pero el total es ${formatoCOP(total)}`);
    }

    const efectivo = pagos.filter((p) => p.metodo === "EFECTIVO").reduce((t, p) => t + p.monto, 0);
    if (d.recibido !== null && efectivo > 0 && d.recibido < efectivo) {
      throw new ErrorNegocio("El efectivo recibido es menor que lo que se debe pagar en efectivo");
    }
    const notas = [
      d.notas,
      d.recibido !== null && efectivo > 0
        ? `Efectivo recibido: ${formatoCOP(d.recibido)} · Cambio: ${formatoCOP(d.recibido - efectivo)}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const telefono = d.clienta.telefono ? normalizarNumeroWhatsapp(d.clienta.telefono) : null;

    const pedido = await prisma.$transaction(async (tx) => {
      // La clienta es opcional; si da su celular, queda en la base de clientas.
      const clienta = telefono
        ? await tx.clienta.upsert({
            where: { telefono },
            create: { telefono, nombre: d.clienta.nombre ?? "Clienta" },
            update: {},
          })
        : null;

      const codigo = await siguienteCodigoPedido(tx);
      const p = await tx.pedido.create({
        data: {
          codigo,
          canal: d.canal,
          estado: EstadoPedido.ENTREGADO,
          metodoPago: d.metodoPago as MetodoPago,
          clientaId: clienta?.id,
          nombreClienta: d.clienta.nombre ?? clienta?.nombre ?? "Venta de mostrador",
          telefono,
          tipoEntrega: TipoEntrega.RECOGER_EN_TIENDA,
          subtotal,
          descuento,
          costoEnvio: 0,
          total,
          notas: notas || null,
          items: { create: items },
          pagos: { create: pagos.map((pg) => ({ metodo: pg.metodo, monto: pg.monto, estado: EstadoPago.APROBADO })) },
          historial: {
            create: { estado: EstadoPedido.ENTREGADO, nota: `Venta registrada en el POS por ${sesion.user.name ?? "admin"}` },
          },
        },
      });
      await descontarStockPedido(tx, p.id, sesion.user.id);
      return p;
    });

    revalidatePath("/admin", "layout");
    revalidarTienda();
    return { id: pedido.id, codigo: pedido.codigo };
  }, "¡Venta registrada! 💖");
}

/** Guarda el cierre de caja del día con el desglose por método de pago. */
export async function registrarCierre(datos: unknown): Promise<Resultado<{ diferencia: number }>> {
  return ejecutar(async () => {
    const sesion = await requerirAdmin();
    const d = esquemaCierre.parse(datos);
    const resumen = await resumenCaja(d.dia);
    const esperado = d.baseInicial + resumen.efectivo;
    const diferencia = d.efectivoContado - esperado;

    await prisma.cierreCaja.create({
      data: {
        // Fecha del día cerrado (mediodía en Bogotá) para que el historial muestre el día correcto.
        fecha: new Date(`${d.dia}T12:00:00-05:00`),
        baseInicial: d.baseInicial,
        totalEfectivo: resumen.efectivo,
        totalOtros: resumen.total - resumen.efectivo,
        efectivoContado: d.efectivoContado,
        diferencia,
        detalle: resumen.porMetodo,
        notas: d.notas,
        usuarioId: sesion.user.id,
      },
    });
    revalidatePath("/admin/caja");
    return { diferencia };
  }, "Cierre de caja guardado");
}
