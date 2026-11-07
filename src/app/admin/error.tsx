"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorAdmin({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center shadow-suave">
      <TriangleAlert className="size-10 text-destructive" aria-hidden />
      <h1 className="text-2xl font-bold text-berry">Algo salió mal</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        No pudimos cargar esta sección. Revisa tu conexión a internet e intenta de nuevo.
      </p>
      <Button onClick={reset} variant="glow">
        <RotateCcw aria-hidden /> Reintentar
      </Button>
    </div>
  );
}
