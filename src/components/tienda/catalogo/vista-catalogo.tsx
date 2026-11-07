import { PackageSearch } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { GrillaProductos } from "@/components/tienda/tarjeta-producto";
import { buscarCatalogo, opcionesFiltros, ORDENES, type Orden } from "@/features/catalogo/queries";
import { BarraCatalogo, FiltrosLaterales, type ParametrosCatalogo } from "./filtros-catalogo";

const numero = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

/** Catálogo completo con filtros. Lo usan /productos y /categoria/[slug]. */
export async function VistaCatalogo({
  titulo,
  descripcion,
  base,
  parametros,
  categoriaFija,
}: {
  titulo: string;
  descripcion?: string;
  base: string;
  parametros: ParametrosCatalogo & { pagina?: string };
  categoriaFija?: string;
}) {
  const orden = (parametros.orden && parametros.orden in ORDENES ? parametros.orden : "relevancia") as Orden;
  const actuales: ParametrosCatalogo = { ...parametros, ...(categoriaFija && { categoria: undefined }) };
  delete (actuales as { pagina?: string }).pagina;

  const [resultado, opciones] = await Promise.all([
    buscarCatalogo({
      q: parametros.q,
      categoria: categoriaFija ?? parametros.categoria,
      marca: parametros.marca,
      tono: parametros.tono,
      min: numero(parametros.min),
      max: numero(parametros.max),
      oferta: parametros.oferta === "1",
      orden,
      pagina: numero(parametros.pagina),
    }),
    opcionesFiltros(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-berry sm:text-4xl">{titulo}</h1>
        {descripcion && <p className="mt-1 text-muted-foreground">{descripcion}</p>}
      </header>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <FiltrosLaterales base={base} actuales={actuales} opciones={opciones} categoriaFija={Boolean(categoriaFija)} />
        <div className="space-y-4">
          <BarraCatalogo base={base} actuales={actuales} opciones={opciones} ordenes={ORDENES} categoriaFija={Boolean(categoriaFija)} />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {resultado.total} producto(s){parametros.q && ` para “${parametros.q}”`}
          </p>
          {resultado.productos.length === 0 ? (
            <EstadoVacio icono={PackageSearch} titulo="No encontramos productos" descripcion="Prueba con otra búsqueda o quita algunos filtros.">
              <Link href={base} className={buttonVariants({ variant: "glow" })}>
                Ver todo
              </Link>
            </EstadoVacio>
          ) : (
            <GrillaProductos productos={resultado.productos} />
          )}
          <Paginacion pagina={resultado.pagina} paginas={resultado.paginas} ruta={base} parametros={actuales} />
        </div>
      </div>
    </div>
  );
}
