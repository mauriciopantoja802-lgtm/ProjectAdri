"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { normalizarNumeroWhatsapp } from "@/features/whatsapp/enlaces";
import { ipCliente, verificarLimite } from "@/lib/limite";
import { esquemaLogin, esquemaRegistro } from "./schemas";
import { destinoTrasLogin, rutaSegura } from "./rutas";

export type ResultadoAuth = {
  error: string;
  campo?: "email" | "telefono" | "password";
};

const ERROR_GENERICO = "No pudimos completar la solicitud. Intenta de nuevo en unos minutos.";

/** Inicia sesión con correo y contraseña y redirige según el rol. */
export async function iniciarSesion(datos: unknown, callbackUrl?: string): Promise<ResultadoAuth | void> {
  // Validamos otra vez en el servidor: lo que llega del navegador no es confiable.
  const validacion = esquemaLogin.safeParse(datos);
  if (!validacion.success) return { error: "Revisa el correo y la contraseña" };
  const { email, password } = validacion.data;

  try {
    const url = await signIn("credentials", { email, password, redirect: false });
    if (typeof url === "string" && url.includes("error=")) {
      return { error: "Correo o contraseña incorrectos" };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      if ((error as { code?: string }).code === "limite") {
        return { error: "Demasiados intentos. Espera 15 minutos o recupera tu acceso escribiéndonos por WhatsApp." };
      }
      return { error: error.type === "CredentialsSignin" ? "Correo o contraseña incorrectos" : ERROR_GENERICO };
    }
    throw error;
  }

  const usuario = await prisma.usuario.findUnique({ where: { email }, select: { rol: true } });
  redirect(destinoTrasLogin(usuario?.rol, callbackUrl));
}

/**
 * Crea una cuenta de clienta (rol CLIENTE) y entra de una vez.
 *
 * Si ya existe una Clienta con ese celular (porque compró antes por WhatsApp o en la tienda),
 * se vincula a la nueva cuenta SOLO si el correo coincide con el que Adri tiene registrado.
 * Si no coincide, no la vinculamos: cualquiera que conozca un número ajeno podría ver
 * el historial de compras de esa persona (protección de datos, Ley 1581 de 2012).
 */
export async function registrarse(datos: unknown, callbackUrl?: string): Promise<ResultadoAuth | void> {
  try {
    verificarLimite(`registro:${await ipCliente()}`, 5, 60 * 60 * 1000); // 5 cuentas por hora por IP
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERROR_GENERICO };
  }
  const validacion = esquemaRegistro.safeParse(datos);
  if (!validacion.success) {
    return { error: validacion.error.issues[0]?.message ?? "Revisa los datos del formulario" };
  }
  const { nombre, email, password } = validacion.data;
  const telefono = normalizarNumeroWhatsapp(validacion.data.telefono);

  const usuarioExistente = await prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  if (usuarioExistente) {
    return { error: "Ya existe una cuenta con este correo. ¿Quieres iniciar sesión?", campo: "email" };
  }

  const clienta = await prisma.clienta.findUnique({ where: { telefono } });
  if (clienta?.usuarioId) {
    return { error: "Este celular ya está registrado en otra cuenta", campo: "telefono" };
  }
  if (clienta && clienta.email?.toLowerCase() !== email) {
    return {
      error:
        "Este celular ya está en nuestros registros de compras. Escríbenos por WhatsApp para vincularlo a tu cuenta de forma segura.",
      campo: "telefono",
    };
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: { nombre, email, password: hash, telefono, rol: "CLIENTE" },
      });
      if (clienta) {
        await tx.clienta.update({ where: { id: clienta.id }, data: { usuarioId: usuario.id } });
      } else {
        await tx.clienta.create({ data: { nombre, telefono, email, usuarioId: usuario.id } });
      }
    });
  } catch (error) {
    // P2002 = valor único repetido (dos registros simultáneos con el mismo correo o celular)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Ese correo o celular ya está registrado" };
    }
    throw error;
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    // La cuenta quedó creada; si el inicio automático falla, que entre manualmente.
    if (error instanceof AuthError) redirect("/login?registro=ok");
    throw error;
  }

  const destino = rutaSegura(callbackUrl, "/cuenta");
  redirect(destino.startsWith("/admin") ? "/cuenta" : destino);
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
