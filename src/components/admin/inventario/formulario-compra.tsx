"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, PackagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoArea, CampoInterruptor, CampoSelect } from "@/components/compartidos/campos";
import { BuscadorVariantes } from "@/components/admin/buscador-variantes";
import { esquemaCompra, type DatosCompra } from "@/features/inventario/schemas";
import { registrarCompra } from "@/features/inventario/actions";
import { aNumeroONulo, aTextoONulo } from "@/lib/formularios";
import { claveDiaBogota, formatoCOP } from "@/lib/formato";

export function FormularioCompra({ proveedores }: { proveedores: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const { register, control, handleSubmit, formState } = useForm<DatosCompra>({
    resolver: zodResolver(esquemaCompra),
    defaultValues: {
      proveedorId: proveedores.length === 1 ? proveedores[0].id : "",
      fecha: claveDiaBogota(new Date()),
      notas: null,
      actualizarCosto: true,
      items: [],
    },
  });
  const items = useFieldArray({ control, name: "items" });
  const valores = useWatch({ control, name: "items" });
  const total = (valores ?? []).reduce((t, it) => t + (Number(it.cantidad) || 0) * (Number(it.costoUnit) || 0), 0);
  const e = formState.errors;

  const enviar = handleSubmit(
    (d) =>
      iniciar(async () => {
        const r = await registrarCompra(d);
        if (!r.ok) return void toast.error(r.error);
        toast.success(r.mensaje);
        router.push(`/admin/proveedores/compras/${r.datos.id}`);
      }),
    () => toast.error("Revisa los campos marcados"),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-6">
      <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-suave sm:grid-cols-2">
        <CampoSelect
          etiqueta="Proveedor"
          vacio="Elige el proveedor"
          opciones={proveedores.map((p) => ({ valor: p.id, etiqueta: p.nombre }))}
          registro={register("proveedorId")}
          error={e.proveedorId?.message}
        />
        <CampoTexto etiqueta="Fecha de la compra" type="date" registro={register("fecha")} error={e.fecha?.message} />
        <div className="sm:col-span-2">
          <CampoArea
            etiqueta="Notas (opcional)"
            rows={2}
            placeholder="Ej: factura #1234"
            registro={register("notas", { setValueAs: aTextoONulo })}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white p-5 shadow-suave">
        <h2 className="text-lg font-semibold text-berry">Productos comprados</h2>
        <BuscadorVariantes
          mostrarCosto
          placeholder="Busca o escanea el producto que llegó…"
          alElegir={(v) => {
            const existente = valores?.findIndex((it) => it.varianteId === v.id) ?? -1;
            if (existente >= 0) {
              items.update(existente, { ...valores[existente], cantidad: (Number(valores[existente].cantidad) || 0) + 1 });
              toast.info(`+1 ${v.nombre}`);
            } else {
              items.append({ varianteId: v.id, nombre: v.nombre, cantidad: 1, costoUnit: v.costo });
            }
          }}
        />
        {items.fields.length === 0 ? (
          <p className="rounded-2xl bg-nude p-6 text-center text-sm text-muted-foreground">
            <PackagePlus className="mx-auto mb-2 size-6 text-primary" aria-hidden />
            Agrega los productos que llegaron en esta compra.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.fields.map((campo, i) => (
              <li key={campo.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 sm:grid-cols-[1fr_110px_140px_120px_auto]">
                <p className="col-span-2 text-sm font-medium sm:col-span-1">{campo.nombre}</p>
                <label className="text-xs text-muted-foreground">
                  Cantidad
                  <Input type="number" min={1} inputMode="numeric" {...register(`items.${i}.cantidad`, { setValueAs: aNumeroONulo })} />
                </label>
                <label className="text-xs text-muted-foreground">
                  Costo unitario
                  <Input type="number" min={0} inputMode="numeric" {...register(`items.${i}.costoUnit`, { setValueAs: aNumeroONulo })} />
                </label>
                <p className="text-right text-sm font-semibold">
                  {formatoCOP((Number(valores?.[i]?.cantidad) || 0) * (Number(valores?.[i]?.costoUnit) || 0))}
                </p>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Quitar ${campo.nombre}`} onClick={() => items.remove(i)}>
                  <Trash2 className="text-destructive" aria-hidden />
                </Button>
                {(e.items?.[i]?.cantidad || e.items?.[i]?.costoUnit) && (
                  <p className="col-span-full text-xs text-destructive">
                    {e.items?.[i]?.cantidad?.message ?? e.items?.[i]?.costoUnit?.message}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {e.items?.message && <p className="text-sm text-destructive">{e.items.message}</p>}
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <Controller
            control={control}
            name="actualizarCosto"
            render={({ field }) => (
              <CampoInterruptor
                etiqueta="Actualizar el costo de los productos"
                descripcion="Usa el costo de esta compra para calcular la utilidad de las próximas ventas."
                valor={field.value}
                alCambiar={field.onChange}
              />
            )}
          />
          <p className="text-right text-lg">
            Total: <strong className="text-2xl text-berry">{formatoCOP(total)}</strong>
          </p>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Link href="/admin/proveedores" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Cancelar
        </Link>
        <Button type="submit" variant="glow" size="lg" disabled={pendiente}>
          {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Registrar compra
        </Button>
      </div>
    </form>
  );
}
