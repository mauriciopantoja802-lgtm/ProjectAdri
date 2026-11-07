"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CANALES_POS } from "@/features/pos/schemas";

export interface ItemTicket {
  varianteId: string;
  nombre: string;
  sku: string;
  imagen: string | null;
  precio: number; // solo para mostrar: el servidor recalcula con el precio real
  stock: number;
  cantidad: number;
  descuento: number; // en pesos, para toda la línea
}

interface EstadoPOS {
  canal: (typeof CANALES_POS)[number];
  items: ItemTicket[];
  descuentoTotal: number;
  clienta: { nombre: string; telefono: string };
  setCanal: (c: EstadoPOS["canal"]) => void;
  agregar: (item: Omit<ItemTicket, "cantidad" | "descuento">) => "agregado" | "sumado" | "sin-stock";
  cambiarCantidad: (varianteId: string, cantidad: number) => void;
  cambiarDescuento: (varianteId: string, descuento: number) => void;
  quitar: (varianteId: string) => void;
  setDescuentoTotal: (v: number) => void;
  setClienta: (c: Partial<EstadoPOS["clienta"]>) => void;
  nuevaVenta: () => void;
}

const inicial = { canal: "TIENDA_FISICA" as const, items: [], descuentoTotal: 0, clienta: { nombre: "", telefono: "" } };

/** Ticket del POS. Se guarda en el navegador: si la página se recarga, la venta en curso no se pierde. */
export const usePOS = create<EstadoPOS>()(
  persist(
    (set, get) => ({
      ...inicial,
      setCanal: (canal) => set({ canal }),
      agregar: (item) => {
        const existente = get().items.find((i) => i.varianteId === item.varianteId);
        const cantidadActual = existente?.cantidad ?? 0;
        if (cantidadActual + 1 > item.stock) return "sin-stock";
        if (existente) {
          set({ items: get().items.map((i) => (i.varianteId === item.varianteId ? { ...i, stock: item.stock, cantidad: i.cantidad + 1 } : i)) });
          return "sumado";
        }
        set({ items: [...get().items, { ...item, cantidad: 1, descuento: 0 }] });
        return "agregado";
      },
      cambiarCantidad: (varianteId, cantidad) =>
        set({
          items: get().items.map((i) =>
            i.varianteId === varianteId
              ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)), descuento: Math.min(i.descuento, i.precio * Math.max(1, Math.min(cantidad, i.stock))) }
              : i,
          ),
        }),
      cambiarDescuento: (varianteId, descuento) =>
        set({
          items: get().items.map((i) =>
            i.varianteId === varianteId ? { ...i, descuento: Math.max(0, Math.min(descuento || 0, i.precio * i.cantidad)) } : i,
          ),
        }),
      quitar: (varianteId) => set({ items: get().items.filter((i) => i.varianteId !== varianteId) }),
      setDescuentoTotal: (v) => set({ descuentoTotal: Math.max(0, v || 0) }),
      setClienta: (c) => set({ clienta: { ...get().clienta, ...c } }),
      nuevaVenta: () => set({ ...inicial }),
    }),
    { name: "glow-pos", version: 1 },
  ),
);
