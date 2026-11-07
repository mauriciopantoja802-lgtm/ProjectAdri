import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MessageCircle, Sparkles, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { MENSAJE_WHATSAPP_GENERAL } from "@/lib/constantes";

export const metadata: Metadata = {
  title: "Sobre Adri",
  description: "Conoce a Adriana, la creadora de Glow by Adri: maquillaje y skincare con asesoría personalizada en Popayán.",
  alternates: { canonical: "/sobre-adri" },
};

export default async function SobreAdri() {
  const config = await obtenerConfiguracion();
  return (
    <>
      <section className="bg-glow-suave">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <Sparkles className="mx-auto mb-4 size-10 text-accent" aria-hidden />
          <h1 className="text-4xl font-bold text-berry sm:text-5xl">Hola, soy Adri 💖</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Creé Glow by Adri para que cada mujer de {config.ciudad} encuentre el maquillaje que la hace sentir segura, bonita y ella misma.
          </p>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[
          { icono: Heart, titulo: "Asesoría real", texto: "Te ayudo a encontrar tu tono de base, el labial perfecto para tu piel y la rutina que de verdad vas a usar." },
          { icono: Sparkles, titulo: "Productos originales", texto: "Trabajo con marcas que conozco y uso. Todo lo que vendo lo he probado antes de recomendarlo." },
          { icono: Store, titulo: "Cerca de ti", texto: `Visítame en la tienda de ${config.ciudad}, pide a domicilio o escríbeme por WhatsApp: como te quede más fácil.` },
        ].map(({ icono: Icono, titulo, texto }) => (
          <div key={titulo} className="rounded-3xl bg-white p-6 text-center shadow-suave">
            <Icono className="mx-auto mb-3 size-8 text-primary" aria-hidden />
            <h2 className="text-xl font-semibold text-berry">{titulo}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{texto}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-center gap-3 px-4 pb-6 sm:flex-row">
        <Link href="/productos" className={buttonVariants({ variant: "glow", size: "lg" })}>
          Ver productos
        </Link>
        <a href={crearEnlaceWhatsapp(config.whatsapp, MENSAJE_WHATSAPP_GENERAL)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "whatsapp", size: "lg" })}>
          <MessageCircle aria-hidden /> Escríbeme
        </a>
      </div>
    </>
  );
}
