import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { IconoInstagram } from "@/components/compartidos/iconos-marca";
import { SeccionVisitanos } from "@/components/tienda/inicio/secciones";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { MENSAJE_WHATSAPP_GENERAL } from "@/lib/constantes";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos por WhatsApp o visítanos en nuestra tienda de maquillaje en Popayán.",
  alternates: { canonical: "/contacto" },
};

export default async function Contacto() {
  const config = await obtenerConfiguracion();
  const ig = config.instagram?.replace(/^@/, "");
  return (
    <>
      <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-6">
        <h1 className="text-4xl font-bold text-berry">Contacto</h1>
        <p className="mt-2 text-muted-foreground">La forma más rápida de hablar con nosotras es por WhatsApp. ¡Respondemos en minutos durante el horario de atención!</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          <li className="rounded-3xl bg-white p-6 shadow-suave">
            <MessageCircle className="mb-2 size-6 text-whatsapp" aria-hidden />
            <h2 className="font-semibold">WhatsApp</h2>
            <p className="text-sm text-muted-foreground">{config.whatsapp.replace(/^57/, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}</p>
            <a href={crearEnlaceWhatsapp(config.whatsapp, MENSAJE_WHATSAPP_GENERAL)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "whatsapp", className: "mt-3" })}>
              Abrir chat
            </a>
          </li>
          {ig && (
            <li className="rounded-3xl bg-white p-6 shadow-suave">
              <IconoInstagram className="mb-2 size-6 text-primary" aria-hidden />
              <h2 className="font-semibold">Instagram</h2>
              <p className="text-sm text-muted-foreground">Tips, tutoriales y lanzamientos</p>
              <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", className: "mt-3" })}>
                @{ig}
              </a>
            </li>
          )}
          <li className="rounded-3xl bg-white p-6 shadow-suave">
            <MapPin className="mb-2 size-6 text-primary" aria-hidden />
            <h2 className="font-semibold">Tienda</h2>
            <p className="text-sm text-muted-foreground">{config.direccion}</p>
          </li>
          <li className="rounded-3xl bg-white p-6 shadow-suave">
            <Clock className="mb-2 size-6 text-primary" aria-hidden />
            <h2 className="font-semibold">Horario</h2>
            <p className="text-sm text-muted-foreground">{config.horario}</p>
          </li>
        </ul>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="size-4" aria-hidden /> Para peticiones, quejas o reclamos sobre tus datos personales, escríbenos por WhatsApp indicando “Habeas data”.
        </p>
      </div>
      <SeccionVisitanos config={config} />
    </>
  );
}
