"use client";

import { useState, useTransition, type ReactElement } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ResultadoSimple = { ok: true; mensaje?: string } | { ok: false; error: string };

/**
 * Pide confirmación antes de una acción delicada (eliminar, cancelar…),
 * ejecuta la Server Action y muestra el resultado en un toast.
 */
export function BotonConfirmar({
  disparador,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  peligroso = true,
  accion,
  alTerminar,
}: {
  disparador: ReactElement; // ej: <Button variant="ghost">Eliminar</Button>
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  peligroso?: boolean;
  accion: () => Promise<ResultadoSimple>;
  alTerminar?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();

  const confirmar = () =>
    iniciar(async () => {
      const r = await accion();
      if (r.ok) {
        toast.success(r.mensaje ?? "Listo");
        setAbierto(false);
        alTerminar?.();
      } else {
        toast.error(r.error);
      }
    });

  return (
    <AlertDialog open={abierto} onOpenChange={setAbierto}>
      <AlertDialogTrigger render={disparador} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <Button variant={peligroso ? "destructive" : "default"} onClick={confirmar} disabled={pendiente}>
            {pendiente && <LoaderCircle className="animate-spin" aria-hidden />}
            {textoConfirmar}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
