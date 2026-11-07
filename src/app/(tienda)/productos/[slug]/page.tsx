import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck, Store, Truck } from "lucide-react";
import { Galeria } from "@/components/tienda/detalle/galeria";
import { CompraProducto } from "@/components/tienda/detalle/compra-producto";
import { FilaProductos } from "@/components/tienda/fila-productos";
import { obtenerProductoPorSlug, productosRelacionados } from "@/features/catalogo/queries";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { formatoCOP } from "@/lib/formato";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await obtenerProductoPorSlug((await params).slug);
  if (!p) return { title: "Producto no encontrado" };
  const precio = Math.min(...p.variantes.map((v) => v.precioOferta ?? v.precio));
  return {
    title: `${p.nombre}${p.marca ? ` ${p.marca.nombre}` : ""}`,
    description: `${p.descripcion.slice(0, 140)} Desde ${formatoCOP(precio)}.`,
    alternates: { canonical: `/productos/${p.slug}` },
    openGraph: { title: p.nombre, description: p.descripcion.slice(0, 160), images: p.imagenes.slice(0, 1).map((i) => ({ url: i.url })), type: "website" },
  };
}

export default async function DetalleProducto({ params }: Props) {
  const { slug } = await params;
  const p = await obtenerProductoPorSlug(slug);
  if (!p || p.variantes.length === 0) notFound();
  const [relacionados, config] = await Promise.all([productosRelacionados(p.categoria.slug, p.id), obtenerConfiguracion()]);
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // Datos estructurados para Google (resultados con precio y disponibilidad)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nombre,
    description: p.descripcion,
    image: p.imagenes.map((i) => i.url),
    sku: p.variantes[0].sku,
    brand: p.marca ? { "@type": "Brand", name: p.marca.nombre } : undefined,
    category: p.categoria.nombre,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "COP",
      lowPrice: Math.min(...p.variantes.map((v) => v.precioOferta ?? v.precio)),
      highPrice: Math.max(...p.variantes.map((v) => v.precioOferta ?? v.precio)),
      offerCount: p.variantes.length,
      availability: p.variantes.some((v) => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${sitio}/productos/${p.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <nav aria-label="Ruta de navegación" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Inicio
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/categoria/${p.categoria.slug}`} className="hover:text-primary">
            {p.categoria.nombre}
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span aria-current="page" className="text-berry">
            {p.nombre}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <Galeria imagenes={p.imagenes} nombre={p.nombre} />
          <div className="space-y-6">
            <div className="space-y-2">
              {p.marca && <p className="text-sm font-semibold tracking-wider text-dorado uppercase">{p.marca.nombre}</p>}
              <h1 className="text-3xl leading-tight font-bold text-berry sm:text-4xl">{p.nombre}</h1>
              <div className="flex flex-wrap gap-1.5">
                {p.esNuevo && <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-semibold text-berry">Nuevo</span>}
                {p.destacado && <span className="rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-berry">Más vendido</span>}
                {p.variantes.some((v) => v.precioOferta) && <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">Oferta</span>}
              </div>
            </div>

            <CompraProducto
              producto={{ nombre: p.nombre, slug: p.slug, imagen: p.imagenes[0]?.url }}
              variantes={p.variantes.map((v) => ({
                id: v.id,
                nombre: v.nombre,
                colorHex: v.colorHex,
                precio: v.precio,
                precioOferta: v.precioOferta,
                stock: Math.max(0, v.stock),
                stockMinimo: v.stockMinimo,
              }))}
            />

            <ul className="grid gap-2 rounded-3xl bg-nude p-4 text-sm">
              <li className="flex gap-2">
                <Truck className="size-4.5 shrink-0 text-primary" aria-hidden />
                Domicilio en {config.ciudad}
                {config.envioGratisDesde ? ` · gratis desde ${formatoCOP(config.envioGratisDesde)}` : ""} · Envíos a toda Colombia
              </li>
              <li className="flex gap-2">
                <Store className="size-4.5 shrink-0 text-primary" aria-hidden /> Recoge gratis en nuestra tienda
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="size-4.5 shrink-0 text-primary" aria-hidden /> Productos originales · Paga en línea o contra entrega en Popayán
              </li>
            </ul>

            <section>
              <h2 className="mb-2 text-xl font-semibold text-berry">Descripción</h2>
              <p className="leading-relaxed whitespace-pre-line">{p.descripcion}</p>
            </section>
            {p.modoUso && (
              <section>
                <h2 className="mb-2 text-xl font-semibold text-berry">Modo de uso</h2>
                <p className="leading-relaxed whitespace-pre-line">{p.modoUso}</p>
              </section>
            )}
          </div>
        </div>
      </div>
      <FilaProductos titulo="También te puede gustar" enlace={`/categoria/${p.categoria.slug}`} productos={relacionados} />
    </>
  );
}
