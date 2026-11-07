import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Paginación con enlaces normales (funciona sin JavaScript y Google puede seguirla).
 * Conserva los demás filtros de la URL.
 */
export function Paginacion({
  pagina,
  paginas,
  ruta,
  parametros,
}: {
  pagina: number;
  paginas: number;
  ruta: string;
  parametros: Record<string, string | undefined>;
}) {
  if (paginas <= 1) return null;

  const enlace = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(parametros)) if (v && k !== "pagina") sp.set(k, v);
    if (p > 1) sp.set("pagina", String(p));
    const qs = sp.toString();
    return qs ? `${ruta}?${qs}` : ruta;
  };

  const desde = Math.max(1, Math.min(pagina - 2, paginas - 4));
  const numeros = Array.from({ length: Math.min(5, paginas) }, (_, i) => desde + i);
  const base = buttonVariants({ variant: "outline", size: "icon" });

  return (
    <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-1.5">
      <Link
        href={enlace(pagina - 1)}
        aria-label="Página anterior"
        aria-disabled={pagina <= 1}
        className={cn(base, pagina <= 1 && "pointer-events-none opacity-40")}
      >
        <ChevronLeft aria-hidden />
      </Link>
      {numeros.map((n) => (
        <Link
          key={n}
          href={enlace(n)}
          aria-current={n === pagina ? "page" : undefined}
          className={cn(base, n === pagina && "border-primary bg-primary text-white hover:bg-primary hover:text-white")}
        >
          {n}
        </Link>
      ))}
      <Link
        href={enlace(pagina + 1)}
        aria-label="Página siguiente"
        aria-disabled={pagina >= paginas}
        className={cn(base, pagina >= paginas && "pointer-events-none opacity-40")}
      >
        <ChevronRight aria-hidden />
      </Link>
    </nav>
  );
}
