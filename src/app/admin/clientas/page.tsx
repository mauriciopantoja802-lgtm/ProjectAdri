import type { Metadata } from "next";
import Link from "next/link";
import { Download, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { claseSelect } from "@/components/compartidos/campos";
import { listarClientasAdmin } from "@/features/clientas/queries";
import { formatoCOP, formatoFecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Clientas" };

export default async function Clientas({ searchParams }: { searchParams: Promise<{ q?: string; orden?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const orden = sp.orden === "recientes" || sp.orden === "nombre" ? sp.orden : "gastado";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const { clientas, total, paginas } = await listarClientasAdmin({ q: sp.q?.trim(), orden, pagina });

  return (
    <>
      <EncabezadoPagina titulo="Clientas" descripcion={`${total} clienta(s) registradas en todos los canales`}>
        <a href="/api/reportes/export?tipo=clientas&formato=xlsx" className={buttonVariants({ variant: "outline" })}>
          <Download aria-hidden /> Exportar
        </a>
      </EncabezadoPagina>
      <form className="mb-4 flex flex-col gap-2 rounded-3xl bg-white p-3 shadow-suave sm:flex-row">
        <Input name="q" defaultValue={sp.q} placeholder="Nombre, celular o correo" aria-label="Buscar clienta" />
        <select name="orden" defaultValue={orden} aria-label="Ordenar" className={`${claseSelect} sm:w-56`}>
          <option value="gastado">Mayor total gastado</option>
          <option value="recientes">Compra más reciente</option>
          <option value="nombre">Nombre A–Z</option>
        </select>
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Buscar
        </Button>
      </form>
      {clientas.length === 0 ? (
        <EstadoVacio icono={Users} titulo="Sin clientas" descripcion="Las clientas se crean solas al vender con su celular (POS, web o WhatsApp)." />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clienta</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead className="text-center">Compras</TableHead>
                <TableHead className="text-right">Total gastado</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/clientas/${c.id}`} className="font-medium text-berry hover:text-primary">
                      {c.nombre}
                    </Link>
                    {c.conCuenta && <Badge variant="secondary" className="ml-2">Con cuenta</Badge>}
                  </TableCell>
                  <TableCell className="tabular-nums">{c.telefono.replace(/^57/, "")}</TableCell>
                  <TableCell className="text-center">{c.compras}</TableCell>
                  <TableCell className="text-right font-semibold">{formatoCOP(c.totalGastado)}</TableCell>
                  <TableCell className="hidden text-right text-sm sm:table-cell">{c.ultimaCompra ? formatoFecha(c.ultimaCompra) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/clientas" parametros={sp} />
    </>
  );
}
