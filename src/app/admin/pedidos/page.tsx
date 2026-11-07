import type { Metadata } from "next";
import Link from "next/link";
import { CanalVenta, EstadoPedido, MetodoPago } from "@prisma/client";
import { ClipboardList, Clock, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { claseSelect } from "@/components/compartidos/campos";
import { InsigniaCanal, InsigniaEstado, InsigniaPorVencer } from "@/components/admin/pedidos/insignias";
import { estaPorVencer, listarPedidos } from "@/features/pedidos/queries";
import { CANAL_VENTA, ESTADO_PEDIDO, METODO_PAGO } from "@/lib/etiquetas";
import { formatoCOP, formatoFechaHoraCO } from "@/lib/formato";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pedidos" };

type Params = Record<"estado" | "canal" | "metodo" | "desde" | "hasta" | "q" | "vencer" | "pagina", string | undefined>;

export default async function Pedidos({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const { pedidos, total, porVencer, pendientes, paginas } = await listarPedidos({ ...sp, porVencer: sp.vencer === "1", pagina });

  return (
    <>
      <EncabezadoPagina titulo="Pedidos" descripcion={`${total} pedido(s) · ${pendientes} pendiente(s) por atender`}>
        <Link href="/admin/pos" className={buttonVariants({ variant: "glow" })}>
          Registrar venta
        </Link>
      </EncabezadoPagina>

      {porVencer > 0 && (
        <Link
          href="/admin/pedidos?vencer=1"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 transition-colors hover:bg-red-100"
        >
          <Clock className="size-5 shrink-0" aria-hidden />
          <span>
            <strong>{porVencer} pedido(s) de WhatsApp</strong> llevan más de 48 horas sin confirmar. Revísalos →
          </span>
        </Link>
      )}

      <form className="mb-4 grid gap-2 rounded-3xl bg-white p-3 shadow-suave sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_auto_auto_auto]">
        <Input name="q" defaultValue={sp.q} placeholder="Código, nombre o celular" aria-label="Buscar pedido" />
        <select name="estado" defaultValue={sp.estado ?? ""} aria-label="Estado" className={claseSelect}>
          <option value="">Todos los estados</option>
          {Object.values(EstadoPedido).map((e) => (
            <option key={e} value={e}>
              {ESTADO_PEDIDO[e].etiqueta}
            </option>
          ))}
        </select>
        <select name="canal" defaultValue={sp.canal ?? ""} aria-label="Canal" className={claseSelect}>
          <option value="">Todos los canales</option>
          {Object.values(CanalVenta).map((c) => (
            <option key={c} value={c}>
              {CANAL_VENTA[c].etiqueta}
            </option>
          ))}
        </select>
        <select name="metodo" defaultValue={sp.metodo ?? ""} aria-label="Método de pago" className={claseSelect}>
          <option value="">Todos los pagos</option>
          {Object.values(MetodoPago).map((m) => (
            <option key={m} value={m}>
              {METODO_PAGO[m]}
            </option>
          ))}
        </select>
        <Input type="date" name="desde" defaultValue={sp.desde} aria-label="Desde" />
        <Input type="date" name="hasta" defaultValue={sp.hasta} aria-label="Hasta" />
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filtrar
        </Button>
      </form>

      {pedidos.length === 0 ? (
        <EstadoVacio icono={ClipboardList} titulo="No hay pedidos" descripcion="Prueba con otros filtros." />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead>Clienta</TableHead>
                <TableHead className="hidden sm:table-cell">Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((p) => {
                const vence = estaPorVencer(p);
                return (
                  <TableRow key={p.id} className={cn(vence && "bg-red-50/60")}>
                    <TableCell>
                      <Link href={`/admin/pedidos/${p.id}`} className="font-semibold text-primary hover:underline">
                        {p.codigo}
                      </Link>
                      <p className="text-xs text-muted-foreground">{p._count.items} ítem(s)</p>
                    </TableCell>
                    <TableCell className="hidden text-xs whitespace-nowrap md:table-cell">{formatoFechaHoraCO(p.creadoEn)}</TableCell>
                    <TableCell className="max-w-40 truncate text-sm">{p.nombreClienta ?? "Sin nombre"}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <InsigniaCanal canal={p.canal} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <InsigniaEstado estado={p.estado} />
                        {vence && <InsigniaPorVencer />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold whitespace-nowrap">{formatoCOP(p.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/pedidos" parametros={sp} />
    </>
  );
}
