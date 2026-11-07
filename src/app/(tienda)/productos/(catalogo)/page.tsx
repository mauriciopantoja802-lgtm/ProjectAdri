import type { Metadata } from "next";
import { VistaCatalogo } from "@/components/tienda/catalogo/vista-catalogo";

export const metadata: Metadata = {
  title: "Productos de maquillaje",
  description: "Labiales, bases, sombras, cejas, uñas, skincare y accesorios. Domicilios en Popayán y envíos a toda Colombia.",
  alternates: { canonical: "/productos" },
};

type Params = Record<string, string | undefined>;

export default async function Productos({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  return (
    <VistaCatalogo
      titulo={sp.oferta === "1" ? "Ofertas 💖" : "Todos los productos"}
      descripcion="Encuentra tu tono ideal con la asesoría de Adri."
      base="/productos"
      parametros={sp}
    />
  );
}
