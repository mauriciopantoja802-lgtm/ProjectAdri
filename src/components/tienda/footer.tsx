import Link from "next/link";
import { Clock, MapPin, MessageCircle } from "lucide-react";
import { IconoInstagram } from "@/components/compartidos/iconos-marca";
import { Logo } from "@/components/compartidos/logo";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { MENSAJE_WHATSAPP_GENERAL, NAV_AYUDA, NAV_TIENDA, type ConfiguracionPublica } from "@/lib/constantes";

function formatoTelefono(numero: string) {
  // 573001234567 → 300 123 4567
  const local = numero.replace(/\D/g, "").replace(/^57/, "");
  return local.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}

export function Footer({ config }: { config: ConfiguracionPublica }) {
  const anio = new Date().getFullYear();
  const usuarioInstagram = config.instagram?.replace(/^@/, "");

  return (
    <footer className="mt-16 bg-berry text-white/90">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo variante="claro" />
          <p className="text-sm leading-relaxed text-white/75">
            Maquillaje y cuidado de la piel para resaltar tu brillo natural. Hecho con amor desde{" "}
            {config.ciudad}, Cauca.
          </p>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg text-secondary">Tienda</h2>
          <ul className="space-y-2 text-sm">
            {NAV_TIENDA.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-secondary">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg text-secondary">Ayuda</h2>
          <ul className="space-y-2 text-sm">
            {NAV_AYUDA.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-secondary">
                  {item.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg text-secondary">Visítanos en {config.ciudad}</h2>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>{config.direccion}</span>
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
              <span>{config.horario}</span>
            </li>
            <li>
              <a
                href={crearEnlaceWhatsapp(config.whatsapp, MENSAJE_WHATSAPP_GENERAL)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 transition-colors hover:text-secondary"
              >
                <MessageCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                <span>WhatsApp {formatoTelefono(config.whatsapp)}</span>
              </a>
            </li>
            {usuarioInstagram && (
              <li>
                <a
                  href={`https://instagram.com/${usuarioInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-2 transition-colors hover:text-secondary"
                >
                  <IconoInstagram className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                  <span>@{usuarioInstagram}</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-white/60 sm:px-6">
          © {anio} {config.nombre}. Todos los derechos reservados · Tratamiento de datos según la Ley
          1581 de 2012.
        </p>
      </div>
    </footer>
  );
}
