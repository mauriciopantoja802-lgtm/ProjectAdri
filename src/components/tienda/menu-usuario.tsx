"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { LayoutDashboard, LogOut, Package, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const claseItem = "cursor-pointer gap-2 px-2 py-2 focus:bg-secondary/60 focus:text-berry";

/**
 * Ícono de cuenta del header. La sesión se consulta desde el navegador (useSession)
 * para que las páginas de la tienda sigan siendo rápidas y cacheables.
 */
export function MenuUsuario() {
  const { data: sesion, status } = useSession();
  const router = useRouter();
  const icono = cn(buttonVariants({ variant: "ghost", size: "icon" }), "hover:bg-muted");

  if (status !== "authenticated") {
    return (
      <Link href="/login" aria-label="Iniciar sesión" className={icono}>
        <User className="size-5" aria-hidden />
      </Link>
    );
  }

  const nombre = sesion.user.name?.split(" ")[0] ?? "Hola";
  const esAdmin = sesion.user.rol === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Menú de ${nombre}`} className="hover:bg-muted" />}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-glow text-sm font-semibold text-white">
          {nombre.charAt(0).toUpperCase()}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-1.5">
            <span className="block text-sm font-semibold text-berry">¡Hola, {nombre}! 💖</span>
            <span className="block truncate text-xs">{sesion.user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {esAdmin && (
          <DropdownMenuItem className={claseItem} onClick={() => router.push("/admin")}>
            <LayoutDashboard aria-hidden /> Panel de administración
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={claseItem} onClick={() => router.push("/cuenta")}>
          <User aria-hidden /> Mi cuenta
        </DropdownMenuItem>
        <DropdownMenuItem className={claseItem} onClick={() => router.push("/cuenta/pedidos")}>
          <Package aria-hidden /> Mis pedidos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="cursor-pointer gap-2 px-2 py-2" onClick={() => signOut({ redirectTo: "/" })}>
          <LogOut aria-hidden /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
