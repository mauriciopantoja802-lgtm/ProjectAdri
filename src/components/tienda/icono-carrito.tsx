"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCarrito, seleccionarCantidadTotal } from "@/store/carrito";
import { useMontado } from "@/hooks/use-montado";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IconoCarrito() {
  const montado = useMontado();
  const cantidad = useCarrito(seleccionarCantidadTotal);
  const visible = montado && cantidad > 0;

  return (
    <Link
      href="/carrito"
      aria-label={visible ? `Carrito, ${cantidad} productos` : "Carrito"}
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative hover:bg-muted")}
    >
      <ShoppingBag className="size-5" aria-hidden />
      {visible && (
        <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-bold text-white">
          {cantidad > 99 ? "99+" : cantidad}
        </span>
      )}
    </Link>
  );
}
