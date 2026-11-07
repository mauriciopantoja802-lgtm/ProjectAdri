import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { wompiConfigurado } from "@/features/pagos/wompi";
import { FormularioCheckout } from "@/components/tienda/checkout/formulario-checkout";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };
export const dynamic = "force-dynamic"; // depende de la sesión de la clienta

export default async function Checkout() {
  const [config, sesion] = await Promise.all([obtenerConfiguracion(), auth()]);
  const usuario = sesion?.user?.id
    ? await prisma.usuario.findUnique({
        where: { id: sesion.user.id },
        select: { nombre: true, email: true, telefono: true, clienta: { select: { telefono: true, direcciones: true } } },
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold text-berry">Finalizar compra</h1>
      <FormularioCheckout
        wompiActivo={wompiConfigurado()}
        config={{
          ciudad: config.ciudad,
          costoDomicilio: config.costoDomicilio,
          costoNacional: config.costoNacional,
          envioGratisDesde: config.envioGratisDesde,
          direccion: config.direccion,
        }}
        perfil={
          usuario
            ? {
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.clienta?.telefono ?? usuario.telefono ?? "",
                direcciones: usuario.clienta?.direcciones ?? [],
              }
            : null
        }
      />
    </div>
  );
}
