import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { FormularioProducto } from "@/components/admin/productos/formulario-producto";
import { listarCategorias, listarMarcas } from "@/features/productos/queries";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto() {
  const [categorias, marcas] = await Promise.all([listarCategorias(), listarMarcas()]);
  return (
    <>
      <EncabezadoPagina titulo="Nuevo producto" descripcion="Completa la información y agrega al menos un tono." />
      <FormularioProducto categorias={categorias} marcas={marcas} />
    </>
  );
}
