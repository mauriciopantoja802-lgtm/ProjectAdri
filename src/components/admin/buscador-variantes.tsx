"use client";

import { forwardRef, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { LoaderCircle, ScanBarcode } from "lucide-react";
import { toast } from "sonner";
import { buscarVariantes, type VarianteEncontrada } from "@/features/productos/busqueda";
import { formatoCOP } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { cn } from "@/lib/utils";

/**
 * Buscador por nombre, SKU o código de barras.
 * Compatible con lectores de código de barras: el lector "escribe" el código y presiona Enter;
 * si hay una coincidencia exacta, se agrega de inmediato y el campo queda listo para el siguiente.
 */
export const BuscadorVariantes = forwardRef<
  HTMLInputElement,
  {
    alElegir: (v: VarianteEncontrada) => void;
    soloActivas?: boolean;
    mostrarCosto?: boolean;
    placeholder?: string;
    autoFocus?: boolean;
  }
>(function BuscadorVariantes({ alElegir, soloActivas, mostrarCosto, placeholder, autoFocus }, ref) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<VarianteEncontrada[]>([]);
  const [indice, setIndice] = useState(0);
  const [buscando, iniciar] = useTransition();
  const ultimaBusqueda = useRef(0);

  const buscar = (q: string) => {
    const id = ++ultimaBusqueda.current;
    return new Promise<VarianteEncontrada[]>((resolver) =>
      iniciar(async () => {
        const r = await buscarVariantes(q, { soloActivas });
        if (id === ultimaBusqueda.current) {
          setResultados(r);
          setIndice(0);
        }
        resolver(r);
      }),
    );
  };

  // Búsqueda mientras se escribe, con una pequeña espera para no consultar en cada tecla.
  useEffect(() => {
    if (texto.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(() => void buscar(texto), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const elegir = (v: VarianteEncontrada) => {
    alElegir(v);
    setTexto("");
    setResultados([]);
  };

  const alPresionarTecla = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndice((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndice((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setResultados([]);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = texto.trim();
      if (!q) return;
      // El lector escribe muy rápido: buscamos ya mismo sin esperar el retardo.
      const lista = resultados.length ? resultados : await buscar(q);
      const exacto = lista.find((v) => v.codigoBarras === q || v.sku.toLowerCase() === q.toLowerCase());
      const elegido = exacto ?? lista[indice];
      if (elegido) elegir(elegido);
      else toast.error(`No se encontró “${q}”`);
    }
  };

  const abierto = resultados.length > 0;

  return (
    <div className="relative">
      <ScanBarcode className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={ref}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={alPresionarTecla}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={abierto}
        aria-controls="resultados-variantes"
        aria-label="Buscar producto por nombre, SKU o código de barras"
        placeholder={placeholder ?? "Escanea o escribe nombre / SKU…"}
        className="h-12 w-full rounded-2xl border border-input bg-white pr-10 pl-11 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {buscando && (
        <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
      )}
      {abierto && (
        <ul
          id="resultados-variantes"
          role="listbox"
          className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-2xl border border-border bg-white p-1 shadow-lg"
        >
          {resultados.map((v, i) => (
            <li key={v.id} role="option" aria-selected={i === indice}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()} // no perder el foco del input
                onClick={() => elegir(v)}
                onMouseEnter={() => setIndice(i)}
                className={cn("flex w-full items-center gap-3 rounded-xl p-2 text-left", i === indice && "bg-secondary/50")}
              >
                <Image src={v.imagen ?? IMAGEN_PLACEHOLDER} alt="" width={40} height={40} className="size-10 rounded-lg object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{v.nombre}</span>
                  <span className="block text-xs text-muted-foreground">
                    {v.sku} · Stock: <strong className={v.stock <= 0 ? "text-destructive" : ""}>{v.stock}</strong>
                    {!v.activo && " · Inactiva"}
                  </span>
                </span>
                <span className="text-right text-sm font-semibold whitespace-nowrap">
                  {formatoCOP(mostrarCosto ? v.costo : v.precio)}
                  {mostrarCosto && <span className="block text-[0.65rem] font-normal text-muted-foreground">costo</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
