"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Package,
  ScanBarcode,
  Settings,
  Tags,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ItemMenu {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

export const MENU_ADMIN: { grupo: string; items: ItemMenu[] }[] = [
  {
    grupo: "Ventas",
    items: [
      { href: "/admin", etiqueta: "Dashboard", icono: LayoutDashboard },
      { href: "/admin/pedidos", etiqueta: "Pedidos", icono: ClipboardList },
      { href: "/admin/pos", etiqueta: "Punto de venta", icono: ScanBarcode },
      { href: "/admin/caja", etiqueta: "Cierre de caja", icono: Wallet },
      { href: "/admin/clientas", etiqueta: "Clientas", icono: Users },
    ],
  },
  {
    grupo: "Catálogo",
    items: [
      { href: "/admin/productos", etiqueta: "Productos", icono: Package },
      { href: "/admin/productos/categorias", etiqueta: "Categorías y marcas", icono: Tags },
      { href: "/admin/inventario", etiqueta: "Inventario", icono: Boxes },
      { href: "/admin/proveedores", etiqueta: "Proveedores y compras", icono: Truck },
    ],
  },
  {
    grupo: "Negocio",
    items: [
      { href: "/admin/reportes", etiqueta: "Reportes", icono: ChartColumn },
      { href: "/admin/configuracion", etiqueta: "Configuración", icono: Settings },
    ],
  },
];

const TODAS = MENU_ADMIN.flatMap((g) => g.items.map((i) => i.href));

/** La ruta activa es la coincidencia más larga (así /admin/productos/categorias no marca también Productos). */
function rutaActiva(ruta: string) {
  return TODAS.filter((h) => ruta === h || (h !== "/admin" && ruta.startsWith(h + "/"))).sort(
    (a, b) => b.length - a.length,
  )[0];
}

export function ListaMenuAdmin({ alNavegar }: { alNavegar?: () => void }) {
  const activa = rutaActiva(usePathname());
  return (
    <nav aria-label="Menú del panel" className="space-y-5">
      {MENU_ADMIN.map((g) => (
        <div key={g.grupo}>
          <p className="mb-1.5 px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{g.grupo}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, etiqueta, icono: Icono }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={alNavegar}
                  aria-current={activa === href ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-secondary/50",
                    activa === href && "bg-glow text-white shadow-glow hover:bg-glow",
                  )}
                >
                  <Icono className="size-4.5 shrink-0" aria-hidden />
                  {etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function MenuAdminMovil() {
  const [abierto, setAbierto] = useState(false);
  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menú del panel" className="lg:hidden" />}>
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="font-heading text-xl text-primary">Panel de Adri ✨</SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-6">
          <ListaMenuAdmin alNavegar={() => setAbierto(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
