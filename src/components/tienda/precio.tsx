import { formatoCOP } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function Precio({ precio, anterior, grande, className }: { precio: number; anterior?: number | null; grande?: boolean; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2", className)}>
      <span className={cn("font-bold text-berry tabular-nums", grande ? "text-3xl" : "text-base")}>{formatoCOP(precio)}</span>
      {anterior ? (
        <span className={cn("text-muted-foreground line-through tabular-nums", grande ? "text-lg" : "text-xs")}>
          <span className="sr-only">Antes: </span>
          {formatoCOP(anterior)}
        </span>
      ) : null}
    </p>
  );
}
