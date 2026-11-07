import Link from "next/link";
import type { TipoMovimiento } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TIPO_MOVIMIENTO } from "@/lib/etiquetas";
import { formatoFechaHoraCO } from "@/lib/formato";
import { cn } from "@/lib/utils";

export interface FilaMovimiento {
  id: string;
  creadoEn: Date;
  tipo: TipoMovimiento;
  cantidad: number;
  stockFinal: number;
  motivo: string | null;
  usuario: { nombre: string } | null;
  pedido: { id: string; codigo: string } | null;
  compra?: { id: string } | null;
  producto?: { id: string; nombre: string } | null; // para la vista general (varias variantes)
}

/** Tabla de movimientos reutilizada en el kardex de una variante y en el historial general. */
export function TablaMovimientos({ filas }: { filas: FilaMovimiento[] }) {
  const conProducto = filas.some((f) => f.producto);
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            {conProducto && <TableHead>Producto</TableHead>}
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Stock final</TableHead>
            <TableHead className="hidden md:table-cell">Motivo</TableHead>
            <TableHead className="hidden lg:table-cell">Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-xs whitespace-nowrap">{formatoFechaHoraCO(m.creadoEn)}</TableCell>
              {conProducto && (
                <TableCell className="text-sm">
                  {m.producto && (
                    <Link href={`/admin/inventario/${m.producto.id}`} className="hover:text-primary">
                      {m.producto.nombre}
                    </Link>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge className={TIPO_MOVIMIENTO[m.tipo].clase}>{TIPO_MOVIMIENTO[m.tipo].etiqueta}</Badge>
              </TableCell>
              <TableCell className={cn("text-right font-semibold tabular-nums", m.cantidad < 0 ? "text-destructive" : "text-green-700")}>
                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">{m.stockFinal}</TableCell>
              <TableCell className="hidden text-sm md:table-cell">
                {m.pedido ? (
                  <Link href={`/admin/pedidos/${m.pedido.id}`} className="font-medium text-primary hover:underline">
                    {m.motivo}
                  </Link>
                ) : m.compra ? (
                  <Link href={`/admin/proveedores/compras/${m.compra.id}`} className="font-medium text-primary hover:underline">
                    {m.motivo}
                  </Link>
                ) : (
                  m.motivo
                )}
              </TableCell>
              <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{m.usuario?.nombre ?? "Sistema"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
