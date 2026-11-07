"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NAV_AYUDA, NAV_TIENDA, MENSAJE_WHATSAPP_GENERAL } from "@/lib/constantes";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { cn } from "@/lib/utils";

/** Menú lateral para celular. Se cierra solo al elegir una opción. */
export function MenuMovil({ whatsapp }: { whatsapp: string }) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  return (
    <Sheet open={abierto} onOpenChange={setAbierto}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Abrir menú" className="md:hidden" />}>
        <Menu className="size-6" aria-hidden />
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-nude">
        <SheetHeader>
          <SheetTitle className="font-heading text-2xl text-primary">
            Glow by Adri <span className="texto-dorado">✨</span>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Menú principal" className="flex flex-col gap-1 px-4">
          {NAV_TIENDA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbierto(false)}
              aria-current={ruta === item.href ? "page" : undefined}
              className={cn(
                "rounded-2xl px-4 py-3 text-base font-medium transition-colors hover:bg-secondary/60",
                ruta === item.href && "bg-secondary/70 text-primary",
              )}
            >
              {item.etiqueta}
            </Link>
          ))}
          <Separator className="my-3" />
          {NAV_AYUDA.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbierto(false)}
              className="rounded-2xl px-4 py-2 text-sm text-muted-foreground hover:bg-secondary/60"
            >
              {item.etiqueta}
            </Link>
          ))}
        </nav>
        <div className="mt-auto p-4">
          <a
            href={crearEnlaceWhatsapp(whatsapp, MENSAJE_WHATSAPP_GENERAL)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "w-full")}
          >
            <MessageCircle aria-hidden /> Escríbenos por WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
