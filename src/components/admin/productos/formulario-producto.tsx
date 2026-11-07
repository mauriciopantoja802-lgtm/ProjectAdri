"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoArea, CampoInterruptor, CampoSelect } from "@/components/compartidos/campos";
import { CampoColor } from "@/components/admin/campo-color";
import { SubirImagen } from "@/components/admin/subir-imagen";
import { esquemaProducto, type DatosProducto } from "@/features/productos/schemas";
import { guardarProducto } from "@/features/productos/actions";
import { aNumeroONulo, aTextoONulo } from "@/lib/formularios";
import { formatoCOP } from "@/lib/formato";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

type Opcion = { id: string; nombre: string };

const varianteVacia = (n: number): DatosProducto["variantes"][number] => ({
  nombre: n === 0 ? "Única" : "",
  colorHex: null,
  sku: `GA-${Date.now().toString(36).toUpperCase().slice(-5)}-${String(n + 1).padStart(2, "0")}`,
  codigoBarras: null,
  precio: 0,
  precioOferta: null,
  costo: 0,
  stock: 0,
  stockMinimo: 3,
  activo: true,
});

function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow-suave sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-berry">{titulo}</h2>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children}
    </section>
  );
}

/** Muestra el margen de ganancia de la variante mientras se escribe. */
function Margen({ control, i }: { control: Control<DatosProducto>; i: number }) {
  const [precio, oferta, costo] = useWatch({
    control,
    name: [`variantes.${i}.precio`, `variantes.${i}.precioOferta`, `variantes.${i}.costo`],
  });
  const venta = oferta ?? precio;
  if (!venta || costo === null || costo === undefined) return null;
  const ganancia = venta - costo;
  const porcentaje = Math.round((ganancia / venta) * 100);
  return (
    <p className={cn("text-xs font-medium", ganancia > 0 ? "text-green-700" : "text-destructive")}>
      Ganancia por unidad: {formatoCOP(ganancia)} ({porcentaje}%)
    </p>
  );
}

