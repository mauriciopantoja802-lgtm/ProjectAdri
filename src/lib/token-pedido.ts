import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Los códigos de pedido son consecutivos (GA-0001, GA-0002…) y fáciles de adivinar.
 * Para que nadie pueda ver el nombre o la dirección de otra clienta cambiando el número en la URL,
 * la página de seguimiento exige un token firmado con AUTH_SECRET.
 */
function firmar(codigo: string) {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta AUTH_SECRET");
  return createHmac("sha256", secreto).update(`pedido:${codigo}`).digest("base64url").slice(0, 22);
}

export function tokenPedido(codigo: string) {
  return firmar(codigo);
}

export function verificarTokenPedido(codigo: string, token: string | undefined | null) {
  if (!token) return false;
  const esperado = Buffer.from(firmar(codigo));
  const recibido = Buffer.from(token);
  return esperado.length === recibido.length && timingSafeEqual(esperado, recibido);
}

export function urlSeguimiento(codigo: string) {
  return `/pedido/${codigo}?t=${tokenPedido(codigo)}`;
}
