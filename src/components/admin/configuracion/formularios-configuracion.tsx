"use client";

import { useState, useTransition, type ReactElement } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoArea, CampoInterruptor, CampoSelect } from "@/components/compartidos/campos";
import { SubirImagen } from "@/components/admin/subir-imagen";
import {
  esquemaBanner,
  esquemaCupon,
  esquemaPlantillas,
  esquemaTienda,
  type DatosBanner,
  type DatosCupon,
  type DatosPlantillas,
  type DatosTienda,
} from "@/features/configuracion/schemas";
import { guardarBanner, guardarCupon, guardarPlantillas, guardarTienda } from "@/features/configuracion/actions";
import { VARIABLES_PLANTILLA } from "@/features/whatsapp/mensajes";
import { aNumeroONulo, aTextoONulo } from "@/lib/formularios";

type Res = { ok: true; mensaje?: string } | { ok: false; error: string };

function useGuardar(alExito?: () => void) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const guardar = (fn: () => Promise<Res>) =>
    iniciar(async () => {
      const r = await fn();
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.mensaje);
      alExito?.();
      router.refresh();
    });
  return { pendiente, guardar };
}

function BotonGuardar({ pendiente, texto = "Guardar" }: { pendiente: boolean; texto?: string }) {
  return (
    <Button type="submit" variant="glow" disabled={pendiente}>
      {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} {texto}
    </Button>
  );
}

// ------------------------------------------------------------------ Tienda

