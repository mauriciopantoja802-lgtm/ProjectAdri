import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductoTarjeta } from "@/features/catalogo/queries";
import { TarjetaProducto } from "./tarjeta-producto";

/** Sección del inicio con productos en fila deslizable (en celular) o grilla (en escritorio). */
export function FilaProductos({
  titulo,
  subtitulo,
  enlace,
  productos,
}: {
  titulo: string;
  subtitulo?: string;
  enlace: string;
  productos: ProductoTarjeta[];
}) {
  if (!productos.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-berry sm:text-3xl">{titulo}</h2>
          {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
        </div>
        <Link href={enlace} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Ver todos <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {productos.slice(0, 8).map((p) => (
          <li key={p.id} className="w-[46%] shrink-0 snap-start sm:w-auto">
            <TarjetaProducto producto={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
