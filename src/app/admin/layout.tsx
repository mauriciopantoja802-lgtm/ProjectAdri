import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { obtenerSesionAdmin } from "@/lib/auth";
import { cerrarSesion } from "@/features/auth/actions";
import { Logo } from "@/components/compartidos/logo";
import { ListaMenuAdmin, MenuAdminMovil } from "@/components/admin/navegacion-admin";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s | Panel Glow by Adri" },
  robots: { index: false, follow: false },
};

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  // Segunda capa de seguridad además del middleware: confirma el rol ADMIN en la base de datos.
  const sesion = await obtenerSesionAdmin();
  if (!sesion) redirect("/login?callbackUrl=/admin");

  const salir = (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="size-4.5" aria-hidden /> Cerrar sesión
      </button>
    </form>
  );

  return (
    <div className="min-h-dvh bg-nude/70 lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo className="text-xl" />
          <p className="mt-0.5 text-xs text-muted-foreground">Panel de administración</p>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <ListaMenuAdmin />
        </div>
        <div className="border-t border-border p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
            Sesión de <strong className="text-berry">{sesion.user.name}</strong>
          </p>
          {salir}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-white/90 px-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-1">
            <MenuAdminMovil />
            <Logo className="text-lg lg:hidden" />
          </div>
          <Link href="/" target="_blank" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-sm")}>
            <ExternalLink aria-hidden /> Ver tienda
          </Link>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
