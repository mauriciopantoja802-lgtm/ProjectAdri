"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BotonConfirmar } from "@/components/compartidos/boton-confirmar";
import { eliminarDireccion } from "@/features/cuenta/actions";

export function BotonEliminarDireccion({ id }: { id: string }) {
  const router = useRouter();
  return (
    <BotonConfirmar
      disparador={
        <Button variant="ghost" size="icon-sm" aria-label="Eliminar dirección">
          <Trash2 className="text-muted-foreground" aria-hidden />
        </Button>
      }
      titulo="¿Eliminar esta dirección?"
      descripcion="Podrás agregarla de nuevo en tu próxima compra."
      textoConfirmar="Eliminar"
      accion={() => eliminarDireccion(id)}
      alTerminar={() => router.refresh()}
    />
  );
}
