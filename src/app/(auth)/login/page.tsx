import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";
import { FormularioLogin } from "@/components/auth/formulario-login";

export const metadata: Metadata = { title: "Iniciar sesión" };

interface Props {
  searchParams: Promise<{ callbackUrl?: string; registro?: string }>;
}

export default async function PaginaLogin({ searchParams }: Props) {
  const { callbackUrl, registro } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-berry">¡Hola de nuevo! 💖</h1>
        <p className="text-sm text-muted-foreground">Ingresa para ver tus pedidos y comprar más rápido.</p>
      </div>
      {registro === "ok" && (
        <p
          role="status"
          className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Tu cuenta quedó creada. Inicia sesión para continuar.
        </p>
      )}
      <FormularioLogin callbackUrl={callbackUrl} />
    </div>
  );
}
