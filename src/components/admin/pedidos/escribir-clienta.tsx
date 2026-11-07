"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { claseSelect } from "@/components/compartidos/campos";
import { cn } from "@/lib/utils";

interface Mensaje {
  clave: string;
  etiqueta: string;
  texto: string;
  url: string | null;
}

/** "Escribir a la clienta por WhatsApp": elige la plantilla (sugerida según el estado) y abre wa.me. */
export function EscribirClienta({ mensajes, sugerida }: { mensajes: Mensaje[]; sugerida: string | null }) {
  const [clave, setClave] = useState(sugerida ?? mensajes[0]?.clave ?? "");
  const actual = mensajes.find((m) => m.clave === clave);
  if (!mensajes.length) return <p className="text-sm text-muted-foreground">Configura las plantillas en Configuración.</p>;
  if (!mensajes[0].url) return <p className="text-sm text-muted-foreground">Este pedido no tiene celular registrado.</p>;

  return (
    <div className="space-y-3">
      <select aria-label="Plantilla de mensaje" className={claseSelect} value={clave} onChange={(e) => setClave(e.target.value)}>
        {mensajes.map((m) => (
          <option key={m.clave} value={m.clave}>
            {m.etiqueta}
            {m.clave === sugerida ? " (sugerida)" : ""}
          </option>
        ))}
      </select>
      {actual && <p className="rounded-2xl bg-[#e7fbe9] p-3 text-sm whitespace-pre-line text-zinc-800">{actual.texto}</p>}
      {actual?.url && (
        <a href={actual.url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "whatsapp" }), "w-full")}>
          <MessageCircle aria-hidden /> Escribir a la clienta por WhatsApp
        </a>
      )}
    </div>
  );
}
