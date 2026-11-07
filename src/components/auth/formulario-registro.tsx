"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { AlertaError } from "@/components/auth/alerta-error";
import { esquemaRegistro, type DatosRegistro } from "@/features/auth/schemas";
import { registrarse } from "@/features/auth/actions";

export function FormularioRegistro({ callbackUrl }: { callbackUrl?: string }) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DatosRegistro>({
    resolver: zodResolver(esquemaRegistro),
    defaultValues: { nombre: "", email: "", telefono: "", password: "", confirmar: "", aceptaDatos: false },
  });

  const enviar = handleSubmit((datos) => {
    setErrorGeneral(null);
    iniciarTransicion(async () => {
      const resultado = await registrarse(datos, callbackUrl);
      if (!resultado?.error) return; // éxito: la acción ya redirigió
      if (resultado.campo) {
        setError(resultado.campo, { message: resultado.error }, { shouldFocus: true });
      } else {
        setErrorGeneral(resultado.error);
      }
      toast.error(resultado.error);
    });
  });

  return (
    <form onSubmit={enviar} noValidate className="space-y-4">
      {errorGeneral && <AlertaError mensaje={errorGeneral} />}

      <CampoTexto
        etiqueta="Nombre completo"
        autoComplete="name"
        placeholder="Ej: Valentina Muñoz"
        registro={register("nombre")}
        error={errors.nombre?.message}
      />
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
        etiqueta="Celular (WhatsApp)"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="300 123 4567"
        ayuda="Te escribiremos por WhatsApp sobre tus pedidos."
        registro={register("telefono")}
        error={errors.telefono?.message}
      />
      <CampoTexto
        etiqueta="Contraseña"
        type="password"
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
        registro={register("password")}
        error={errors.password?.message}
      />
      <CampoTexto
        etiqueta="Repite la contraseña"
        type="password"
        autoComplete="new-password"
        registro={register("confirmar")}
        error={errors.confirmar?.message}
      />

      <div className="space-y-1.5">
        <Controller
          control={control}
          name="aceptaDatos"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
              <Checkbox
                checked={field.value}
                onCheckedChange={(valor) => field.onChange(valor === true)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                aria-invalid={errors.aceptaDatos ? true : undefined}
                className="mt-0.5"
              />
              <span>
                Autorizo el tratamiento de mis datos personales según la{" "}
                <Link href="/privacidad" target="_blank" className="font-medium text-primary underline">
                  Política de privacidad
                </Link>{" "}
                (Ley 1581 de 2012).
              </span>
            </label>
          )}
        />
        {errors.aceptaDatos && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.aceptaDatos.message}
          </p>
        )}
      </div>

      <Button type="submit" variant="glow" size="lg" className="w-full" disabled={pendiente}>
        {pendiente ? (
          <>
            <LoaderCircle className="animate-spin" aria-hidden /> Creando tu cuenta…
          </>
        ) : (
          "Crear mi cuenta"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login"}
          className="font-semibold text-primary hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
