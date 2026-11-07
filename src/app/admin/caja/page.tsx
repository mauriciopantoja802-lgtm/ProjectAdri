import type { Metadata } from "next";
import { Banknote, CalendarDays, Receipt, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { TarjetaMetrica } from "@/components/admin/tarjeta-metrica";
import { FormularioCierre } from "@/components/admin/pos/formulario-cierre";
import { cierresDelDia, listarCierres, resumenCaja } from "@/features/pos/caja";
import { METODO_PAGO } from "@/lib/etiquetas";
import { claveDiaBogota, formatoCOP, formatoFecha, formatoFechaTexto } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { MetodoPago } from "@prisma/client";

export const metadata: Metadata = { title: "Cierre de caja" };

export default async function Caja({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const sp = await searchParams;
  const hoy = claveDiaBogota(new Date());
  const dia = sp.dia && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia <= hoy ? sp.dia : hoy;
  const [resumen, cierres, cierresHoy] = await Promise.all([resumenCaja(dia), listarCierres(), cierresDelDia(dia)]);
  const metodos = Object.entries(resumen.porMetodo) as [MetodoPago, number][];

  return (
    <>
      <EncabezadoPagina titulo="Cierre de caja" descripcion={formatoFechaTexto(`${dia}T12:00:00-05:00`)}>
        <form className="flex gap-2">
          <Input type="date" name="dia" defaultValue={dia} max={hoy} aria-label="Día" className="w-44" />
          <Button type="submit" variant="outline">
            <CalendarDays aria-hidden /> Ver día
          </Button>
        </form>
      </EncabezadoPagina>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <TarjetaMetrica titulo="Ventas del día" valor={String(resumen.ventas)} detalle="pedidos no cancelados" icono={Receipt} />
        <TarjetaMetrica titulo="Total recibido" valor={formatoCOP(resumen.total)} detalle={`${resumen.pagos} pago(s)`} icono={Banknote} />
        <TarjetaMetrica titulo="En efectivo" valor={formatoCOP(resumen.efectivo)} icono={Banknote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl bg-white p-5 shadow-suave">
            <h2 className="mb-3 text-lg font-semibold text-berry">Ventas por método de pago</h2>
            {metodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay pagos registrados este día.</p>
            ) : (
              <ul className="divide-y divide-border">
                {metodos.map(([m, monto]) => (
                  <li key={m} className="flex justify-between py-2 text-sm">
                    <span>{METODO_PAGO[m]}</span>
                    <strong className="tabular-nums">{formatoCOP(monto)}</strong>
                  </li>
                ))}
                <li className="flex justify-between py-2 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatoCOP(resumen.total)}</span>
                </li>
              </ul>
            )}
          </section>

          <section className="rounded-3xl bg-white shadow-suave">
            <h2 className="p-5 pb-2 text-lg font-semibold text-berry">Cierres anteriores</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Efectivo ventas</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aún no hay cierres.
                    </TableCell>
                  </TableRow>
                )}
                {cierres.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {formatoFecha(c.fecha)}
                      <p className="text-xs text-muted-foreground">{c.usuario.nombre}</p>
                    </TableCell>
                    <TableCell className="text-right">{formatoCOP(c.baseInicial)}</TableCell>
                    <TableCell className="text-right">{formatoCOP(c.totalEfectivo)}</TableCell>
                    <TableCell className="text-right">{formatoCOP(c.efectivoContado)}</TableCell>
                    <TableCell className={cn("text-right font-semibold", c.diferencia < 0 ? "text-destructive" : c.diferencia > 0 ? "text-sky-700" : "text-green-700")}>
                      {formatoCOP(c.diferencia)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </div>

        <div className="space-y-3">
          {cierresHoy > 0 && (
            <p className="flex gap-2 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              Ya hay {cierresHoy} cierre(s) para este día. Puedes guardar otro si cerraste por turnos.
            </p>
          )}
          <FormularioCierre key={dia} dia={dia} efectivoVentas={resumen.efectivo} />
        </div>
      </div>
    </>
  );
}
