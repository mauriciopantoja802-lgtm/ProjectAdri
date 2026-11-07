"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoArea } from "@/components/compartidos/campos";
import { esquemaCierre, type DatosCierre } from "@/features/pos/schemas";
import { registrarCierre } from "@/features/pos/actions";
import { aNumeroONulo, aTextoONulo } from "@/lib/formularios";
import { formatoCOP } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function FormularioCierre({ dia, efectivoVentas }: { dia: string; efectivoVentas: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const { register, handleSubmit, control, reset, formState } = useForm<DatosCierre>({
    resolver: zodResolver(esquemaCierre),
    defaultValues: { dia, baseInicial: 0, efectivoContado: 0, notas: null },
  });
  const [base, contado] = useWatch({ control, name: ["baseInicial", "efectivoContado"] });
  const esperado = (Number(base) || 0) + efectivoVentas;
  const diferencia = (Number(contado) || 0) - esperado;

  const enviar = handleSubmit((d) =>
    iniciar(async () => {
      const r = await registrarCierre(d);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.mensaje);
      reset({ dia, baseInicial: 0, efectivoContado: 0, notas: null });
      router.refresh();
    }),
  );

  return (
    <form onSubmit={enviar} noValidate className="space-y-4 rounded-3xl bg-white p-5 shadow-suave">
      <h2 className="text-lg font-semibold text-berry">Cerrar caja</h2>
      <CampoTexto
        etiqueta="Base inicial (con la que abriste)"
        type="number"
        min={0}
        inputMode="numeric"
        registro={register("baseInicial", { setValueAs: aNumeroONulo })}
        error={formState.errors.baseInicial?.message}
      />
      <dl className="space-y-1 rounded-2xl bg-nude p-3 text-sm">
        <div className="flex justify-between">
          <dt>Ventas en efectivo</dt>
          <dd className="tabular-nums">{formatoCOP(efectivoVentas)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Efectivo esperado en caja</dt>
          <dd className="tabular-nums">{formatoCOP(esperado)}</dd>
        </div>
      </dl>
      <CampoTexto
        etiqueta="Efectivo contado"
        type="number"
        min={0}
        inputMode="numeric"
        registro={register("efectivoContado", { setValueAs: aNumeroONulo })}
        error={formState.errors.efectivoContado?.message}
      />
      <p
        className={cn(
          "flex justify-between rounded-2xl p-3 text-sm font-semibold",
          diferencia === 0 ? "bg-green-50 text-green-800" : diferencia > 0 ? "bg-sky-50 text-sky-800" : "bg-red-50 text-destructive",
        )}
      >
        <span>{diferencia === 0 ? "Cuadra perfecto ✓" : diferencia > 0 ? "Sobrante" : "Faltante"}</span>
        <span className="text-lg tabular-nums">{formatoCOP(diferencia)}</span>
      </p>
      <CampoArea etiqueta="Notas (opcional)" rows={2} registro={register("notas", { setValueAs: aTextoONulo })} />
      <Button type="submit" variant="glow" className="w-full" disabled={pendiente}>
        {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Guardar cierre
      </Button>
    </form>
  );
}
