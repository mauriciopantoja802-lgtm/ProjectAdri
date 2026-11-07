/**
 * Generación de enlaces wa.me. Funciona en cliente y servidor.
 * Los mensajes de pedidos y las plantillas se agregan en la Fase 7.
 */

/** Deja solo los dígitos y agrega el indicativo 57 si falta (números de 10 dígitos). */
export function normalizarNumeroWhatsapp(numero: string): string {
  const digitos = numero.replace(/\D/g, "");
  return digitos.length === 10 ? `57${digitos}` : digitos;
}

/** Arma https://wa.me/<número>?text=<mensaje> con el texto codificado. */
export function crearEnlaceWhatsapp(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${normalizarNumeroWhatsapp(numero)}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
