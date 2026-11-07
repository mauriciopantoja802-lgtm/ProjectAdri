import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EstadoVacio({
  titulo,
  descripcion,
  icono: Icono = Sparkles,
  children,
}: {
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-secondary bg-white/60 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-nude text-primary">
        <Icono className="size-7" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold text-berry">{titulo}</h2>
      {descripcion && <p className="max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {children}
    </div>
  );
}
