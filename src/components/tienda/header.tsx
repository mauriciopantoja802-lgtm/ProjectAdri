import Link from "next/link";
import { Search } from "lucide-react";
import { Logo } from "@/components/compartidos/logo";
import { buttonVariants } from "@/components/ui/button";
import { NAV_TIENDA } from "@/lib/constantes";
import { cn } from "@/lib/utils";
import { IconoCarrito } from "./icono-carrito";
import { MenuMovil } from "./menu-movil";
import { MenuUsuario } from "./menu-usuario";

export function Header({ whatsapp }: { whatsapp: string }) {
  const icono = cn(buttonVariants({ variant: "ghost", size: "icon" }), "hover:bg-muted");

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-white/85 backdrop-blur-md">
      {/* Franja superior de beneficios */}
      <div className="bg-glow px-4 py-1.5 text-center text-xs font-medium text-white sm:text-sm">
        💖 Domicilios en Popayán · Envíos a toda Colombia · Paga contra entrega
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <div className="flex items-center gap-1">
          <MenuMovil whatsapp={whatsapp} />
          <Logo />
        </div>

        <nav aria-label="Menú principal" className="hidden items-center gap-1 md:flex">
          {NAV_TIENDA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-2xl px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:text-primary hover:after:scale-x-100"
            >
              {item.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <Link href="/productos" aria-label="Buscar productos" className={icono}>
            <Search className="size-5" aria-hidden />
          </Link>
          <MenuUsuario />
          <IconoCarrito />
        </div>
      </div>
    </header>
  );
}
