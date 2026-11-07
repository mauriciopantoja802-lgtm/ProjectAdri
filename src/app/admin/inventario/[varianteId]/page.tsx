import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { DialogoAjuste } from "@/components/admin/inventario/dialogo-ajuste";
import { TablaMovimientos } from "@/components/admin/inventario/tabla-movimientos";
import { obtenerKardex } from "@/features/inventario/queries";
import { nombreCompleto } from "@/lib/nombres";
import { formatoCOP } from "@/lib/formato";

export const metadata: Metadata = { title: "Kardex" };

export default async function Kardex({ params }: { params: Promise<{ varianteId: string }> }) {
  const { varianteId } = await params;
  const v = await obtenerKardex(varianteId);
  if (!v) notFound();
  const nombre = nombreCompleto(v.producto.nombre, v.nombre);

  return (
    <>
      <Link href="/admin/inventario" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Inventario
      </Link>
      <EncabezadoPagina titulo={`Kardex: ${nombre}`} descripcion={`SKU ${v.sku} · Costo ${formatoCOP(v.costo)} · Mínimo ${v.stockMinimo}`}>
        <span className="rounded-2xl bg-white px-4 py-2 text-sm shadow-suave">
          Stock actual: <strong className="text-lg text-berry">{v.stock}</strong>
        </span>
        <DialogoAjuste varianteId={v.id} nombre={nombre} stock={v.stock} />
        <Link href={`/admin/productos/${v.producto.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Ver producto
        </Link>
      </EncabezadoPagina>
      {v.movimientos.length === 0 ? (
        <EstadoVacio icono={History} titulo="Sin movimientos" descripcion="Esta variante todavía no tiene movimientos de inventario." />
      ) : (
        <TablaMovimientos filas={v.movimientos} />
      )}
    </>
  );
}
