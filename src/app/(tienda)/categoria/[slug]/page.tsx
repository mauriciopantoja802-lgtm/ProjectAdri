import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { VistaCatalogo } from "@/components/tienda/catalogo/vista-catalogo";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

async function categoria(slug: string) {
  return prisma.categoria.findUnique({ where: { slug } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await categoria((await params).slug);
  if (!c) return {};
  return {
    title: `${c.nombre}: maquillaje en Popayán`,
    description: `Compra ${c.nombre.toLowerCase()} en Glow by Adri. Domicilios en Popayán y envíos a toda Colombia.`,
    alternates: { canonical: `/categoria/${c.slug}` },
  };
}

export default async function PaginaCategoria({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = await categoria(slug);
  if (!c) notFound();
  return <VistaCatalogo titulo={c.nombre} base={`/categoria/${c.slug}`} parametros={sp} categoriaFija={c.slug} />;
}
