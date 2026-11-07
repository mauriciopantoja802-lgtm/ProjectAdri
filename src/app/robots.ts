import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Páginas privadas o sin valor para buscadores
      disallow: ["/admin", "/api/", "/checkout", "/carrito", "/cuenta", "/pedido/", "/login", "/registro"],
    },
    sitemap: `${sitio}/sitemap.xml`,
    host: sitio,
  };
}
