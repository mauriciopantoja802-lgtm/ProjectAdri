import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, ScanText, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { BotonConfirmarServidor } from "@/components/admin/boton-confirmar-servidor";
import { DialogoProveedor } from "@/components/admin/inventario/dialogo-proveedor";
import { listarCompras, listarProveedores } from "@/features/inventario/queries";
import { eliminarProveedor } from "@/features/inventario/actions";
import { formatoCOP, formatoFecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Proveedores y compras" };

export default async function Proveedores({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const sp = await searchParams;
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const [proveedores, { compras, paginas }] = await Promise.all([listarProveedores(), listarCompras({ pagina })]);

  return (
    <>
      <EncabezadoPagina titulo="Proveedores y compras" descripcion="Al registrar una compra, el stock sube automáticamente.">
        <DialogoProveedor
          disparador={
            <Button variant="outline">
              <Plus aria-hidden /> Nuevo proveedor
            </Button>
          }
        />
        <Link href="/admin/proveedores/compras/nueva" className={buttonVariants({ variant: "outline" })}>
          <ShoppingCart aria-hidden /> Registrar compra
        </Link>
        <Link href="/admin/proveedores/compras/factura" className={buttonVariants({ variant: "glow" })}>
          <ScanText aria-hidden /> Escanear factura
        </Link>
      </EncabezadoPagina>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-berry">Proveedores</h2>
          {proveedores.length === 0 && <EstadoVacio icono={Truck} titulo="Sin proveedores" descripcion="Crea tu primer proveedor." />}
          {proveedores.map((p) => (
            <article key={p.id} className="rounded-3xl bg-white p-4 shadow-suave">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{p.nombre}</h3>
                  <p className="text-xs text-muted-foreground">{[p.nit && `NIT ${p.nit}`, p.telefono, p.email].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex">
                  <DialogoProveedor
                    proveedor={{ id: p.id, nombre: p.nombre, telefono: p.telefono, email: p.email, nit: p.nit }}
                    disparador={
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${p.nombre}`}>
                        <Pencil aria-hidden />
                      </Button>
                    }
                  />
                  <BotonConfirmarServidor
                    titulo={`¿Eliminar a ${p.nombre}?`}
                    descripcion="Solo se puede eliminar si no tiene compras registradas."
                    accion={eliminarProveedor.bind(null, p.id)}
                    etiqueta={`Eliminar ${p.nombre}`}
                    icono={<Trash2 className="text-destructive" aria-hidden />}
                  />
                </div>
              </div>
              <p className="mt-2 text-sm">
                {p._count.compras} compra(s) · <strong>{formatoCOP(p.compras.reduce((t, c) => t + c.total, 0))}</strong>
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-berry">Compras recientes</h2>
          {compras.length === 0 ? (
            <EstadoVacio icono={ShoppingCart} titulo="Sin compras" descripcion="Registra la mercancía que te llega para que el stock suba solo." />
          ) : (
            <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-center">Ítems</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/admin/proveedores/compras/${c.id}`} className="font-medium text-primary hover:underline">
                          {formatoFecha(c.fecha)}
                        </Link>
                      </TableCell>
                      <TableCell>{c.proveedor.nombre}</TableCell>
                      <TableCell className="text-center">{c._count.items}</TableCell>
                      <TableCell className="text-right font-semibold">{formatoCOP(c.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/proveedores" parametros={sp} />
        </section>
      </div>
    </>
  );
}
