import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, MessageCircle, Navigation, Quote, Star } from "lucide-react";
import type { ConfiguracionTienda } from "@prisma/client";
import { buttonVariants } from "@/components/ui/button";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { MENSAJE_WHATSAPP_GENERAL, TESTIMONIOS } from "@/lib/constantes";
import { cn } from "@/lib/utils";

export function SeccionCategorias({ categorias }: { categorias: { id: string; nombre: string; slug: string; imagen: string | null; cantidad: number }[] }) {
  if (!categorias.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="mb-5 text-2xl font-bold text-berry sm:text-3xl">Compra por categoría</h2>
      <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-7">
        {categorias.map((c) => (
          <li key={c.id} className="w-28 shrink-0 sm:w-auto">
            <Link href={`/categoria/${c.slug}`} className="group flex flex-col items-center gap-2 text-center">
              <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-nude ring-4 ring-white shadow-suave transition-all group-hover:ring-secondary">
                <Image
                  src={c.imagen ?? IMAGEN_PLACEHOLDER}
                  alt=""
                  fill
                  sizes="140px"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="text-sm font-semibold group-hover:text-primary">{c.nombre}</span>
              <span className="-mt-2 text-xs text-muted-foreground">{c.cantidad} productos</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SeccionTestimonios() {
  return (
    <section className="bg-glow-suave py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="mb-8 text-center text-2xl font-bold text-berry sm:text-3xl">Lo que dicen nuestras clientas 💕</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {TESTIMONIOS.map((t) => (
            <li key={t.nombre} className="relative rounded-3xl bg-white p-6 shadow-suave">
              <Quote className="absolute top-5 right-5 size-8 text-secondary" aria-hidden />
              <div className="mb-3 flex gap-0.5" role="img" aria-label="5 de 5 estrellas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-accent text-accent" aria-hidden />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed">“{t.texto}”</blockquote>
              <p className="mt-4 text-sm font-semibold text-berry">
                {t.nombre} <span className="font-normal text-muted-foreground">· {t.ciudad}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** "Visítanos en Popayán": mapa de Google Maps (sin API key), dirección, horario y "Cómo llegar". */
export function SeccionVisitanos({ config }: { config: ConfiguracionTienda }) {
  const consulta = encodeURIComponent(`${config.direccion}, ${config.ciudad}, Colombia`);
  const mapa = config.mapaUrl ?? `https://www.google.com/maps?q=${consulta}&output=embed`;
  const comoLlegar = `https://www.google.com/maps/dir/?api=1&destination=${consulta}`;
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" id="visitanos">
      <div className="grid overflow-hidden rounded-3xl bg-white shadow-suave lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
          <h2 className="text-3xl font-bold text-berry">Visítanos en {config.ciudad}</h2>
          <p className="text-muted-foreground">Ven a probar los tonos y recibe asesoría personalizada de Adri. ✨</p>
          <p className="flex gap-3">
            <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> {config.direccion}
          </p>
          <p className="flex gap-3">
            <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden /> {config.horario}
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <a href={comoLlegar} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "glow", size: "lg" })}>
              <Navigation aria-hidden /> Cómo llegar
            </a>
            <a
              href={crearEnlaceWhatsapp(config.whatsapp, MENSAJE_WHATSAPP_GENERAL)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }))}
            >
              <MessageCircle aria-hidden /> Escríbenos
            </a>
          </div>
        </div>
        <iframe
          title={`Mapa de ${config.nombre} en ${config.ciudad}`}
          src={mapa}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-80 w-full border-0 lg:h-full lg:min-h-96"
        />
      </div>
    </section>
  );
}
