/**
 * Dominios desde los que se aceptan imágenes de productos y banners.
 * next.config.ts usa esta misma lista para next/image, así que no se pueden desincronizar.
 */
export const HOSTS_IMAGENES = ["res.cloudinary.com", "placehold.co"] as const;

export function esUrlImagenPermitida(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (HOSTS_IMAGENES as readonly string[]).includes(u.hostname);
  } catch {
    return false;
  }
}

export const IMAGEN_PLACEHOLDER = "https://placehold.co/800x800/FFF1F5/E91E8C/png?text=Glow+by+Adri";