export function FormularioTienda({ inicial }: { inicial: DatosTienda }) {
  const { register, handleSubmit, formState } = useForm<DatosTienda>({ resolver: zodResolver(esquemaTienda), defaultValues: inicial });
  const { pendiente, guardar } = useGuardar();
  const e = formState.errors;
  return (
    <form onSubmit={handleSubmit((d) => guardar(() => guardarTienda(d)), () => toast.error("Revisa los campos marcados"))} noValidate className="space-y-6">
      <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-suave sm:grid-cols-2">
        <h2 className="text-lg font-semibold text-berry sm:col-span-2">Datos de la tienda</h2>
        <CampoTexto etiqueta="Nombre" registro={register("nombre")} error={e.nombre?.message} />
        <CampoTexto etiqueta="WhatsApp del negocio" type="tel" ayuda="10 dígitos, ej: 300 123 4567" registro={register("whatsapp")} error={e.whatsapp?.message} />
        <CampoTexto etiqueta="Dirección" registro={register("direccion")} error={e.direccion?.message} />
        <CampoTexto etiqueta="Ciudad" registro={register("ciudad")} error={e.ciudad?.message} />
        <div className="sm:col-span-2">
          <CampoTexto etiqueta="Horario de atención" placeholder="Lunes a sábado 9:00 a. m. – 7:00 p. m." registro={register("horario")} error={e.horario?.message} />
        </div>
        <div className="sm:col-span-2">
          <CampoTexto
            etiqueta="Mapa de Google (opcional)"
            ayuda="En Google Maps: Compartir → Insertar un mapa → copia solo la URL que está dentro de src=&quot;…&quot;"
            registro={register("mapaUrl", { setValueAs: aTextoONulo })}
            error={e.mapaUrl?.message}
          />
        </div>
      </section>
      <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-suave sm:grid-cols-3">
        <h2 className="text-lg font-semibold text-berry sm:col-span-3">Redes sociales</h2>
        <CampoTexto etiqueta="Instagram (usuario)" placeholder="glowbyadri" registro={register("instagram", { setValueAs: aTextoONulo })} error={e.instagram?.message} />
        <CampoTexto etiqueta="Facebook (URL)" registro={register("facebook", { setValueAs: aTextoONulo })} error={e.facebook?.message} />
        <CampoTexto etiqueta="TikTok (usuario)" registro={register("tiktok", { setValueAs: aTextoONulo })} error={e.tiktok?.message} />
      </section>
      <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-suave sm:grid-cols-3">
        <h2 className="text-lg font-semibold text-berry sm:col-span-3">Envíos y pagos</h2>
        <CampoTexto etiqueta="Domicilio en la ciudad" type="number" min={0} registro={register("costoDomicilio", { setValueAs: aNumeroONulo })} error={e.costoDomicilio?.message} />
        <CampoTexto etiqueta="Envío nacional" type="number" min={0} registro={register("costoNacional", { setValueAs: aNumeroONulo })} error={e.costoNacional?.message} />
        <CampoTexto etiqueta="Envío gratis desde" type="number" min={0} ayuda="Vacío = nunca gratis" registro={register("envioGratisDesde", { setValueAs: aNumeroONulo })} error={e.envioGratisDesde?.message} />
        <div className="sm:col-span-3">
          <CampoArea etiqueta="Datos para transferencia / Nequi / Daviplata" rows={4} ayuda="Se usan en la plantilla {datosPago}" registro={register("datosPago", { setValueAs: aTextoONulo })} />
        </div>
      </section>
      <div className="flex justify-end">
        <BotonGuardar pendiente={pendiente} texto="Guardar configuración" />
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ Plantillas

export function FormularioPlantillas({ plantillas }: { plantillas: (DatosPlantillas["plantillas"][number] & { etiqueta: string })[] }) {
  const { register, handleSubmit, formState } = useForm<DatosPlantillas>({
    resolver: zodResolver(esquemaPlantillas),
    defaultValues: { plantillas: plantillas.map(({ clave, mensaje }) => ({ clave, mensaje })) },
  });
  const { pendiente, guardar } = useGuardar();
  return (
    <form onSubmit={handleSubmit((d) => guardar(() => guardarPlantillas(d)))} noValidate className="space-y-4">
      <p className="rounded-2xl bg-nude p-4 text-sm">
        Variables disponibles: {VARIABLES_PLANTILLA.map((v) => <code key={v} className="mx-0.5 rounded bg-white px-1.5 py-0.5 text-xs">{v}</code>)}
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {plantillas.map((p, i) => (
          <div key={p.clave} className="rounded-3xl bg-white p-4 shadow-suave">
            <input type="hidden" {...register(`plantillas.${i}.clave`)} />
            <CampoArea etiqueta={p.etiqueta} rows={4} registro={register(`plantillas.${i}.mensaje`)} error={formState.errors.plantillas?.[i]?.mensaje?.message} />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <BotonGuardar pendiente={pendiente} texto="Guardar plantillas" />
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ Cupones

export function DialogoCupon({ disparador, cupon }: { disparador: ReactElement; cupon?: DatosCupon & { id: string } }) {
  const [abierto, setAbierto] = useState(false);
  const vacio: DatosCupon = { codigo: "", tipo: "porcentaje", valor: 10, minimoCompra: 0, usosMaximos: null, venceEn: null, activo: true };
  const { register, handleSubmit, control, reset, formState } = useForm<DatosCupon>({ resolver: zodResolver(esquemaCupon), defaultValues: cupon ?? vacio });
  const { pendiente, guardar } = useGuardar(() => {
    setAbierto(false);
    if (!cupon) reset(vacio);
  });
  const tipo = useWatch({ control, name: "tipo" });
  const e = formState.errors;
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={disparador} />
      <DialogContent>
        <form onSubmit={handleSubmit((d) => guardar(() => guardarCupon(cupon?.id ?? null, d)))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{cupon ? "Editar cupón" : "Nuevo cupón"}</DialogTitle>
          </DialogHeader>
          <CampoTexto etiqueta="Código" placeholder="BIENVENIDA10" className="uppercase" registro={register("codigo")} error={e.codigo?.message} />
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect etiqueta="Tipo" opciones={[{ valor: "porcentaje", etiqueta: "Porcentaje (%)" }, { valor: "valor", etiqueta: "Valor fijo ($)" }]} registro={register("tipo")} />
            <CampoTexto etiqueta={tipo === "porcentaje" ? "Porcentaje" : "Valor en pesos"} type="number" min={1} registro={register("valor", { setValueAs: aNumeroONulo })} error={e.valor?.message} />
            <CampoTexto etiqueta="Compra mínima" type="number" min={0} registro={register("minimoCompra", { setValueAs: aNumeroONulo })} error={e.minimoCompra?.message} />
            <CampoTexto etiqueta="Usos máximos" type="number" min={1} placeholder="Sin límite" registro={register("usosMaximos", { setValueAs: aNumeroONulo })} error={e.usosMaximos?.message} />
          </div>
          <CampoTexto etiqueta="Vence el (opcional)" type="date" registro={register("venceEn", { setValueAs: aTextoONulo })} />
          <Controller control={control} name="activo" render={({ field }) => <CampoInterruptor etiqueta="Activo" valor={field.value} alCambiar={field.onChange} />} />
          <DialogFooter>
            <BotonGuardar pendiente={pendiente} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------------ Banners

export function DialogoBanner({ disparador, banner }: { disparador: ReactElement; banner?: DatosBanner & { id: string } }) {
  const [abierto, setAbierto] = useState(false);
  const vacio: DatosBanner = { titulo: "", subtitulo: null, imagen: "", enlace: null, orden: 0, activo: true };
  const { register, handleSubmit, control, reset, setValue, formState } = useForm<DatosBanner>({ resolver: zodResolver(esquemaBanner), defaultValues: banner ?? vacio });
  const { pendiente, guardar } = useGuardar(() => {
    setAbierto(false);
    if (!banner) reset(vacio);
  });
  const imagen = useWatch({ control, name: "imagen" });
  const e = formState.errors;
  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger render={disparador} />
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit((d) => guardar(() => guardarBanner(banner?.id ?? null, d)))} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{banner ? "Editar banner" : "Nuevo banner"}</DialogTitle>
          </DialogHeader>
          <CampoTexto etiqueta="Título" registro={register("titulo")} error={e.titulo?.message} />
          <CampoTexto etiqueta="Subtítulo (opcional)" registro={register("subtitulo", { setValueAs: aTextoONulo })} error={e.subtitulo?.message} />
          <CampoTexto etiqueta="Enlace (opcional)" placeholder="/categoria/labios" registro={register("enlace", { setValueAs: aTextoONulo })} error={e.enlace?.message} />
          <CampoTexto etiqueta="Orden" type="number" min={0} registro={register("orden", { setValueAs: aNumeroONulo })} error={e.orden?.message} />
          <div className="space-y-2">
            <p className="text-sm font-medium">Imagen (horizontal, ideal 1920×800)</p>
            {imagen ? (
              <div className="relative aspect-[12/5] overflow-hidden rounded-2xl">
                <Image src={imagen} alt="" fill sizes="480px" className="object-cover" />
                <button type="button" onClick={() => setValue("imagen", "")} aria-label="Quitar imagen" className="absolute top-2 right-2 rounded-full bg-white/90 p-1">
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            ) : (
              <SubirImagen maximo={1} carpeta="glow-by-adri/banners" alSubir={(url) => setValue("imagen", url, { shouldValidate: true })} />
            )}
            {e.imagen?.message && <p className="text-xs text-destructive">{e.imagen.message}</p>}
          </div>
          <Controller control={control} name="activo" render={({ field }) => <CampoInterruptor etiqueta="Visible en el inicio" valor={field.value} alCambiar={field.onChange} />} />
          <DialogFooter>
            <BotonGuardar pendiente={pendiente} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
