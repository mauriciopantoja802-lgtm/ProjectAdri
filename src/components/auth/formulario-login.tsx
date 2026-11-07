"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { AlertaError } from "@/components/auth/alerta-error";
import { esquemaLogin, type DatosLogin } from "@/features/auth/schemas";
import { iniciarSesion } from "@/features/auth/actions";

export function FormularioLogin({ callbackUrl }: { callbackUrl?: string }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DatosLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", password: "" },
  });

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(null);
    iniciarTransicion(async () => {
      const resultado = await iniciarSesion(datos, callbackUrl);
      // Si todo sale bien, la acción redirige y no llegamos aquí.
      if (resultado?.error) {
        setErrorGeneral(resultado.error);
        toast.error(resultado.error);
      }
    });
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {errorGeneral && <AlertaError mensaje={errorGeneral} />}

      <CampoTexto
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="tucorreo@ejemplo.com"
        registro={register("email")}
        error={errors.email?.message}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        registro={register("password")}
        error={errors.password?.message}
      />

      <Button type="submit" variant="glow" size="lg" className="w-full" disabled={pendiente}>
        {pendiente ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden /> Ingresando…
          </>
        ) : (
          "Iniciar sesión"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href={callbackUrl ? `/registro?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/registro"}
          className="font-semibold text-primary hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}
