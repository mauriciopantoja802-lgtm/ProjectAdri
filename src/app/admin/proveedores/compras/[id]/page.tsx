import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { obtenerCompra } from "@/features/inventario/queries";
import { formatoCOP, formatoFechaTexto } from "@/lib/formato";
import { nombreCompleto } from "@/lib/nombres";

export const metadata: Metadata = { title: "Detalle de compra" };

export default async function DetalleCompra({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const compra = await obtenerCompra(id);
  if (!compra) notFound();

  return (
    <>
      <Link href="/admin/proveedores" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Proveedores y compras
      </Link>
      <EncabezadoPagina
        titulo={`Compra a ${compra.proveedor.nombre}`}
        descripcion={`${formatoFechaTexto(compra.fecha)}${compra.notas ? ` · ${compra.notas}` : ""}`}
      />
      <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-center">Cantidad</TableHead>
              <TableHead className="text-right">Costo unitario</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {compra.items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  <Link href={`/admin/inventario/${it.variante.id}`} className="hover:text-primary">
                    {nombreCompleto(it.variante.producto.nombre, it.variante.nombre)}
                  </Link>
                  <p className="font-mono text-xs text-muted-foreground">{it.variante.sku}</p>
                </TableCell>
                <TableCell className="text-center">{it.cantidad}</TableCell>
                <TableCell className="text-right">{formatoCOP(it.costoUnit)}</TableCell>
                <TableCell className="text-right font-semibold">{formatoCOP(it.cantidad * it.costoUnit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right text-lg font-bold">{formatoCOP(compra.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </>
  );
}
