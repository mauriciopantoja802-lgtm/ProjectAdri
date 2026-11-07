import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock, PackageX, Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { TarjetaMetrica } from "@/components/admin/tarjeta-metrica";
import { GraficaCanales, GraficaVentasDia } from "@/components/admin/graficas";
import { InsigniaCanal, InsigniaEstado } from "@/components/admin/pedidos/insignias";
import { metricasDashboard } from "@/features/reportes/queries";
import { formatoCOP, formatoFechaHoraCO } from "@/lib/formato";
import { nombreCompleto } from "@/lib/nombres";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function Seccion({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl bg-white p-5 shadow-suave">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-berry">{titulo}</h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export default async function Dashboard() {
  const m = await metricasDashboard();

  return (
    <>
      <EncabezadoPagina titulo="¡Hola, Adri! ✨" descripcion="Así va tu negocio hoy.">
        <Link href="/admin/pos" className={buttonVariants({ variant: "glow" })}>
          <ShoppingBag aria-hidden /> Nueva venta
        </Link>
      </EncabezadoPagina>

      {m.porVencer > 0 && (
        <Link href="/admin/pedidos?vencer=1" className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 hover:bg-red-100">
          <Clock className="size-5 shrink-0" aria-hidden />
          <strong>{m.porVencer} pedido(s) de WhatsApp por vencer</strong> (más de 48 h sin confirmar) →
        </Link>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaMetrica titulo="Ventas de hoy" valor={formatoCOP(m.hoy.ventas)} detalle={`${m.hoy.pedidos} venta(s)`} icono={Receipt} />
        <TarjetaMetrica titulo="Esta semana" valor={formatoCOP(m.semana.ventas)} detalle={`${m.semana.pedidos} venta(s)`} icono={CalendarDays} />
        <TarjetaMetrica titulo="Este mes" valor={formatoCOP(m.mes.ventas)} detalle={`${m.mes.pedidos} venta(s) · ticket ${formatoCOP(m.mes.ticket)}`} icono={Wallet} />
        <TarjetaMetrica titulo="Utilidad del mes" valor={formatoCOP(m.mes.utilidad)} detalle={`Margen ${m.mes.margen}%`} icono={TrendingUp} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Seccion titulo="Ventas por día (últimos 30 días)">
          <GraficaVentasDia datos={m.porDia} />
        </Seccion>
        <Seccion titulo="Ventas del mes por canal">
          <GraficaCanales datos={m.porCanal} />
        </Seccion>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Seccion titulo="Top 10 del mes" accion={<Link href="/admin/reportes" className="text-xs font-semibold text-primary hover:underline">Reportes →</Link>}>
          {m.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin ventas este mes todavía.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {m.top.map((p, i) => (
                <li key={p.varianteId} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-nude text-xs font-bold text-primary">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.nombre}</span>
                  <span className="text-xs text-muted-foreground">{p.unidades} u.</span>
                  <span className="font-semibold tabular-nums">{formatoCOP(p.ventas)}</span>
                </li>
              ))}
            </ol>
          )}
        </Seccion>

        <Seccion
          titulo={`Stock bajo (${m.totalStockBajo})`}
          accion={<Link href="/admin/inventario?bajo=1" className="text-xs font-semibold text-primary hover:underline">Ver todo →</Link>}
        >
          {m.stockBajo.length === 0 ? (
            <p className="text-sm text-muted-foreground">¡Todo el inventario está sobre el mínimo! ✓</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {m.stockBajo.map((v) => (
                <li key={v.id} className="flex items-center gap-2">
                  <PackageX className={v.stock === 0 ? "size-4 text-destructive" : "size-4 text-amber-600"} aria-hidden />
                  <Link href={`/admin/inventario/${v.id}`} className="min-w-0 flex-1 truncate hover:text-primary">
                    {nombreCompleto(v.producto.nombre, v.nombre)}
                  </Link>
                  <span className={v.stock === 0 ? "font-bold text-destructive" : "font-semibold text-amber-700"}>
                    {v.stock === 0 ? "Agotado" : `${v.stock} / mín ${v.stockMinimo}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Pedidos por atender" accion={<Link href="/admin/pedidos?estado=PENDIENTE" className="text-xs font-semibold text-primary hover:underline">Ver pedidos →</Link>}>
          {m.pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos pendientes. 🎉</p>
          ) : (
            <ul className="space-y-2.5 text-sm">
              {m.pendientes.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/pedidos/${p.id}`} className="flex items-start justify-between gap-2 hover:text-primary">
                    <span className="min-w-0">
                      <span className="font-semibold">{p.codigo}</span> · <span className="truncate">{p.nombreClienta ?? "Sin nombre"}</span>
                      <span className="block text-xs text-muted-foreground">
                        <InsigniaCanal canal={p.canal} /> · {formatoFechaHoraCO(p.creadoEn)}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <InsigniaEstado estado={p.estado} />
                      <span className="text-xs font-semibold">{formatoCOP(p.total)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>
    </>
  );
}
