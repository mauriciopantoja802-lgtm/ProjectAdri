import Link from "next/link";
import type { EstadoPedido } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { InsigniaEstado } from "@/components/admin/pedidos/insignias";
import { formatoCOP, formatoFecha } from "@/lib/formato";
import { urlSeguimiento } from "@/lib/token-pedido";

export function ListaPedidosClienta({
  pedidos,
}: {
  pedidos: { id: string; codigo: string; creadoEn: Date; estado: EstadoPedido; total: number; _count: { items: number } }[];
}) {
  if (!pedidos.length) return <p className="text-sm text-muted-foreground">Todavía no tienes pedidos. ¡Tu primera compra te espera! ✨</p>;
  return (
    <ul className="divide-y divide-border">
      {pedidos.map((p) => (
        <li key={p.id}>
          <Link href={urlSeguimiento(p.codigo)} className="flex items-center justify-between gap-3 py-3 hover:text-primary">
            <span>
              <span className="block font-semibold">#{p.codigo}</span>
              <span className="text-xs text-muted-foreground">
                {formatoFecha(p.creadoEn)} · {p._count.items} producto(s)
              </span>
            </span>
            <span className="flex items-center gap-3">
              <InsigniaEstado estado={p.estado} />
              <span className="font-semibold tabular-nums">{formatoCOP(p.total)}</span>
              <ChevronRight className="size-4" aria-hidden />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
