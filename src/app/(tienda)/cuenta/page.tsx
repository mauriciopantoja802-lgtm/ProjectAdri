import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, MapPin, Package } from "lucide-react";
import { auth } from "@/lib/auth";
import { cerrarSesion } from "@/features/auth/actions";
import { datosCuenta } from "@/features/cuenta/queries";
import { Button } from "@/components/ui/button";
import { ListaPedidosClienta } from "@/components/tienda/cuenta/lista-pedidos";
import { BotonEliminarDireccion } from "@/components/tienda/cuenta/boton-eliminar-direccion";
import { CambiarContrasena } from "@/components/tienda/cuenta/cambiar-contrasena";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaginaCuenta() {
  const sesion = await auth();
  // El middleware ya protege /cuenta; esta verificación es una segunda capa.
  if (!sesion?.user) redirect("/login?callbackUrl=/cuenta");
  const clienta = await datosCuenta(sesion.user.id);

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-berry sm:text-4xl">¡Hola, {sesion.user.name?.split(" ")[0]}! 💖</h1>
          <p className="text-muted-foreground">
            {sesion.user.email}
            {clienta && ` · ${clienta.telefono.replace(/^57/, "")}`}
          </p>
        </div>
        <form action={cerrarSesion}>
          <Button type="submit" variant="outline">
            <LogOut aria-hidden /> Cerrar sesión
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl bg-white p-6 shadow-suave">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-berry">
              <Package className="size-5 text-primary" aria-hidden /> Mis pedidos
            </h2>
            {(clienta?._count.pedidos ?? 0) > 5 && (
              <Link href="/cuenta/pedidos" className="text-sm font-semibold text-primary hover:underline">
                Ver todos ({clienta?._count.pedidos})
              </Link>
            )}
          </div>
          <ListaPedidosClienta pedidos={clienta?.pedidos ?? []} />
        </div>

        <div className="h-fit rounded-3xl bg-white p-6 shadow-suave">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-berry">
            <MapPin className="size-5 text-primary" aria-hidden /> Mis direcciones
          </h2>
          {clienta?.direcciones.length ? (
            <ul className="space-y-2">
              {clienta.direcciones.map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-2 rounded-2xl bg-nude p-3 text-sm">
                  <span>
                    {d.direccion}
                    <span className="block text-xs text-muted-foreground">{[d.barrio, d.ciudad].filter(Boolean).join(", ")}</span>
                  </span>
                  <BotonEliminarDireccion id={d.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Las direcciones se guardan al hacer tu primera compra con domicilio.</p>
          )}
          <div className="mt-6 border-t border-border pt-6">
            <CambiarContrasena />
          </div>
        </div>
      </div>
    </section>
  );
}
