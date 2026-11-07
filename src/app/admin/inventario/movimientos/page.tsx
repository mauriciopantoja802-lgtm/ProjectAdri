import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TipoMovimiento } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { Paginacion } from "@/components/compartidos/paginacion";
import { TablaMovimientos } from "@/components/admin/inventario/tabla-movimientos";
import { listarMovimientos } from "@/features/inventario/queries";
import { TIPO_MOVIMIENTO } from "@/lib/etiquetas";
import { nombreCompleto } from "@/lib/nombres";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Movimientos de inventario" };

export default async function Movimientos({ searchParams }: { searchParams: Promise<{ tipo?: string; pagina?: string }> }) {
  const sp = await searchParams;
  const tipo = Object.values(TipoMovimiento).find((t) => t === sp.tipo);
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const { movimientos, total, paginas } = await listarMovimientos({ tipo, pagina });

  return (
    <>
      <Link href="/admin/inventario" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Inventario
      </Link>
      <EncabezadoPagina titulo="Movimientos de inventario" descripcion={`${total} movimiento(s)`} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/inventario/movimientos" className={cn(buttonVariants({ variant: tipo ? "outline" : "default", size: "sm" }))}>
          Todos
        </Link>
        {Object.values(TipoMovimiento).map((t) => (
          <Link
            key={t}
            href={`/admin/inventario/movimientos?tipo=${t}`}
            className={cn(buttonVariants({ variant: tipo === t ? "default" : "outline", size: "sm" }))}
          >
            {TIPO_MOVIMIENTO[t].etiqueta}
          </Link>
        ))}
      </div>
      <TablaMovimientos
        filas={movimientos.map((m) => ({
          ...m,
          producto: { id: m.variante.id, nombre: nombreCompleto(m.variante.producto.nombre, m.variante.nombre) },
        }))}
      />
      <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/inventario/movimientos" parametros={sp} />
    </>
  );
}
