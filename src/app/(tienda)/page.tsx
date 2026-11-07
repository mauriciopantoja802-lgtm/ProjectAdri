import Link from "next/link";
import { MessageCircle, Sparkles, Store, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BannerPrincipal } from "@/components/tienda/inicio/banner-principal";
import { SeccionCategorias, SeccionTestimonios, SeccionVisitanos } from "@/components/tienda/inicio/secciones";
import { FilaProductos } from "@/components/tienda/fila-productos";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { obtenerBanners, opcionesFiltros, seccionesInicio } from "@/features/catalogo/queries";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { MENSAJE_WHATSAPP_GENERAL } from "@/lib/constantes";
import { formatoCOP } from "@/lib/formato";
import { cn } from "@/lib/utils";

export default async function Inicio() {
  const [config, banners, secciones, { categorias }] = await Promise.all([
    obtenerConfiguracion(),
    obtenerBanners(),
    seccionesInicio(),
    opcionesFiltros(),
  ]);

  return (
    <>
      {banners.length > 0 ? (
        <BannerPrincipal banners={banners} />
      ) : (
        <section className="bg-glow-suave">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-medium text-primary shadow-suave">
              <Sparkles className="size-4 text-accent" aria-hidden /> Nueva colección disponible
            </span>
            <h1 className="max-w-3xl text-4xl leading-tight font-bold text-berry sm:text-6xl">
              Resalta tu <span className="text-primary italic">brillo</span> natural
            </h1>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/productos" className={buttonVariants({ variant: "glow", size: "lg" })}>
                Ver productos
              </Link>
              <a
                href={crearEnlaceWhatsapp(config.whatsapp, MENSAJE_WHATSAPP_GENERAL)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }))}
              >
                <MessageCircle aria-hidden /> Pedir por WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}
      {/* El h1 de la página para lectores de pantalla y SEO cuando hay banners */}
      {banners.length > 0 && <h1 className="sr-only">Glow by Adri: tienda de maquillaje en {config.ciudad}</h1>}

      <ul className="mx-auto grid max-w-7xl gap-3 px-4 pt-8 sm:grid-cols-3 sm:px-6">
        {[
          { icono: Truck, titulo: `Domicilios en ${config.ciudad}`, texto: config.envioGratisDesde ? `Gratis desde ${formatoCOP(config.envioGratisDesde)}` : "Entrega rápida" },
          { icono: Store, titulo: "Recoge en la tienda", texto: "Sin costo, cuando quieras" },
          { icono: MessageCircle, titulo: "Asesoría por WhatsApp", texto: "Te ayudamos a elegir tu tono" },
        ].map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="flex items-center gap-3 rounded-2xl bg-nude p-4">
            <Icono className="size-6 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{titulo}</p>
              <p className="text-xs text-muted-foreground">{texto}</p>
            </div>
          </li>
        ))}
      </ul>

      <SeccionCategorias categorias={categorias} />
      <FilaProductos titulo="Los más vendidos" subtitulo="Los favoritos de nuestras clientas" enlace="/productos?orden=mas-vendidos" productos={secciones.masVendidos} />
      <FilaProductos titulo="Novedades" subtitulo="Lo último que llegó a la tienda" enlace="/productos?orden=nuevos" productos={secciones.novedades} />
      <FilaProductos titulo="Ofertas 💖" subtitulo="Precios especiales por tiempo limitado" enlace="/productos?oferta=1" productos={secciones.ofertas} />
      <SeccionTestimonios />
      <SeccionVisitanos config={config} />
    </>
  );
}
