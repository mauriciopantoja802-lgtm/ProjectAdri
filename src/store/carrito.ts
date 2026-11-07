"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Carrito de compras guardado en localStorage (sobrevive a recargas).
 * Solo guarda lo necesario para mostrarlo; el precio y el stock reales
 * se vuelven a validar en el servidor al hacer el pedido (Fase 7).
 */
export interface ItemCarrito {
  varianteId: string;
  productoSlug: string;
  nombre: string; // nombre del producto
  variante: string; // ej: "Tono 03 - Rosa Nude"
  imagen?: string;
  precio: number; // precio final unitario (con oferta si aplica)
  cantidad: number;
  stock: number; // para no dejar agregar más de lo disponible
}

interface EstadoCarrito {
  items: ItemCarrito[];
  agregar: (item: Omit<ItemCarrito, "cantidad">, cantidad?: number) => void;
  cambiarCantidad: (varianteId: string, cantidad: number) => void;
  quitar: (varianteId: string) => void;
  vaciar: () => void;
  /** Aplica precios y stock actuales del servidor; quita lo que ya no está disponible. */
  sincronizar: (validados: { varianteId: string; disponible: boolean; precio: number; stock: number }[]) => string[];
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      items: [],
      agregar: (item, cantidad = 1) =>
        set((estado) => {
          const existente = estado.items.find((i) => i.varianteId === item.varianteId);
          if (existente) {
            return {
              items: estado.items.map((i) =>
                i.varianteId === item.varianteId
                  ? { ...i, ...item, cantidad: Math.min(i.cantidad + cantidad, item.stock) }
                  : i,
              ),
            };
          }
          return { items: [...estado.items, { ...item, cantidad: Math.min(cantidad, item.stock) }] };
        }),
      cambiarCantidad: (varianteId, cantidad) =>
        set((estado) => ({
          items: estado.items
            .map((i) =>
              i.varianteId === varianteId ? { ...i, cantidad: Math.min(Math.max(cantidad, 0), i.stock) } : i,
            )
            .filter((i) => i.cantidad > 0),
        })),
      quitar: (varianteId) =>
        set((estado) => ({ items: estado.items.filter((i) => i.varianteId !== varianteId) })),
      vaciar: () => set({ items: [] }),
      sincronizar: (validados) => {
        const porId = new Map(validados.map((v) => [v.varianteId, v]));
        const cambios: string[] = [];
        const items = useCarrito
          .getState()
          .items.flatMap((i) => {
            const v = porId.get(i.varianteId);
            if (!v || !v.disponible) {
              cambios.push(`${i.nombre} ya no está disponible`);
              return [];
            }
            if (v.precio !== i.precio) cambios.push(`El precio de ${i.nombre} cambió`);
            const cantidad = Math.min(i.cantidad, v.stock);
            if (cantidad < i.cantidad) cambios.push(`Solo quedan ${v.stock} de ${i.nombre}`);
            return [{ ...i, precio: v.precio, stock: v.stock, cantidad }];
          });
        set({ items });
        return cambios;
      },
    }),
    { name: "glow-carrito", version: 1 },
  ),
);

/** Selectores derivados (no se guardan; se calculan a partir de los items). */
export const seleccionarCantidadTotal = (e: EstadoCarrito) =>
  e.items.reduce((total, i) => total + i.cantidad, 0);

export const seleccionarSubtotal = (e: EstadoCarrito) =>
  e.items.reduce((total, i) => total + i.precio * i.cantidad, 0);
