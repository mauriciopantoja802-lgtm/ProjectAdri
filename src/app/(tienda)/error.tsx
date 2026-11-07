"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorTienda({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-berry">Ups, algo salió mal 😔</h1>
      <p className="text-muted-foreground">Intenta de nuevo en unos segundos. Si el problema sigue, escríbenos por WhatsApp.</p>
      <Button variant="glow" onClick={reset}>
        <RotateCcw aria-hidden /> Reintentar
      </Button>
    </div>
  );
}
