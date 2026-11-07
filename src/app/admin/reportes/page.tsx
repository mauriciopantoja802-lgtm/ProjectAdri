import type { Metadata } from "next";
import { CanalVenta } from "@prisma/client";
import { Download, FileSpreadsheet, Percent, Receipt, Search, TrendingUp, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { claseSelect } from "@/components/compartidos/campos";
import { TarjetaMetrica } from "@/components/admin/tarjeta-metrica";
import { GraficaCanales, GraficaVentasDia } from "@/components/admin/graficas";
import { reporteVentas } from "@/features/reportes/queries";
import { CANAL_VENTA, METODO_PAGO } from "@/lib/etiquetas";
import { claveDiaBogota, formatoCOP, formatoNumeroCO } from "@/lib/formato";
import { nombreCompleto } from "@/lib/nombres";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

const esDia = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

function Bloque({ titulo, children, exportar }: { titulo: string; children: React.ReactNode; exportar?: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-suave">
      <div className="flex items-center justify-between gap-2 p-5 pb-2">
        <h2 className="text-lg font-semibold text-berry">{titulo}</h2>
        {exportar && (
          <div className="flex gap-1">
            <a href={`${exportar}&formato=xlsx`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              <FileSpreadsheet aria-hidden /> Excel
            </a>
            <a href={`${exportar}&formato=csv`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              CSV
            </a>
          </div>
        )}
      </div>
      {children}
    </section>
  );
}

export default async function Reportes({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string; canal?: string }> }) {
  const sp = await searchParams;
  const hoy = claveDiaBogota(new Date());
  const desde = esDia(sp.desde) ?? `${hoy.slice(0, 8)}01`;
  const hasta = esDia(sp.hasta) ?? hoy;
  const canal = Object.values(CanalVenta).find((c) => c === sp.canal);
  const r = await reporteVentas({ desde, hasta, canal });
  const qs = `desde=${desde}&hasta=${hasta}${canal ? `&canal=${canal}` : ""}`;
  const exp = (tipo: string) => `/api/reportes/export?tipo=${tipo}&${qs}`;

  return (
    <>
      <EncabezadoPagina titulo="Reportes" descripcion="Ventas, utilidad y productos en el periodo elegido.">
        <a href={exp("inventario") + "&formato=xlsx"} className={buttonVariants({ variant: "outline" })}>
          <Download aria-hidden /> Inventario (Excel)
        </a>
        <a href={exp("clientas") + "&formato=xlsx"} className={buttonVariants({ variant: "outline" })}>
          <Download aria-hidden /> Clientas (Excel)
        </a>
      </EncabezadoPagina>

      <form className="mb-6 flex flex-wrap items-end gap-2 rounded-3xl bg-white p-3 shadow-suave">
        <label className="text-xs text-muted-foreground">
          Desde
          <Input type="date" name="desde" defaultValue={desde} max={hoy} className="w-44" />
        </label>
        <label className="text-xs text-muted-foreground">
          Hasta
          <Input type="date" name="hasta" defaultValue={hasta} max={hoy} className="w-44" />
        </label>
        <label className="text-xs text-muted-foreground">
          Canal
          <select name="canal" defaultValue={canal ?? ""} className={cn(claseSelect, "w-44")}>
            <option value="">Todos</option>
            {Object.values(CanalVenta).map((c) => (
              <option key={c} value={c}>
                {CANAL_VENTA[c].etiqueta}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="glow">
          <Search aria-hidden /> Ver reporte
        </Button>
      </form>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaMetrica titulo="Ventas" valor={formatoCOP(r.resumen.ventas)} detalle={`${r.resumen.pedidos} venta(s)`} icono={Receipt} />
        <TarjetaMetrica titulo="Ticket promedio" valor={formatoCOP(r.resumen.ticket)} icono={Wallet} />
        <TarjetaMetrica titulo="Utilidad" valor={formatoCOP(r.resumen.utilidad)} detalle={`Costo de productos ${formatoCOP(r.resumen.costo)}`} icono={TrendingUp} />
        <TarjetaMetrica titulo="Margen" valor={`${r.resumen.margen}%`} detalle={`Descuentos ${formatoCOP(r.resumen.descuentos)} · Envíos ${formatoCOP(r.resumen.envios)}`} icono={Percent} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Bloque titulo="Ventas por día" exportar={exp("ventas")}>
          <div className="px-5 pb-5">
            {r.porDia.length ? <GraficaVentasDia datos={r.porDia} /> : <p className="text-sm text-muted-foreground">Elige un rango de hasta 120 días para ver la gráfica.</p>}
          </div>
        </Bloque>
        <Bloque titulo="Por canal">
          <div className="px-5 pb-5">
            <GraficaCanales datos={r.porCanal} />
          </div>
        </Bloque>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Bloque titulo="Por categoría" exportar={exp("categorias")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Unid.</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porCategoria.map((c) => (
                <TableRow key={c.categoria}>
                  <TableCell>{c.categoria}</TableCell>
                  <TableCell className="text-right">{formatoNumeroCO(c.unidades)}</TableCell>
                  <TableCell className="text-right">{formatoCOP(c.ventas)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatoCOP(c.utilidad)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Bloque>
        <Bloque titulo="Por método de pago">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porMetodo.map((m) => (
                <TableRow key={m.metodo}>
                  <TableCell>{METODO_PAGO[m.metodo]}</TableCell>
                  <TableCell className="text-right font-semibold">{formatoCOP(m.monto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="px-5 pb-4 text-xs text-muted-foreground">Solo pagos aprobados. Los pedidos contra entrega cuentan cuando se marcan como entregados.</p>
        </Bloque>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Bloque titulo="Por producto" exportar={exp("productos")}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Unid.</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Utilidad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {r.porProducto.slice(0, 30).map((p) => (
                <TableRow key={p.varianteId}>
                  <TableCell className="max-w-64 truncate">{p.nombre}</TableCell>
                  <TableCell className="text-right">{p.unidades}</TableCell>
                  <TableCell className="text-right">{formatoCOP(p.ventas)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatoCOP(p.utilidad)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {r.porProducto.length > 30 && <p className="px-5 pb-4 text-xs text-muted-foreground">Mostrando 30 de {r.porProducto.length}. Exporta para ver todos.</p>}
        </Bloque>
        <Bloque titulo={`Sin movimiento (${r.sinMovimiento.length})`} exportar={exp("sin-movimiento")}>
          <p className="px-5 text-xs text-muted-foreground">Con stock, pero sin ventas en el periodo. Buenas candidatas para una oferta 💡</p>
          <ul tabIndex={0} aria-label="Productos sin movimiento" className="max-h-96 divide-y divide-border overflow-y-auto px-5 pb-4 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            {r.sinMovimiento.map((v) => (
              <li key={v.id} className="flex justify-between gap-2 py-2">
                <span className="truncate">{nombreCompleto(v.producto.nombre, v.nombre)}</span>
                <span className="shrink-0 text-muted-foreground">{v.stock} u. · {formatoCOP(v.stock * v.costo)}</span>
              </li>
            ))}
          </ul>
        </Bloque>
      </div>
    </>
  );
}
