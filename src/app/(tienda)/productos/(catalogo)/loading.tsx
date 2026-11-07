import { Skeleton } from "@/components/ui/skeleton";

export default function CargandoCatalogo() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Cargando productos">
      <Skeleton className="mb-6 h-10 w-64 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Skeleton className="hidden h-96 rounded-3xl lg:block" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-3xl" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