export function FormularioProducto({
  producto,
  categorias,
  marcas,
}: {
  producto?: DatosProducto & { id: string };
  categorias: Opcion[];
  marcas: Opcion[];
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [slugManual, setSlugManual] = useState(Boolean(producto));
  const esNuevo = !producto;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DatosProducto>({
    resolver: zodResolver(esquemaProducto),
    defaultValues: producto ?? {
      nombre: "",
      slug: "",
      descripcion: "",
      modoUso: null,
      categoriaId: "",
      marcaId: null,
      esNuevo: true,
      destacado: false,
      activo: true,
      imagenes: [],
      variantes: [varianteVacia(0)],
    },
  });

  const imagenes = useFieldArray({ control, name: "imagenes" });
  const variantes = useFieldArray({ control, name: "variantes", keyName: "clave" });
  const urls = useWatch({ control, name: "imagenes" });

  const registroNombre = register("nombre", {
    onChange: (e) => {
      if (!slugManual) setValue("slug", slugify(e.target.value), { shouldValidate: false });
    },
  });

  const enviar = handleSubmit(
    (datos) =>
      iniciar(async () => {
        const r = await guardarProducto(producto?.id ?? null, datos);
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        toast.success(r.mensaje);
        router.push("/admin/productos");
        router.refresh();
      }),
    () => toast.error("Revisa los campos marcados en rojo"),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-6 pb-24">
      <Seccion titulo="Información básica">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Nombre del producto" registro={registroNombre} error={errors.nombre?.message} />
          <CampoTexto
            etiqueta="Slug (dirección web)"
            ayuda="Se usa en la URL: /productos/labial-mate"
            registro={register("slug", { onChange: () => setSlugManual(true) })}
            error={errors.slug?.message}
          />
          <CampoSelect
            etiqueta="Categoría"
            vacio="Elige una categoría"
            opciones={categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
            registro={register("categoriaId")}
            error={errors.categoriaId?.message}
          />
          <CampoSelect
            etiqueta="Marca"
            vacio="Sin marca"
            opciones={marcas.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
            registro={register("marcaId", { setValueAs: aTextoONulo })}
            error={errors.marcaId?.message}
          />
        </div>
        <CampoArea etiqueta="Descripción" rows={4} registro={register("descripcion")} error={errors.descripcion?.message} />
        <CampoArea
          etiqueta="Modo de uso (opcional)"
          rows={3}
          registro={register("modoUso", { setValueAs: aTextoONulo })}
          error={errors.modoUso?.message}
        />
      </Seccion>

      <Seccion titulo="Etiquetas y visibilidad" descripcion="La etiqueta “Oferta” aparece sola cuando una variante tiene precio de oferta.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Controller
            control={control}
            name="esNuevo"
            render={({ field }) => (
              <CampoInterruptor etiqueta="Nuevo" descripcion="Aparece en Novedades" valor={field.value} alCambiar={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="destacado"
            render={({ field }) => (
              <CampoInterruptor etiqueta="Más vendido" descripcion="Aparece en el inicio" valor={field.value} alCambiar={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="activo"
            render={({ field }) => (
              <CampoInterruptor etiqueta="Activo" descripcion="Visible en la tienda" valor={field.value} alCambiar={field.onChange} />
            )}
          />
        </div>
      </Seccion>

      <Seccion titulo="Imágenes" descripcion="La primera imagen es la principal. Usa las flechas para cambiar el orden.">
        {imagenes.fields.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {imagenes.fields.map((campo, i) => (
              <li key={campo.id} className="space-y-2 rounded-2xl border border-border p-2">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-nude">
                  {urls?.[i]?.url && (
                    <Image src={urls[i].url} alt={urls[i].alt ?? ""} fill sizes="200px" className="object-cover" />
                  )}
                  {i === 0 && (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-primary px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                      Principal
                    </span>
                  )}
                </div>
                <input
                  {...register(`imagenes.${i}.alt`, { setValueAs: aTextoONulo })}
                  placeholder="Descripción (para accesibilidad)"
                  aria-label={`Descripción de la imagen ${i + 1}`}
                  className="h-8 w-full rounded-lg border border-input px-2 text-xs"
                />
                <div className="flex justify-between">
                  <Button type="button" size="icon-sm" variant="ghost" aria-label="Mover antes" disabled={i === 0} onClick={() => imagenes.move(i, i - 1)}>
                    <ArrowUp className="-rotate-90" aria-hidden />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Mover después"
                    disabled={i === imagenes.fields.length - 1}
                    onClick={() => imagenes.move(i, i + 1)}
                  >
                    <ArrowDown className="-rotate-90" aria-hidden />
                  </Button>
                  <Button type="button" size="icon-sm" variant="destructive" aria-label="Quitar imagen" onClick={() => imagenes.remove(i)}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {errors.imagenes?.message && <p className="text-xs text-destructive">{errors.imagenes.message}</p>}
        {imagenes.fields.length < 10 && (
          <SubirImagen maximo={10 - imagenes.fields.length} alSubir={(url) => imagenes.append({ url, alt: null })} />
        )}
      </Seccion>

      <Seccion titulo="Variantes (tonos)" descripcion="Cada tono o presentación tiene su propio SKU, precio y stock.">
        <ul className="space-y-4">
          {variantes.fields.map((campo, i) => {
            const e = errors.variantes?.[i];
            const existente = Boolean(campo.id);
            return (
              <li key={campo.clave} className="space-y-4 rounded-2xl border border-border bg-nude/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-berry">Variante {i + 1}</h3>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={variantes.fields.length === 1}
                    onClick={() => variantes.remove(i)}
                  >
                    <Trash2 aria-hidden /> Quitar
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <CampoTexto etiqueta="Tono / nombre" placeholder="Tono 03 - Rosa Nude" registro={register(`variantes.${i}.nombre`)} error={e?.nombre?.message} />
                  <Controller
                    control={control}
                    name={`variantes.${i}.colorHex`}
                    render={({ field }) => <CampoColor valor={field.value} alCambiar={field.onChange} error={e?.colorHex?.message} />}
                  />
                  <CampoTexto etiqueta="SKU" registro={register(`variantes.${i}.sku`)} error={e?.sku?.message} />
                  <CampoTexto
                    etiqueta="Código de barras"
                    inputMode="numeric"
                    placeholder="Opcional"
                    registro={register(`variantes.${i}.codigoBarras`, { setValueAs: aTextoONulo })}
                    error={e?.codigoBarras?.message}
                  />
                  <CampoTexto
                    etiqueta="Precio de venta"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    registro={register(`variantes.${i}.precio`, { setValueAs: aNumeroONulo })}
                    error={e?.precio?.message}
                  />
                  <CampoTexto
                    etiqueta="Precio de oferta"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Opcional"
                    registro={register(`variantes.${i}.precioOferta`, { setValueAs: aNumeroONulo })}
                    error={e?.precioOferta?.message}
                  />
                  <CampoTexto
                    etiqueta="Costo"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    ayuda="Lo que te cuesta a ti"
                    registro={register(`variantes.${i}.costo`, { setValueAs: aNumeroONulo })}
                    error={e?.costo?.message}
                  />
                  <CampoTexto
                    etiqueta="Stock mínimo"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    ayuda="Alerta cuando quede esto o menos"
                    registro={register(`variantes.${i}.stockMinimo`, { setValueAs: aNumeroONulo })}
                    error={e?.stockMinimo?.message}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="w-full sm:max-w-56">
                    {existente ? (
                      <p className="rounded-xl bg-white p-3 text-sm">
                        Stock actual: <strong>{campo.stock}</strong>
                        <br />
                        <Link href="/admin/inventario" className="text-xs font-medium text-primary hover:underline">
                          Cámbialo desde Inventario →
                        </Link>
                      </p>
                    ) : (
                      <CampoTexto
                        etiqueta="Stock inicial"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        registro={register(`variantes.${i}.stock`, { setValueAs: aNumeroONulo })}
                        error={e?.stock?.message}
                      />
                    )}
                  </div>
                  <Margen control={control} i={i} />
                  <Controller
                    control={control}
                    name={`variantes.${i}.activo`}
                    render={({ field }) => <CampoInterruptor etiqueta="Variante activa" valor={field.value} alCambiar={field.onChange} />}
                  />
                </div>
              </li>
            );
          })}
        </ul>
        {(errors.variantes?.message || errors.variantes?.root?.message) && (
          <p role="alert" className="text-sm text-destructive">
            {errors.variantes?.message ?? errors.variantes?.root?.message}
          </p>
        )}
        <Button type="button" variant="outline" onClick={() => variantes.append(varianteVacia(variantes.fields.length))}>
          <Plus aria-hidden /> Agregar variante
        </Button>
      </Seccion>

      {/* Barra fija para guardar siempre a la mano, también en el celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-1 sm:px-4">
          <Link href="/admin/productos" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Cancelar
          </Link>
          <Button type="submit" variant="glow" size="lg" disabled={pendiente}>
            {pendiente && <LoaderCircle className="animate-spin" aria-hidden />}
            {esNuevo ? "Crear producto" : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}
