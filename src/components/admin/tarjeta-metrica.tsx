import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function TarjetaMetrica({
  titulo,
  valor,
  detalle,
  icono: Icono,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalle?: string;
  icono: LucideIcon;
  alerta?: boolean;
}) {
  return (
    <div className={cn("rounded-3xl bg-white p-5 shadow-suave", alerta && "ring-2 ring-destructive/30")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{titulo}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-xl", alerta ? "bg-red-100 text-destructive" : "bg-nude text-primary")}>
          <Icono className="size-4.5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-berry tabular-nums">{valor}</p>
      {detalle && <p className="mt-0.5 text-xs text-muted-foreground">{detalle}</p>}
    </div>
  );
}
