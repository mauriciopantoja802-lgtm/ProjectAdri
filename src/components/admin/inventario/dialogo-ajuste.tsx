"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoSelect } from "@/components/compartidos/campos";
import { esquemaAjuste, MOTIVOS_AJUSTE, TIPOS_AJUSTE, type DatosAjuste } from "@/features/inventario/schemas";
import { registrarAjuste } from "@/features/inventario/actions";
import { TIPO_MOVIMIENTO } from "@/lib/etiquetas";
import { aNumeroONulo, aTextoONulo } from "@/lib/formularios";

export function DialogoAjuste({ varianteId, nombre, stock }: { varianteId: string; nombre: string; stock: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const vacio: DatosAjuste = { varianteId, tipo: "AJUSTE_NEGATIVO", cantidad: 1, motivo: "", detalle: null };
  const { register, handleSubmit, control, reset, setValue, formState } = useForm<DatosAjuste>({
    resolver: zodResolver(esquemaAjuste),
    defaultValues: vacio,
  });
  const [tipo, cantidad] = useWatch({ control, name: ["tipo", "cantidad"] });
  const resultado = stock + (tipo === "AJUSTE_NEGATIVO" ? -1 : 1) * (Number(cantidad) || 0);
  const e = formState.errors;

  const enviar = handleSubmit((d) =>
    iniciar(async () => {
      const r = await registrarAjuste(d);
      if (!r.ok) return void toast.error(r.error);
      toast.success(`${r.mensaje}. Nuevo stock: ${r.datos.stock}`);
      setAbierto(false);
      reset(vacio);
      router.refresh();
    }),
  );

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontal aria-hidden /> Ajustar
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={enviar} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Ajustar inventario</DialogTitle>
            <DialogDescription>
              {nombre} · Stock actual: <strong>{stock}</strong>
            </DialogDescription>
          </DialogHeader>
          <CampoSelect
            etiqueta="Tipo de movimiento"
            opciones={TIPOS_AJUSTE.map((t) => ({ valor: t, etiqueta: TIPO_MOVIMIENTO[t].etiqueta }))}
            registro={register("tipo", { onChange: () => setValue("motivo", "") })}
            error={e.tipo?.message}
          />
          <CampoTexto
            etiqueta="Cantidad (unidades)"
            type="number"
            min={1}
            inputMode="numeric"
            registro={register("cantidad", { setValueAs: aNumeroONulo })}
            error={e.cantidad?.message}
          />
          <CampoSelect
            etiqueta="Motivo"
            vacio="Elige un motivo"
            opciones={(MOTIVOS_AJUSTE[tipo] ?? []).map((m) => ({ valor: m, etiqueta: m }))}
            registro={register("motivo")}
            error={e.motivo?.message}
          />
          <CampoTexto
            etiqueta="Detalle (opcional)"
            placeholder="Ej: el empaque llegó roto"
            registro={register("detalle", { setValueAs: aTextoONulo })}
            error={e.detalle?.message}
          />
          <p className={`rounded-xl p-3 text-sm ${resultado < 0 ? "bg-red-50 text-destructive" : "bg-nude"}`}>
            Stock después del movimiento: <strong>{resultado}</strong>
            {resultado < 0 && " — no puede quedar negativo"}
          </p>
          <DialogFooter>
            <Button type="submit" variant="glow" disabled={pendiente || resultado < 0}>
              {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
