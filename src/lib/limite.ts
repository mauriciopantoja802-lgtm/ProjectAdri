import "server-only";
import { headers } from "next/headers";
import { ErrorNegocio } from "@/lib/errores";

/**
 * Límite de intentos en memoria (ventana deslizante) para frenar abusos simples:
 * muchos pedidos falsos, registros masivos o adivinar contraseñas.
 * En Vercel cada instancia tiene su propia memoria, así que es una protección "de primera línea";
 * para algo más estricto se puede cambiar por Upstash Redis sin tocar quien lo usa.
 */
const ventanas = new Map<string, number[]>();

export function verificarLimite(clave: string, maximo: number, ventanaMs: number) {
  const ahora = Date.now();
  const recientes = (ventanas.get(clave) ?? []).filter((t) => ahora - t < ventanaMs);
  if (recientes.length >= maximo) {
    throw new ErrorNegocio("Demasiados intentos seguidos. Espera unos minutos e intenta de nuevo.");
  }
  recientes.push(ahora);
  ventanas.set(clave, recientes);
  // Limpieza ocasional para que el mapa no crezca sin fin
  if (ventanas.size > 5000) for (const [k, v] of ventanas) if (v.every((t) => ahora - t > ventanaMs)) ventanas.delete(k);
}

export async function ipCliente(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
