import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, Phone, Printer, TriangleAlert, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InsigniaCanal, InsigniaEstado, InsigniaPago, InsigniaPorVencer } from "@/components/admin/pedidos/insignias";
import { CambiarEstado } from "@/components/admin/pedidos/cambiar-estado";
import { EscribirClienta } from "@/components/admin/pedidos/escribir-clienta";
import { estaPorVencer, obtenerPedidoAdmin } from "@/features/pedidos/queries";
import { TRANSICIONES } from "@/features/pedidos/schemas";
import { mensajesParaPedido } from "@/features/whatsapp/plantillas";
import { ESTADO_PEDIDO, METODO_PAGO, TIPO_ENTREGA } from "@/lib/etiquetas";
import { formatoCOP, formatoFechaHoraCO } from "@/lib/formato";
import { urlSeguimiento } from "@/lib/token-pedido";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Detalle del pedido" };

function Tarjeta({ titulo, children, className }: { titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-3xl bg-white p-5 shadow-suave", className)}>
      <h2 className="mb-3 text-lg font-semibold text-berry">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function DetallePedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await obtenerPedidoAdmin(id);
  if (!p) notFound();
  const { mensajes, sugerida } = await mensajesParaPedido(p);
  const vence = estaPorVencer(p);
  const alertas = p.historial.filter((h) => h.nota?.startsWith("⚠️"));
  const utilidad = p.total - p.costoEnvio - p.items.reduce((t, i) => t + i.costoUnit * i.cantidad, 0);

  return (
    <>
      <Link href="/admin/pedidos" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Pedidos
      </Link>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-berry">Pedido {p.codigo}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <InsigniaEstado estado={p.estado} />
            {vence && <InsigniaPorVencer />}
            <InsigniaCanal canal={p.canal} />
            <span className="text-sm text-muted-foreground">{formatoFechaHoraCO(p.creadoEn)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/pos/comprobante/${p.id}`} target="_blank" rel="noopener" className={buttonVariants({ variant: "outline" })}>
            <Printer aria-hidden /> Comprobante
          </a>
          <a href={urlSeguimiento(p.codigo)} target="_blank" rel="noopener" className={buttonVariants({ variant: "ghost" })}>
            <ExternalLink aria-hidden /> Vista de la clienta
          </a>
        </div>
      </div>

      {alertas.map((a) => (
        <p key={a.id} className="mb-4 flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {a.nota}
        </p>
      ))}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Tarjeta titulo="Productos">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link href={`/admin/inventario/${i.variante.id}`} className="hover:text-primary">
                        {i.nombre}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {i.variante.sku} · stock actual {i.variante.stock}
                        {i.descuento > 0 && ` · descuento ${formatoCOP(i.descuento)}`}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">{i.cantidad}</TableCell>
                    <TableCell className="text-right">{formatoCOP(i.precioUnit)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatoCOP(i.precioUnit * i.cantidad - i.descuento)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatoCOP(p.subtotal)}</dd>
              </div>
              {p.descuento > 0 && (
                <div className="flex justify-between">
                  <dt>Descuento{p.cupon && ` (${p.cupon.codigo})`}</dt>
                  <dd>-{formatoCOP(p.descuento)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd>{p.costoEnvio ? formatoCOP(p.costoEnvio) : "Gratis"}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-1 text-base font-bold">
                <dt>Total</dt>
                <dd>{formatoCOP(p.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <dt>Utilidad estimada</dt>
                <dd>{formatoCOP(utilidad)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              Stock: {p.stockDescontado ? "ya descontado del inventario ✓" : "aún no se ha descontado (se descuenta al confirmar)"}
            </p>
          </Tarjeta>

          <Tarjeta titulo="Historial de estados">
            <ol className="relative space-y-4 border-l-2 border-secondary pl-5">
              {p.historial.map((h) => (
                <li key={h.id} className="relative">
                  <span className="absolute top-1 -left-[1.6rem] size-3 rounded-full bg-primary ring-4 ring-white" aria-hidden />
                  <p className="text-sm font-semibold">{ESTADO_PEDIDO[h.estado].etiqueta}</p>
                  <p className="text-xs text-muted-foreground">{formatoFechaHoraCO(h.creadoEn)}</p>
                  {h.nota && <p className="mt-0.5 text-sm">{h.nota}</p>}
                </li>
              ))}
            </ol>
          </Tarjeta>
        </div>

        <div className="space-y-6">
          <Tarjeta titulo="Cambiar estado">
            <CambiarEstado pedidoId={p.id} opciones={TRANSICIONES[p.estado]} stockDescontado={p.stockDescontado} />
          </Tarjeta>

          <Tarjeta titulo="WhatsApp">
            <EscribirClienta mensajes={mensajes} sugerida={sugerida} />
          </Tarjeta>

          <Tarjeta titulo="Clienta y entrega">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <User className="size-4 shrink-0 text-primary" aria-hidden />
                {p.clienta ? (
                  <Link href={`/admin/clientas/${p.clienta.id}`} className="hover:text-primary">
                    {p.nombreClienta ?? p.clienta.nombre} · {p.clienta._count.pedidos} pedido(s)
                  </Link>
                ) : (
                  (p.nombreClienta ?? "Sin nombre (por definir en WhatsApp)")
                )}
              </li>
              {p.telefono && (
                <li className="flex gap-2">
                  <Phone className="size-4 shrink-0 text-primary" aria-hidden /> {p.telefono.replace(/^57/, "")}
                </li>
              )}
              <li className="flex gap-2">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  {TIPO_ENTREGA[p.tipoEntrega]}
                  {p.direccionEnvio && (
                    <>
                      <br />
                      {p.direccionEnvio}
                      {p.ciudadEnvio && `, ${p.ciudadEnvio}`}
                    </>
                  )}
                </span>
              </li>
            </ul>
            {p.notas && <p className="mt-3 rounded-xl bg-nude p-3 text-sm whitespace-pre-line">{p.notas}</p>}
          </Tarjeta>

          <Tarjeta titulo="Pagos">
            {p.pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados (se acuerda por WhatsApp).</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {p.pagos.map((pg) => (
                  <li key={pg.id} className="flex items-center justify-between gap-2">
                    <span>
                      {METODO_PAGO[pg.metodo]}
                      {pg.referencia && <span className="block font-mono text-[0.7rem] text-muted-foreground">{pg.referencia}</span>}
                    </span>
                    <span className="flex items-center gap-2">
                      <strong>{formatoCOP(pg.monto)}</strong>
                      <InsigniaPago estado={pg.estado} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
