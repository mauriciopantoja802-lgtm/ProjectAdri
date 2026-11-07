import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { datosCuenta } from "@/features/cuenta/queries";
import { buttonVariants } from "@/components/ui/button";
import { ListaPedidosClienta } from "@/components/tienda/cuenta/lista-pedidos";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MisPedidos() {
  const sesion = await auth();
  if (!sesion?.user) redirect("/login?callbackUrl=/cuenta/pedidos");
  const clienta = await datosCuenta(sesion.user.id, 100);
  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-12 sm:px-6">
      <Link href="/cuenta" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Mi cuenta
      </Link>
      <h1 className="text-3xl font-bold text-berry">Mis pedidos</h1>
      <div className="rounded-3xl bg-white p-6 shadow-suave">
        <ListaPedidosClienta pedidos={clienta?.pedidos ?? []} />
      </div>
    </section>
  );
}
