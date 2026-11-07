"use client";

import { useState, useTransition, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { esquemaProveedor, type DatosProveedor } from "@/features/inventario/schemas";
import { guardarProveedor } from "@/features/inventario/actions";
import { aTextoONulo } from "@/lib/formularios";

export function DialogoProveedor({ disparador, proveedor }: { disparador: ReactElement; proveedor?: DatosProveedor & { id: string } }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const vacio: DatosProveedor = { nombre: "", telefono: null, email: null, nit: null };
  const { register, handleSubmit, reset, formState } = useForm<DatosProveedor>({
    resolver: zodResolver(esquemaProveedor),
    defaultValues: proveedor ?? vacio,
  });
  const e = formState.errors;

  const enviar = handleSubmit((d) =>
    iniciar(async () => {
      const r = await guardarProveedor(proveedor?.id ?? null, d);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.mensaje);
      setAbierto(false);
      if (!proveedor) reset(vacio);
      router.refresh();
    }),
  );

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={disparador} />
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{proveedor ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
          </DialogHeader>
          <CampoTexto etiqueta="Nombre o razón social" registro={register("nombre")} error={e.nombre?.message} />
          <CampoTexto etiqueta="NIT (opcional)" registro={register("nit", { setValueAs: aTextoONulo })} error={e.nit?.message} />
          <CampoTexto
            etiqueta="Teléfono / WhatsApp (opcional)"
            type="tel"
            registro={register("telefono", { setValueAs: aTextoONulo })}
            error={e.telefono?.message}
          />
          <CampoTexto
            etiqueta="Correo (opcional)"
            type="email"
            registro={register("email", { setValueAs: aTextoONulo })}
            error={e.email?.message}
          />
          <DialogFooter>
            <Button type="submit" variant="glow" disabled={pendiente}>
              {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
