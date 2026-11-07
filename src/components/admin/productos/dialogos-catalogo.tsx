"use client";

import { useState, useTransition, type ReactElement } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { SubirImagen } from "@/components/admin/subir-imagen";
import { esquemaCategoria, esquemaMarca, type DatosCategoria, type DatosMarca } from "@/features/productos/schemas";
import { guardarCategoria, guardarMarca } from "@/features/productos/actions";
import { aNumeroONulo } from "@/lib/formularios";
import { slugify } from "@/lib/slug";

type Res = { ok: true; mensaje?: string } | { ok: false; error: string };

/** Hook común: abre/cierra el diálogo, ejecuta la acción y refresca la lista. */
function useGuardar(alGuardar: () => void) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const guardar = (fn: () => Promise<Res>) =>
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.mensaje);
      setAbierto(false);
      alGuardar();
      router.refresh();
    });
  return { abierto, setAbierto, pendiente, guardar };
}

export function DialogoCategoria({
  disparador,
  categoria,
}: {
  disparador: ReactElement;
  categoria?: DatosCategoria & { id: string };
}) {
  const vacio: DatosCategoria = { nombre: "", slug: "", imagen: null, orden: 0 };
  const { register, handleSubmit, setValue, reset, control, formState } = useForm<DatosCategoria>({
    resolver: zodResolver(esquemaCategoria),
    defaultValues: categoria ?? vacio,
  });
  const { abierto, setAbierto, pendiente, guardar } = useGuardar(() => !categoria && reset(vacio));
  const imagen = useWatch({ control, name: "imagen" });
  const e = formState.errors;

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={disparador} />
      <DialogContent>
        <form onSubmit={handleSubmit((d) => guardar(() => guardarCategoria(categoria?.id ?? null, d)))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{categoria ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>
          <CampoTexto
            etiqueta="Nombre"
            registro={register("nombre", { onChange: (ev) => !categoria && setValue("slug", slugify(ev.target.value)) })}
            error={e.nombre?.message}
          />
          <CampoTexto etiqueta="Slug" registro={register("slug")} error={e.slug?.message} />
          <CampoTexto
            etiqueta="Orden en la tienda"
            type="number"
            min={0}
            ayuda="Las de menor número aparecen primero"
            registro={register("orden", { setValueAs: aNumeroONulo })}
            error={e.orden?.message}
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagen (opcional)</p>
            {imagen ? (
              <div className="relative size-24 overflow-hidden rounded-2xl">
                <Image src={imagen} alt="" fill sizes="96px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setValue("imagen", null)}
                  aria-label="Quitar imagen"
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-1"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>
            ) : (
              <SubirImagen maximo={1} carpeta="glow-by-adri/categorias" alSubir={(url) => setValue("imagen", url)} />
            )}
            {e.imagen?.message && <p className="text-xs text-destructive">{e.imagen.message}</p>}
          </div>
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

export function DialogoMarca({ disparador, marca }: { disparador: ReactElement; marca?: DatosMarca & { id: string } }) {
  const vacio: DatosMarca = { nombre: "", slug: "" };
  const { register, handleSubmit, setValue, reset, formState } = useForm<DatosMarca>({
    resolver: zodResolver(esquemaMarca),
    defaultValues: marca ?? vacio,
  });
  const { abierto, setAbierto, pendiente, guardar } = useGuardar(() => !marca && reset(vacio));

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={disparador} />
      <DialogContent>
        <form onSubmit={handleSubmit((d) => guardar(() => guardarMarca(marca?.id ?? null, d)))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{marca ? "Editar marca" : "Nueva marca"}</DialogTitle>
          </DialogHeader>
          <CampoTexto
            etiqueta="Nombre"
            registro={register("nombre", { onChange: (ev) => !marca && setValue("slug", slugify(ev.target.value)) })}
            error={formState.errors.nombre?.message}
          />
          <CampoTexto etiqueta="Slug" registro={register("slug")} error={formState.errors.slug?.message} />
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
