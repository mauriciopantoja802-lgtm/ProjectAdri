"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { crearPedidoWhatsappRapido } from "@/features/pedidos/tienda-actions";

type Entrega = "RECOGER_EN_TIENDA" | "DOMICILIO_POPAYAN" | "ENVIO_NACIONAL" | null;

/**
 * Guarda el pedido (canal WHATSAPP) y abre WhatsApp con el mensaje listo.
 * Los navegadores del celular bloquean ventanas abiertas después de esperar al servidor,
 * así que abrimos la pestaña al instante y le ponemos la dirección cuando el pedido ya existe.
 */
export function usePedirWhatsapp() {
  const [pendiente, iniciar] = useTransition();

  const pedir = (items: { varianteId: string; cantidad: number }[], tipoEntrega: Entrega = null, alTerminar?: () => void) => {
    const ventana = window.open("about:blank", "_blank");
    iniciar(async () => {
      const r = await crearPedidoWhatsappRapido({ items, tipoEntrega });
      if (!r.ok) {
        ventana?.close();
        toast.error(r.error);
        return;
      }
      toast.success(`Pedido ${r.datos.codigo} creado. ${r.mensaje}`);
      if (ventana) ventana.location.href = r.datos.whatsapp;
      else window.location.href = r.datos.whatsapp;
      alTerminar?.();
    });
  };

  return { pedir, pendiente };
}
