"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { BotonConfirmar } from "@/components/compartidos/boton-confirmar";
import { cambiarEstadoProducto, eliminarProducto } from "@/features/productos/actions";

export function AccionesProducto({ id, nombre, activo }: { id: string; nombre: string; activo: boolean }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  const alternar = () =>
    iniciar(async () => {
      const r = await cambiarEstadoProducto(id, !activo);
      if (r.ok) toast.success(r.mensaje);
      else toast.error(r.error);
      router.refresh();
    });

  return (
    <div className="flex justify-end gap-1">
      <Link href={`/admin/productos/${id}`} aria-label={`Editar ${nombre}`} className={buttonVariants({ variant: "ghost", size: "icon-sm" })}>
        <Pencil aria-hidden />
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={alternar}
        disabled={pendiente}
        aria-label={activo ? `Desactivar ${nombre}` : `Activar ${nombre}`}
        title={activo ? "Desactivar" : "Activar"}
      >
        <Power className={activo ? "text-green-600" : "text-muted-foreground"} aria-hidden />
      </Button>
      <BotonConfirmar
        disparador={
          <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${nombre}`}>
            <Trash2 className="text-destructive" aria-hidden />
          </Button>
        }
        titulo={`¿Eliminar “${nombre}”?`}
        descripcion="Esta acción no se puede deshacer. Si el producto ya tiene ventas, te pediremos desactivarlo en su lugar."
        textoConfirmar="Eliminar"
        accion={() => eliminarProducto(id)}
        alTerminar={() => router.refresh()}
      />
    </div>
  );
}
