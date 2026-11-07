"use client";

import { useId, type ComponentProps } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Clase compartida para <select> nativos con el mismo aspecto que Input. */
export const claseSelect =
  "h-11 w-full rounded-xl border border-input bg-white px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm disabled:opacity-50";

function Mensajes({ id, ayuda, error }: { id: string; ayuda?: string; error?: string }) {
  return (
    <>
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </>
  );
}

const describir = (id: string, ayuda?: string, error?: string) =>
  [ayuda && !error ? `${id}-ayuda` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

/**
 * Select nativo: en el celular abre el selector del sistema, que es más cómodo
 * y accesible que un menú personalizado.
 */
export function CampoSelect({
  etiqueta,
  registro,
  error,
  ayuda,
  opciones,
  vacio,
  className,
  ...props
}: Omit<ComponentProps<"select">, "id"> & {
  etiqueta: string;
  registro?: UseFormRegisterReturn;
  error?: string;
  ayuda?: string;
  opciones: { valor: string; etiqueta: string }[];
  vacio?: string; // texto de la opción vacía, ej: "Sin marca"
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describir(id, ayuda, error)}
        className={cn(claseSelect, className)}
        {...props}
        {...registro}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
      <Mensajes id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

export function CampoArea({
  etiqueta,
  registro,
  error,
  ayuda,
  ...props
}: Omit<ComponentProps<"textarea">, "id"> & {
  etiqueta: string;
  registro?: UseFormRegisterReturn;
  error?: string;
  ayuda?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describir(id, ayuda, error)}
        className="min-h-24 rounded-xl bg-white"
        {...props}
        {...registro}
      />
      <Mensajes id={id} ayuda={ayuda} error={error} />
    </div>
  );
}

/** Interruptor con etiqueta y descripción, controlado (usar con Controller de React Hook Form). */
export function CampoInterruptor({
  etiqueta,
  descripcion,
  valor,
  alCambiar,
}: {
  etiqueta: string;
  descripcion?: string;
  valor: boolean;
  alCambiar: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-white p-3">
      <div>
        <Label htmlFor={id} className="cursor-pointer">
          {etiqueta}
        </Label>
        {descripcion && <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>}
      </div>
      <Switch id={id} checked={valor} onCheckedChange={(v) => alCambiar(v)} />
    </div>
  );
}
