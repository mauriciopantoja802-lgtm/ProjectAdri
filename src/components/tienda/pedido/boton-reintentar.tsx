"use client";

import { useTransition } from "react";
import { CreditCard, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reintentarPago } from "@/features/pagos/actions";

export function BotonReintentarPago({ codigo, token }: { codigo: string; token: string }) {
  const [pendiente, iniciar] = useTransition();
  return (
    <Button
      variant="glow"
      size="lg"
      disabled={pendiente}
      onClick={() =>
        iniciar(async () => {
          const r = await reintentarPago(codigo, token);
          if (!r.ok) return void toast.error(r.error);
          window.location.href = r.datos.url;
        })
      }
    >
      {pendiente ? <LoaderCircle className="animate-spin" aria-hidden /> : <CreditCard aria-hidden />} Pagar ahora
    </Button>
  );
}
