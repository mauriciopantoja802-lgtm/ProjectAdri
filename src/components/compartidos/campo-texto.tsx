"use client";

import { useId, useState, type ComponentProps } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CampoTextoProps extends Omit<ComponentProps<"input">, "id"> {
  etiqueta: string;
  registro: UseFormRegisterReturn;
  error?: string;
  ayuda?: string;
}

/**
 * Campo de formulario reutilizable: etiqueta + input + ayuda + error.
 * Conecta la etiqueta y los mensajes al input (htmlFor, aria-describedby, aria-invalid)
 * para que los lectores de pantalla los anuncien.
 * Con type="password" agrega el botón para mostrar u ocultar la contraseña.
 */
export function CampoTexto({ etiqueta, registro, error, ayuda, type = "text", className, ...props }: CampoTextoProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const esClave = type === "password";
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="relative">
        <Input
          id={id}
          type={esClave && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={[idAyuda, idError].filter(Boolean).join(" ") || undefined}
          className={cn(esClave && "pr-11", className)}
          {...props}
          {...registro}
        />
        {esClave && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
          </button>
        )}
      </div>
      {ayuda && !error && (
        <p id={idAyuda} className="text-xs text-muted-foreground">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
