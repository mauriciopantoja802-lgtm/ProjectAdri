import "server-only";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ErrorNegocio } from "@/lib/errores";
import { ErrorNoAutorizado } from "@/lib/auth";

/**
 * Respuesta estándar de las Server Actions. El componente revisa `ok`
 * y muestra un toast con `mensaje` o `error`.
 */
export type Resultado<T = null> = { ok: true; datos: T; mensaje?: string } | { ok: false; error: string };

const NOMBRES_CAMPOS: Record<string, string> = {
  sku: "SKU",
  codigoBarras: "código de barras",
  slug: "slug (dirección web)",
  nombre: "nombre",
  email: "correo",
  telefono: "celular",
  codigo: "código",
  clave: "clave",
};

/** Traduce cualquier error a un mensaje claro en español (sin filtrar detalles técnicos). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof ErrorNegocio || error instanceof ErrorNoAutorizado) return error.message;
  if (error instanceof ZodError) return error.issues[0]?.message ?? "Revisa los datos del formulario";
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const objetivo = error.meta?.target;
      const campos = (Array.isArray(objetivo) ? objetivo : [String(objetivo ?? "")])
        .map((c) => NOMBRES_CAMPOS[c] ?? c)
        .join(", ");
      return `Ya existe un registro con ese ${campos || "valor"}. Usa uno diferente.`;
    }
    if (error.code === "P2003") return "No se puede completar: el registro está relacionado con otros datos.";
    if (error.code === "P2025") return "El registro ya no existe. Recarga la página.";
  }
  console.error("[accion] Error inesperado:", error);
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}

/** Ejecuta la lógica de una Server Action y convierte cualquier error en un Resultado. */
export async function ejecutar<T>(fn: () => Promise<T>, mensaje?: string): Promise<Resultado<T>> {
  try {
    return { ok: true, datos: await fn(), mensaje };
  } catch (error) {
    return { ok: false, error: mensajeDeError(error) };
  }
}
