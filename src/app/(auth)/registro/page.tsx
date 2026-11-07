import type { Metadata } from "next";
import { FormularioRegistro } from "@/components/auth/formulario-registro";

export const metadata: Metadata = { title: "Crear cuenta" };

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function PaginaRegistro({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-berry">Crea tu cuenta ✨</h1>
        <p className="text-sm text-muted-foreground">
          Guarda tus direcciones y sigue tus pedidos. También puedes comprar sin cuenta.
        </p>
      </div>
      <FormularioRegistro callbackUrl={callbackUrl} />
    </div>
  );
}
