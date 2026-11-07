"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EstadoPedido } from "@prisma/client";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claseSelect } from "@/components/compartidos/campos";
import { BotonConfirmar } from "@/components/compartidos/boton-confirmar";
import { cambiarEstadoPedido } from "@/features/pedidos/actions";
import { ESTADO_PEDIDO } from "@/lib/etiquetas";

export function CambiarEstado({ pedidoId, opciones, stockDescontado }: { pedidoId: string; opciones: EstadoPedido[]; stockDescontado: boolean }) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoPedido | "">(opciones.find((o) => o !== "CANCELADO") ?? "");
  const [nota, setNota] = useState("");
  const [pendiente, iniciar] = useTransition();

  if (!opciones.length) return <p className="text-sm text-muted-foreground">Este pedido ya no admite cambios de estado.</p>;

  const enviar = (e: EstadoPedido) =>
    iniciar(async () => {
      const r = await cambiarEstadoPedido({ pedidoId, estado: e, nota: nota.trim() || null });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`${r.mensaje}: ${ESTADO_PEDIDO[r.datos.estado].etiqueta}`);
      setNota("");
      router.refresh();
    });

  const avanzar = opciones.filter((o) => o !== "CANCELADO");
  return (
    <div className="space-y-3">
      {avanzar.length > 0 && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="nuevo-estado">Nuevo estado</Label>
            <select id="nuevo-estado" className={claseSelect} value={estado} onChange={(e) => setEstado(e.target.value as EstadoPedido)}>
              {avanzar.map((o) => (
                <option key={o} value={o}>
                  {ESTADO_PEDIDO[o].etiqueta}
                </option>
              ))}
            </select>
          </div>
          <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Nota (opcional), ej: guía Servientrega 123" aria-label="Nota del cambio" />
          {!stockDescontado && (
            <p className="text-xs text-muted-foreground">Al confirmar este pedido se descontará el stock de los productos.</p>
          )}
          <Button variant="glow" className="w-full" disabled={pendiente || !estado} onClick={() => estado && enviar(estado)}>
            {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Actualizar estado
          </Button>
        </>
      )}
      {opciones.includes("CANCELADO") && (
        <BotonConfirmar
          disparador={
            <Button variant="destructive" className="w-full" disabled={pendiente}>
              Cancelar pedido
            </Button>
          }
          titulo="¿Cancelar este pedido?"
          descripcion={
            stockDescontado
              ? "El stock de los productos se devolverá al inventario automáticamente."
              : "El pedido quedará cancelado. No se había descontado stock."
          }
          textoConfirmar="Sí, cancelar"
          accion={async () => {
            const r = await cambiarEstadoPedido({ pedidoId, estado: "CANCELADO", nota: nota.trim() || null });
            return r.ok ? { ok: true, mensaje: "Pedido cancelado" } : r;
          }}
          alTerminar={() => router.refresh()}
        />
      )}
    </div>
  );
}
