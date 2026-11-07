import type { ConfiguracionTienda } from "@prisma/client";

/**
 * Datos estructurados del negocio local para Google (búsquedas tipo "maquillaje en Popayán").
 * Nota: "BeautySupplyStore" no es un tipo válido de schema.org (es una categoría de Google Business);
 * se usan HealthAndBeautyBusiness + Store, que sí lo son y heredan de LocalBusiness.
 */
export function JsonLdNegocio({ config }: { config: ConfiguracionTienda }) {
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const datos = {
    "@context": "https://schema.org",
    "@type": ["HealthAndBeautyBusiness", "Store"],
    "@id": `${sitio}/#tienda`,
    name: config.nombre,
    description: "Tienda de maquillaje y skincare con asesoría personalizada en Popayán, Cauca.",
    url: sitio,
    image: `${sitio}/opengraph-image`,
    logo: `${sitio}/icon`,
    telephone: `+${config.whatsapp}`,
    priceRange: "$$",
    currenciesAccepted: "COP",
    paymentAccepted: "Efectivo, Tarjeta, Transferencia, Nequi, Daviplata",
    address: {
      "@type": "PostalAddress",
      streetAddress: config.direccion,
      addressLocality: config.ciudad,
      addressRegion: "Cauca",
      addressCountry: "CO",
    },
    areaServed: [{ "@type": "City", name: config.ciudad }, { "@type": "Country", name: "Colombia" }],
    openingHours: config.horario,
    sameAs: [
      config.instagram && `https://instagram.com/${config.instagram.replace(/^@/, "")}`,
      config.facebook,
      config.tiktok && `https://tiktok.com/@${config.tiktok.replace(/^@/, "")}`,
    ].filter(Boolean),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }} />;
}
