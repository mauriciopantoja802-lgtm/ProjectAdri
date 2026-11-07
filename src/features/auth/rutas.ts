import type { Rol } from "@prisma/client";

/**
 * Convierte el callbackUrl en una ruta interna segura.
 * Solo se conserva la ruta (ej: "/admin/pedidos?estado=PENDIENTE"); el dominio se descarta.
 * Así nadie puede usar un enlace de login como trampolín a otra página
 * (por ejemplo /login?callbackUrl=https://sitio-falso.com).
 */
export function rutaSegura(destino: string | null | undefined, porDefecto: string): string {
  if (!destino) return porDefecto;
  try {
    const url = new URL(destino, "http://interno.local");
    const ruta = `${url.pathname}${url.search}${url.hash}`;
    // "//otro-sitio.com" sería interpretado por el navegador como otro dominio
    if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\")) return porDefecto;
    if (ruta.startsWith("/api") || ruta === "/login" || ruta === "/registro") return porDefecto;
    return ruta;
  } catch {
    return porDefecto;
  }
}

/** A dónde ir después de iniciar sesión, según el rol. */
export function destinoTrasLogin(rol: Rol | undefined, callbackUrl?: string | null): string {
  if (rol === "ADMIN") {
    const ruta = rutaSegura(callbackUrl, "/admin");
    return ruta.startsWith("/admin") ? ruta : "/admin";
  }
  const ruta = rutaSegura(callbackUrl, "/cuenta");
  return ruta.startsWith("/admin") ? "/cuenta" : ruta;
}
