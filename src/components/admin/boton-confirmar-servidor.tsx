"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BotonConfirmar } from "@/components/compartidos/boton-confirmar";

type Res = { ok: true; mensaje?: string } | { ok: false; error: string };

/**
 * Botón-ícono con confirmación que se puede usar desde páginas de servidor:
 * recibe una Server Action ya "atada" a su id (accion.bind(null, id)).
 */
export function BotonConfirmarServidor({
  titulo,
  descripcion,
  accion,
  etiqueta,
  icono,
  textoConfirmar = "Eliminar",
}: {
  titulo: string;
  descripcion: string;
  accion: () => Promise<Res>;
  etiqueta: string;
  icono: React.ReactNode;
  textoConfirmar?: string;
}) {
  const router = useRouter();
  return (
    <BotonConfirmar
      disparador={
        <Button variant="ghost" size="icon-sm" aria-label={etiqueta}>
          {icono}
        </Button>
      }
      titulo={titulo}
      descripcion={descripcion}
      textoConfirmar={textoConfirmar}
      accion={accion}
      alTerminar={() => router.refresh()}
    />
  );
}
