import type { CanalVenta, EstadoPago, EstadoPedido } from "@prisma/client";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CANAL_VENTA, ESTADO_PAGO, ESTADO_PEDIDO } from "@/lib/etiquetas";

export function InsigniaEstado({ estado }: { estado: EstadoPedido }) {
  return <Badge className={ESTADO_PEDIDO[estado].clase}>{ESTADO_PEDIDO[estado].etiqueta}</Badge>;
}

export function InsigniaPago({ estado }: { estado: EstadoPago }) {
  return <Badge className={ESTADO_PAGO[estado].clase}>{ESTADO_PAGO[estado].etiqueta}</Badge>;
}

export function InsigniaCanal({ canal }: { canal: CanalVenta }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ backgroundColor: CANAL_VENTA[canal].color }} aria-hidden />
      {CANAL_VENTA[canal].etiqueta}
    </span>
  );
}

export function InsigniaPorVencer() {
  return (
    <Badge className="animate-pulse bg-red-100 text-red-800 motion-reduce:animate-none">
      <Clock aria-hidden /> Por vencer
    </Badge>
  );
}
