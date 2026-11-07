import type { Metadata } from "next";
import { PantallaPOS } from "@/components/admin/pos/pantalla-pos";

export const metadata: Metadata = { title: "Punto de venta" };

export default function PaginaPOS() {
  return (
    <>
      <h1 className="sr-only">Punto de venta</h1>
      <PantallaPOS />
    </>
  );
}
