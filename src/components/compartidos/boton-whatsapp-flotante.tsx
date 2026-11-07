import { MessageCircle } from "lucide-react";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { MENSAJE_WHATSAPP_GENERAL } from "@/lib/constantes";

/** Botón verde fijo abajo a la derecha, visible en todas las páginas de la tienda. */
export function BotonWhatsappFlotante({ numero }: { numero: string }) {
  return (
    <a
      href={crearEnlaceWhatsapp(numero, MENSAJE_WHATSAPP_GENERAL)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full bg-whatsapp p-3.5 text-[#052e16] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:ring-4 focus-visible:ring-whatsapp/40 focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <span
        aria-hidden
        className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp opacity-30 motion-reduce:hidden"
      />
      <MessageCircle className="size-7" aria-hidden />
      <span className="hidden max-w-0 overflow-hidden text-sm font-semibold whitespace-nowrap transition-all duration-300 group-hover:max-w-40 group-hover:pr-1 sm:inline">
        ¿Te ayudo?
      </span>
    </a>
  );
}
