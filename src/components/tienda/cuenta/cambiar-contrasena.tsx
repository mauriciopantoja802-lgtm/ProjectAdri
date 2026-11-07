"use client";

import { useState, useTransition } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cambiarContrasena } from "@/features/cuenta/actions";

export function CambiarContrasena() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [pendiente, iniciar] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        iniciar(async () => {
          const r = await cambiarContrasena({ actual, nueva });
          if (!r.ok) return void toast.error(r.error);
          toast.success(r.mensaje);
          setActual("");
          setNueva("");
        });
      }}
    >
      <h2 className="flex items-center gap-2 text-xl font-semibold text-berry">
        <KeyRound className="size-5 text-primary" aria-hidden /> Cambiar contraseña
      </h2>
      <div className="space-y-1.5">
        <Label htmlFor="clave-actual">Contraseña actual</Label>
        <Input id="clave-actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="clave-nueva">Nueva contraseña</Label>
        <Input id="clave-nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} aria-describedby="clave-ayuda" />
        <p id="clave-ayuda" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con letras y números.
        </p>
      </div>
      <Button type="submit" variant="outline" disabled={pendiente || !actual || !nueva}>
        {pendiente && <LoaderCircle className="animate-spin" aria-hidden />} Actualizar contraseña
      </Button>
    </form>
  );
}
