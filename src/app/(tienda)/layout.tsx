import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/tienda/header";
import { Footer } from "@/components/tienda/footer";
import { JsonLdNegocio } from "@/components/tienda/json-ld-negocio";
import { BotonWhatsappFlotante } from "@/components/compartidos/boton-whatsapp-flotante";
import { obtenerConfiguracion } from "@/features/configuracion/queries";

// Las páginas de la tienda se regeneran como máximo cada 5 minutos (ISR).
// Al guardar cambios en /admin se forzará la actualización con revalidatePath.
export const revalidate = 300;

export default async function LayoutTienda({ children }: { children: React.ReactNode }) {
  const config = await obtenerConfiguracion();

  return (
    // Sin pasar la sesión desde el servidor: useSession la pide desde el navegador
    // y así las páginas públicas no dejan de ser cacheables.
    <SessionProvider>
      <div className="flex min-h-dvh flex-col">
        <a
          href="#contenido"
          className="sr-only z-50 rounded-2xl bg-primary px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          Saltar al contenido
        </a>
        <JsonLdNegocio config={config} />
        <Header whatsapp={config.whatsapp} />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer config={config} />
        <BotonWhatsappFlotante numero={config.whatsapp} />
      </div>
    </SessionProvider>
  );
}
