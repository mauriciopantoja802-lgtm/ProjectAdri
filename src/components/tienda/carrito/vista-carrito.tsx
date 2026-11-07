"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoaderCircle, MessageCircle, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { useCarrito, seleccionarSubtotal } from "@/store/carrito";
import { useMontado } from "@/hooks/use-montado";
import { usePedirWhatsapp } from "@/hooks/use-pedir-whatsapp";
import { validarCarrito } from "@/features/pedidos/tienda-actions";
import { formatoCOP } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";

export function VistaCarrito({ costoDomicilio, envioGratisDesde }: { costoDomicilio: number; envioGratisDesde: number | null }) {
  const montado = useMontado();
  const { items, cambiarCantidad, quitar, sincronizar, vaciar } = useCarrito();
  const subtotal = useCarrito(seleccionarSubtotal);
  const { pedir, pendiente } = usePedirWhatsapp();
  const sincronizado = useRef(false);

  // Al abrir el carrito, se actualizan precios y stock con los datos reales del servidor.
  useEffect(() => {
    if (!montado || sincronizado.current || items.length === 0) return;
    sincronizado.current = true;
    validarCarrito(items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad }))).then((r) => {
      const cambios = sincronizar(r);
      cambios.forEach((c) => toast.info(c));
    });
  }, [montado, items, sincronizar]);

  if (!montado) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]" aria-busy="true">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EstadoVacio icono={ShoppingBag} titulo="Tu carrito está vacío" descripcion="Descubre nuestros labiales, bases y más. ¡Seguro encuentras tu favorito!">
        <Link href="/productos" className={buttonVariants({ variant: "glow", size: "lg" })}>
          Ver productos
        </Link>
      </EstadoVacio>
    );
  }

  const faltaParaGratis = envioGratisDesde ? envioGratisDesde - subtotal : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ul className="divide-y divide-border rounded-3xl bg-white shadow-suave">
        {items.map((i) => (
          <li key={i.varianteId} className="flex gap-3 p-4 sm:gap-4">
            <Link href={`/productos/${i.productoSlug}`} className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-nude sm:size-24">
              <Image src={i.imagen ?? IMAGEN_PLACEHOLDER} alt="" fill sizes="96px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link href={`/productos/${i.productoSlug}`} className="font-medium hover:text-primary">
                {i.nombre}
              </Link>
              {i.variante !== "Única" && <p className="text-sm text-muted-foreground">Tono: {i.variante}</p>}
              <p className="text-sm">{formatoCOP(i.precio)} c/u</p>
              <div className="mt-auto flex items-center justify-between gap-2">
                <div className="flex items-center rounded-xl border border-border" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                  <Button variant="ghost" size="icon-sm" aria-label="Restar uno" onClick={() => cambiarCantidad(i.varianteId, i.cantidad - 1)}>
                    <Minus aria-hidden />
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{i.cantidad}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Sumar uno"
                    disabled={i.cantidad >= i.stock}
                    onClick={() => cambiarCantidad(i.varianteId, i.cantidad + 1)}
                  >
                    <Plus aria-hidden />
                  </Button>
                </div>
                <p className="font-semibold tabular-nums">{formatoCOP(i.precio * i.cantidad)}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label={`Quitar ${i.nombre}`} onClick={() => quitar(i.varianteId)}>
              <Trash2 className="text-muted-foreground" aria-hidden />
            </Button>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-3xl bg-white p-5 shadow-suave lg:sticky lg:top-32">
        <h2 className="text-xl font-semibold text-berry">Resumen</h2>
        {faltaParaGratis !== null && (
          <div className="space-y-1.5 rounded-2xl bg-nude p-3 text-sm">
            <p className="flex items-center gap-2">
              <Truck className="size-4 text-primary" aria-hidden />
              {faltaParaGratis > 0 ? (
                <span>
                  Te faltan <strong>{formatoCOP(faltaParaGratis)}</strong> para el envío gratis
                </span>
              ) : (
                <strong>¡Tienes envío gratis! 🎉</strong>
              )}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((subtotal / (envioGratisDesde ?? 1)) * 100))}>
              <div className="bg-glow h-full rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / (envioGratisDesde ?? 1)) * 100)}%` }} />
            </div>
          </div>
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatoCOP(subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Envío</dt>
            <dd className="text-right text-muted-foreground">
              {faltaParaGratis !== null && faltaParaGratis <= 0 ? "Gratis" : `Domicilio Popayán ${formatoCOP(costoDomicilio)} · Recoger gratis`}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Descuento</dt>
            <dd className="text-muted-foreground">Aplica tu cupón al pagar</dd>
          </div>
        </dl>
        <Link href="/checkout" className={buttonVariants({ variant: "glow", size: "lg", className: "w-full" })}>
          Continuar al pago
        </Link>
        <Button
          variant="whatsapp"
          size="lg"
          className="w-full"
          disabled={pendiente}
          onClick={() => pedir(items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })), null, vaciar)}
        >
          {pendiente ? <LoaderCircle className="animate-spin" aria-hidden /> : <MessageCircle aria-hidden />} Pedir por WhatsApp
        </Button>
        <Link href="/productos" className="block text-center text-sm font-medium text-primary hover:underline">
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
