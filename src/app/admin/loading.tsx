import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto que se muestra mientras carga cualquier página del panel. */
export default function CargandoAdmin() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 rounded-xl" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  );
}
