import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, Clock, Lock, MessageCircle, Package, XCircle } from "lucide-react";
import { EstadoPago, EstadoPedido } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { verificarTokenPedido } from "@/lib/token-pedido";
import { ESTADO_PEDIDO, METODO_PAGO, TIPO_ENTREGA } from "@/lib/etiquetas";
import { formatoCOP, formatoFechaHoraCO } from "@/lib/formato";
import { obtenerPedidoPublico } from "@/features/pedidos/queries";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { consultarTransaccion, procesarTransaccion, wompiConfigurado } from "@/features/pagos/wompi";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { InsigniaEstado } from "@/components/admin/pedidos/insignias";
import { BotonReintentarPago } from "@/components/tienda/pedido/boton-reintentar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ codigo: string }>; searchParams: Promise<{ t?: string; id?: string }> };

const PASOS: EstadoPedido[] = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "ENVIADO", "ENTREGADO"];

export default async function SeguimientoPedido({ params, searchParams }: Props) {
  const [{ codigo }, sp] = await Promise.all([params, searchParams]);
  const sesion = await auth();
  let pedido = await obtenerPedidoPublico(codigo);
  if (!pedido) notFound();

  // Acceso: con el enlace firmado, la dueña con sesión o una administradora.
  const permitido =
    verificarTokenPedido(codigo, sp.t) ||
    (sesion?.user?.id && pedido.clienta?.usuarioId === sesion.user.id) ||
    sesion?.user?.rol === "ADMIN";
  if (!permitido) notFound(); // no revelamos si el código existe

  // Al volver de Wompi llega ?id=<transacción>: la consultamos para no depender solo del webhook.
  if (sp.id && wompiConfigurado() && pedido.pagos.some((p) => p.metodo === "WOMPI" && p.estado === EstadoPago.PENDIENTE)) {
    const t = await consultarTransaccion(sp.id).catch(() => null);
    if (t && pedido.pagos.some((p) => p.referencia === t.reference)) {
      await procesarTransaccion(t);
      pedido = (await obtenerPedidoPublico(codigo))!;
    }
  }

  const config = await obtenerConfiguracion();
  const pagoWompi = pedido.pagos.filter((p) => p.metodo === "WOMPI").at(-1);
  const pagado = pedido.pagos.some((p) => p.estado === EstadoPago.APROBADO);
  const puedeReintentar = pedido.estado === EstadoPedido.PENDIENTE && pagoWompi && pagoWompi.estado !== EstadoPago.APROBADO && wompiConfigurado() && sp.t;
  const cancelado = pedido.estado === EstadoPedido.CANCELADO;
  const pasoFinal = pedido.tipoEntrega === "RECOGER_EN_TIENDA" ? "LISTO_PARA_RECOGER" : "ENVIADO";
  const pasos = PASOS.map((p) => (p === "ENVIADO" ? pasoFinal : p));
  const indiceActual = Math.max(
    pasos.indexOf(pedido.estado === "PAGADO" ? "CONFIRMADO" : pedido.estado),
    pedido.estado === "ENTREGADO" ? pasos.length - 1 : -1,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-3 text-center">
        {cancelado ? (
          <XCircle className="mx-auto size-14 text-zinc-400" aria-hidden />
        ) : pagado || pedido.estado !== "PENDIENTE" ? (
          <CircleCheck className="mx-auto size-14 text-green-600" aria-hidden />
        ) : (
          <Clock className="mx-auto size-14 text-primary" aria-hidden />
        )}
        <h1 className="text-3xl font-bold text-berry">
          {cancelado ? "Pedido cancelado" : pedido.estado === "PENDIENTE" ? "¡Recibimos tu pedido! 💖" : "¡Gracias por tu compra! 💖"}
        </h1>
        <p className="text-muted-foreground">
          Pedido <strong className="text-berry">#{pedido.codigo}</strong> · {formatoFechaHoraCO(pedido.creadoEn)}
        </p>
        <InsigniaEstado estado={pedido.estado} />
      </header>

      {pagoWompi?.estado === EstadoPago.RECHAZADO && pedido.estado === "PENDIENTE" && (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">
          Tu pago no fue aprobado. Puedes intentarlo de nuevo o escribirnos por WhatsApp.
        </p>
      )}
      {pagoWompi?.estado === EstadoPago.PENDIENTE && pedido.estado === "PENDIENTE" && sp.id && (
        <p className="rounded-2xl bg-amber-50 p-4 text-center text-sm text-amber-800">
          Tu pago está en proceso. Esta página se actualizará cuando Wompi lo confirme (recárgala en unos segundos).
        </p>
      )}

      {!cancelado && (
        <ol className="flex justify-between gap-1 rounded-3xl bg-white p-5 shadow-suave" aria-label="Progreso del pedido">
          {pasos.map((paso, i) => (
            <li key={paso} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={i === indiceActual ? "step" : undefined}>
              <span className={cn("flex size-8 items-center justify-center rounded-full text-xs font-bold", i <= indiceActual ? "bg-glow text-white" : "bg-nude text-muted-foreground")}>
                {i + 1}
              </span>
              <span className={cn("text-[0.7rem] leading-tight sm:text-xs", i <= indiceActual ? "font-semibold text-berry" : "text-muted-foreground")}>
                {ESTADO_PEDIDO[paso].etiqueta}
              </span>
            </li>
          ))}
        </ol>
      )}

      <section className="rounded-3xl bg-white p-5 shadow-suave sm:p-6">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-berry">
          <Package className="size-5 text-primary" aria-hidden /> Resumen
        </h2>
        <ul className="divide-y divide-border text-sm">
          {pedido.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 py-2">
              <span>
                {i.cantidad} × {i.nombre}
              </span>
              <span className="font-medium tabular-nums">{formatoCOP(i.precioUnit * i.cantidad - i.descuento)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatoCOP(pedido.subtotal)}</dd>
          </div>
          {pedido.descuento > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Descuento</dt>
              <dd>-{formatoCOP(pedido.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd>{pedido.costoEnvio ? formatoCOP(pedido.costoEnvio) : "Gratis"}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold text-berry">
            <dt>Total</dt>
            <dd>{formatoCOP(pedido.total)}</dd>
          </div>
        </dl>
        <div className="mt-4 grid gap-2 rounded-2xl bg-nude p-4 text-sm sm:grid-cols-2">
          <p>
            <strong>Entrega:</strong> {TIPO_ENTREGA[pedido.tipoEntrega]}
            {pedido.direccionEnvio && (
              <>
                <br />
                {pedido.direccionEnvio}
                {pedido.ciudadEnvio && `, ${pedido.ciudadEnvio}`}
              </>
            )}
            {pedido.tipoEntrega === "RECOGER_EN_TIENDA" && (
              <>
                <br />
                {config.direccion} · {config.horario}
              </>
            )}
          </p>
          <p>
            <strong>Pago:</strong> {pedido.metodoPago ? METODO_PAGO[pedido.metodoPago] : "Por acordar"}
            <br />
            {pagado ? "✓ Pagado" : cancelado ? "—" : "Pendiente"}
          </p>
        </div>
      </section>

      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        {puedeReintentar && <BotonReintentarPago codigo={pedido.codigo} token={sp.t!} />}
        <a
          href={crearEnlaceWhatsapp(config.whatsapp, `¡Hola Adri! 💖 Tengo una pregunta sobre mi pedido #${pedido.codigo}`)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: "whatsapp", size: "lg" })}
        >
          <MessageCircle aria-hidden /> Escribir por WhatsApp
        </a>
        <Link href="/productos" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Seguir comprando
        </Link>
      </div>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden /> Guarda este enlace: es privado y te permite ver el estado de tu pedido.
      </p>
    </div>
  );
}
