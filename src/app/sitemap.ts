import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

/** sitemap.xml: páginas públicas, categorías y productos activos (para que Google los encuentre). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const estaticas: MetadataRoute.Sitemap = [
    { url: `${sitio}/`, changeFrequency: "daily", priority: 1 },
    { url: `${sitio}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${sitio}/sobre-adri`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${sitio}/contacto`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${sitio}/envios-y-devoluciones`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${sitio}/terminos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${sitio}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const [categorias, productos] = await Promise.all([
      prisma.categoria.findMany({ select: { slug: true } }),
      prisma.producto.findMany({ where: { activo: true }, select: { slug: true, actualizado: true } }),
    ]);
    return [
      ...estaticas,
      ...categorias.map((c) => ({ url: `${sitio}/categoria/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...productos.map((p) => ({ url: `${sitio}/productos/${p.slug}`, lastModified: p.actualizado, changeFrequency: "weekly" as const, priority: 0.7 })),
    ];
  } catch {
    return estaticas; // si la BD no responde, al menos las páginas fijas
  }
}
