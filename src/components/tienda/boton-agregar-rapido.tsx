"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCarrito } from "@/store/carrito";
import { cn } from "@/lib/utils";

/** Agrega al carrito con un toque, para productos de una sola variante. */
export function BotonAgregarRapido({
  item,
  className,
}: {
  item: { varianteId: string; productoSlug: string; nombre: string; variante: string; imagen?: string; precio: number; stock: number };
  className?: string;
}) {
  const agregar = useCarrito((e) => e.agregar);
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        agregar(item);
        toast.success(`${item.nombre} agregado al carrito`, { action: { label: "Ver carrito", onClick: () => router.push("/carrito") } });
      }}
      aria-label={`Agregar ${item.nombre} al carrito`}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-suave transition-all hover:scale-110 hover:bg-primary hover:text-white focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <ShoppingBag className="size-4.5" aria-hidden />
    </button>
  );
}
