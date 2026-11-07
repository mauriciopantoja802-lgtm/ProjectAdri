"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, LoaderCircle, MessageCircle, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCarrito } from "@/store/carrito";
import { usePedirWhatsapp } from "@/hooks/use-pedir-whatsapp";
import { Precio } from "@/components/tienda/precio";
import { cn } from "@/lib/utils";

export interface VariantePublica {
  id: string;
  nombre: string;
  colorHex: string | null;
  precio: number;
  precioOferta: number | null;
  stock: number;
  stockMinimo: number;
}

export function CompraProducto({
  producto,
  variantes,
}: {
  producto: { nombre: string; slug: string; imagen?: string };
  variantes: VariantePublica[];
}) {
  const router = useRouter();
  const agregar = useCarrito((e) => e.agregar);
  const { pedir, pendiente } = usePedirWhatsapp();
  const inicial = variantes.find((v) => v.stock > 0) ?? variantes[0];
  const [seleccion, setSeleccion] = useState(inicial.id);
  const [cantidad, setCantidad] = useState(1);
  const v = variantes.find((x) => x.id === seleccion) ?? inicial;
  const agotado = v.stock <= 0;
  const ultimas = !agotado && v.stock <= Math.max(3, v.stockMinimo);
  const conTonos = variantes.length > 1 || v.nombre !== "Única";

  const item = {
    varianteId: v.id,
    productoSlug: producto.slug,
    nombre: producto.nombre,
    variante: v.nombre,
    imagen: producto.imagen,
    precio: v.precioOferta ?? v.precio,
    stock: v.stock,
  };

  const alAgregar = (ir?: string) => {
    agregar(item, cantidad);
    if (ir) return router.push(ir);
    toast.success(`${producto.nombre}${conTonos ? ` (${v.nombre})` : ""} agregado al carrito`, {
      action: { label: "Ver carrito", onClick: () => router.push("/carrito") },
    });
  };

  return (
    <div className="space-y-5">
      <Precio precio={v.precioOferta ?? v.precio} anterior={v.precioOferta ? v.precio : null} grande />

      {conTonos && (
        <fieldset>
          <legend className="mb-2 text-sm">
            Tono: <strong className="text-berry">{v.nombre}</strong>
          </legend>
          <div className="flex flex-wrap gap-2.5" role="radiogroup">
            {variantes.map((x) => {
              const activo = x.id === seleccion;
              const sinStock = x.stock <= 0;
              return (
                <button
                  key={x.id}
                  type="button"
                  role="radio"
                  aria-checked={activo}
                  aria-label={`${x.nombre}${sinStock ? " (agotado)" : ""}`}
                  title={x.nombre}
                  onClick={() => {
                    setSeleccion(x.id);
                    setCantidad(1);
                  }}
                  className={cn(
                    "relative flex items-center justify-center rounded-full transition-all focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                    x.colorHex ? "size-10" : "h-10 px-4 text-sm font-medium",
                    activo ? "ring-2 ring-primary ring-offset-2" : "ring-1 ring-border hover:ring-primary",
                    sinStock && "opacity-40",
                  )}
                  style={x.colorHex ? { backgroundColor: x.colorHex } : undefined}
                >
                  {!x.colorHex && x.nombre}
                  {sinStock && <span className="absolute h-0.5 w-full rotate-45 bg-zinc-600" aria-hidden />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <p className={cn("flex items-center gap-1.5 text-sm font-medium", agotado ? "text-destructive" : ultimas ? "text-amber-700" : "text-green-700")}>
        {agotado ? (
          "Agotado por ahora. Escríbenos y te avisamos cuando llegue."
        ) : ultimas ? (
          <>
            <Flame className="size-4" aria-hidden /> ¡Últimas unidades! Quedan {v.stock}
          </>
        ) : (
          `Disponible · ${v.stock} unidades`
        )}
      </p>

      {!agotado && (
        <div className="flex items-center gap-3">
          <span className="text-sm">Cantidad</span>
          <div className="flex items-center rounded-2xl border border-border bg-white">
            <Button variant="ghost" size="icon" aria-label="Restar uno" onClick={() => setCantidad((c) => Math.max(1, c - 1))} disabled={cantidad <= 1}>
              <Minus aria-hidden />
            </Button>
            <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
              {cantidad}
            </span>
            <Button variant="ghost" size="icon" aria-label="Sumar uno" onClick={() => setCantidad((c) => Math.min(v.stock, c + 1))} disabled={cantidad >= v.stock}>
              <Plus aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="glow" size="lg" disabled={agotado} onClick={() => alAgregar()}>
          <ShoppingBag aria-hidden /> Agregar al carrito
        </Button>
        <Button variant="outline" size="lg" disabled={agotado} onClick={() => alAgregar("/checkout")} className="border-primary text-primary hover:bg-primary hover:text-white">
          <Zap aria-hidden /> Comprar ahora
        </Button>
        <Button
          variant="whatsapp"
          size="lg"
          className="sm:col-span-2"
          disabled={agotado || pendiente}
          onClick={() => pedir([{ varianteId: v.id, cantidad }])}
        >
          {pendiente ? <LoaderCircle className="animate-spin" aria-hidden /> : <MessageCircle aria-hidden />} Pedir por WhatsApp
        </Button>
      </div>
    </div>
  );
}
