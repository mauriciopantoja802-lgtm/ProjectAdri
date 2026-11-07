"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { claseSelect } from "@/components/compartidos/campos";
import { FAMILIAS_TONO, type FamiliaTono } from "@/lib/tonos";
import { cn } from "@/lib/utils";

export type ParametrosCatalogo = Partial<Record<"q" | "categoria" | "marca" | "tono" | "min" | "max" | "oferta" | "orden", string>>;

interface Opciones {
  categorias: { slug: string; nombre: string; cantidad: number }[];
  marcas: { slug: string; nombre: string }[];
  familias: FamiliaTono[];
}

function useNavegarFiltros(base: string, actuales: ParametrosCatalogo) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const ir = (cambios: ParametrosCatalogo) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...actuales, ...cambios })) if (v) sp.set(k, v);
    const qs = sp.toString(); // al cambiar un filtro se vuelve a la página 1
    iniciar(() => router.push(qs ? `${base}?${qs}` : base, { scroll: false }));
  };
  return { ir, pendiente };
}

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-secondary/40",
        activa && "bg-secondary/60 font-semibold text-berry",
      )}
    >
      {children}
      {activa && <Check className="size-4 text-primary" aria-hidden />}
    </button>
  );
}

function PanelFiltros({ base, actuales, opciones, categoriaFija }: { base: string; actuales: ParametrosCatalogo; opciones: Opciones; categoriaFija?: boolean }) {
  const { ir, pendiente } = useNavegarFiltros(base, actuales);
  const [min, setMin] = useState(actuales.min ?? "");
  const [max, setMax] = useState(actuales.max ?? "");
  const hayFiltros = Boolean(actuales.marca || actuales.tono || actuales.min || actuales.max || actuales.oferta || (!categoriaFija && actuales.categoria));

  return (
    <div className="space-y-6" aria-busy={pendiente}>
      {!categoriaFija && (
        <fieldset>
          <legend className="mb-2 font-heading text-lg font-semibold text-berry">Categoría</legend>
          <Opcion activa={!actuales.categoria} onClick={() => ir({ categoria: undefined })}>
            Todas
          </Opcion>
          {opciones.categorias.map((c) => (
            <Opcion key={c.slug} activa={actuales.categoria === c.slug} onClick={() => ir({ categoria: actuales.categoria === c.slug ? undefined : c.slug })}>
              <span>
                {c.nombre} <span className="text-xs text-muted-foreground">({c.cantidad})</span>
              </span>
            </Opcion>
          ))}
        </fieldset>
      )}

      {opciones.marcas.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-heading text-lg font-semibold text-berry">Marca</legend>
          {opciones.marcas.map((m) => (
            <Opcion key={m.slug} activa={actuales.marca === m.slug} onClick={() => ir({ marca: actuales.marca === m.slug ? undefined : m.slug })}>
              {m.nombre}
            </Opcion>
          ))}
        </fieldset>
      )}

      {opciones.familias.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-heading text-lg font-semibold text-berry">Tono</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FAMILIAS_TONO) as FamiliaTono[])
              .filter((f) => opciones.familias.includes(f))
              .map((f) => {
                const activa = actuales.tono === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => ir({ tono: activa ? undefined : f })}
                    aria-pressed={activa}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                      activa ? "border-primary bg-primary/10 font-semibold text-berry" : "border-border bg-white hover:border-primary",
                    )}
                  >
                    <span className="size-4 rounded-full ring-1 ring-border" style={{ backgroundColor: FAMILIAS_TONO[f].muestra }} />
                    {FAMILIAS_TONO[f].etiqueta}
                  </button>
                );
              })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 font-heading text-lg font-semibold text-berry">Precio</legend>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ir({ min: min.replace(/\D/g, "") || undefined, max: max.replace(/\D/g, "") || undefined });
          }}
        >
          <Input value={min} onChange={(e) => setMin(e.target.value)} inputMode="numeric" placeholder="Mín." aria-label="Precio mínimo" className="h-9" />
          <span aria-hidden>–</span>
          <Input value={max} onChange={(e) => setMax(e.target.value)} inputMode="numeric" placeholder="Máx." aria-label="Precio máximo" className="h-9" />
          <Button type="submit" size="icon-sm" variant="secondary" aria-label="Aplicar precio">
            <Check aria-hidden />
          </Button>
        </form>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-nude p-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={actuales.oferta === "1"}
          onChange={(e) => ir({ oferta: e.target.checked ? "1" : undefined })}
          className="size-4 accent-[var(--glow-fucsia)]"
        />
        Solo productos en oferta 💖
      </label>

      {hayFiltros && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => ir({ marca: undefined, tono: undefined, min: undefined, max: undefined, oferta: undefined, ...(categoriaFija ? {} : { categoria: undefined }) })}
        >
          <X aria-hidden /> Limpiar filtros
        </Button>
      )}
      {pendiente && <LoaderCircle className="mx-auto size-5 animate-spin text-primary" aria-label="Cargando" />}
    </div>
  );
}

/** Barra superior: buscador, orden y (en celular) el botón que abre los filtros. */
export function BarraCatalogo({
  base,
  actuales,
  opciones,
  ordenes,
  categoriaFija,
}: {
  base: string;
  actuales: ParametrosCatalogo;
  opciones: Opciones;
  ordenes: Record<string, string>;
  categoriaFija?: boolean;
}) {
  const { ir } = useNavegarFiltros(base, actuales);
  const [q, setQ] = useState(actuales.q ?? "");
  const activos = [actuales.marca, actuales.tono, actuales.min || actuales.max, actuales.oferta, !categoriaFija && actuales.categoria].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <form
        role="search"
        className="relative flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          ir({ q: q.trim() || undefined });
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar labial, base, rubor…" aria-label="Buscar productos" className="pl-10" />
      </form>
      <div className="flex gap-2">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" className="h-11 flex-1 lg:hidden" />}>
            <SlidersHorizontal aria-hidden /> Filtros {activos > 0 && `(${activos})`}
          </SheetTrigger>
          <SheetContent side="left" className="w-80 overflow-y-auto bg-white">
            <SheetHeader>
              <SheetTitle className="font-heading text-xl">Filtros</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-8">
              <PanelFiltros base={base} actuales={actuales} opciones={opciones} categoriaFija={categoriaFija} />
            </div>
          </SheetContent>
        </Sheet>
        <select
          aria-label="Ordenar por"
          value={actuales.orden ?? "relevancia"}
          onChange={(e) => ir({ orden: e.target.value === "relevancia" ? undefined : e.target.value })}
          className={cn(claseSelect, "flex-1 sm:w-56")}
        >
          {Object.entries(ordenes).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function FiltrosLaterales(props: { base: string; actuales: ParametrosCatalogo; opciones: Opciones; categoriaFija?: boolean }) {
  return (
    <aside className="hidden lg:block" aria-label="Filtros">
      <div className="sticky top-32 rounded-3xl bg-white p-5 shadow-suave">
        <PanelFiltros {...props} />
      </div>
    </aside>
  );
}
