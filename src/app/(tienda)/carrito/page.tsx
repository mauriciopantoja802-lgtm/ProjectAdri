import type { Metadata } from "next";
import { VistaCarrito } from "@/components/tienda/carrito/vista-carrito";
import { obtenerConfiguracion } from "@/features/configuracion/queries";

export const metadata: Metadata = { title: "Tu carrito", robots: { index: false } };

export default async function Carrito() {
  const config = await obtenerConfiguracion();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-berry">Tu carrito 🛍️</h1>
      <VistaCarrito costoDomicilio={config.costoDomicilio} envioGratisDesde={config.envioGratisDesde} />
    </div>
  );
}
