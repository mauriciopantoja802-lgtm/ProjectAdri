"use client";

import { useId } from "react";
import { Ban } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Selector de color del tono (círculo que verá la clienta). `null` = sin color (ej: kits, accesorios). */
export function CampoColor({
  valor,
  alCambiar,
  error,
}: {
  valor: string | null;
  alCambiar: (v: string | null) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>Color del tono</Label>
      <div className="flex items-center gap-2">
        <label
          className={cn(
            "relative flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-suave ring-1 ring-border",
            !valor && "bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#f6d3e4_4px,#f6d3e4_8px)]",
          )}
          style={valor ? { backgroundColor: valor } : undefined}
        >
          <input
            id={id}
            type="color"
            value={valor ?? "#e91e8c"}
            onChange={(e) => alCambiar(e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-describedby={error ? `${id}-e` : undefined}
          />
        </label>
        <span className="min-w-20 font-mono text-sm text-muted-foreground">{valor ?? "Sin color"}</span>
        {valor && (
          <button
            type="button"
            onClick={() => alCambiar(null)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-berry"
          >
            <Ban className="size-3.5" aria-hidden /> Quitar
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-e`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
