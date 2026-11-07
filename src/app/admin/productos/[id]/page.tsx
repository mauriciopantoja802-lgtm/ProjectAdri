import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { FormularioProducto } from "@/components/admin/productos/formulario-producto";
import { listarCategorias, listarMarcas, obtenerProductoAdmin } from "@/features/productos/queries";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, categorias, marcas] = await Promise.all([obtenerProductoAdmin(id), listarCategorias(), listarMarcas()]);
  if (!producto) notFound();

  return (
    <>
      <EncabezadoPagina titulo={producto.nombre} descripcion="Editar producto" />
      <FormularioProducto
        categorias={categorias}
        marcas={marcas}
        producto={{
          id: producto.id,
          nombre: producto.nombre,
          slug: producto.slug,
          descripcion: producto.descripcion,
          modoUso: producto.modoUso,
          categoriaId: producto.categoriaId,
          marcaId: producto.marcaId,
          esNuevo: producto.esNuevo,
          destacado: producto.destacado,
          activo: producto.activo,
          imagenes: producto.imagenes.map((i) => ({ url: i.url, alt: i.alt })),
          variantes: producto.variantes.map((v) => ({
            id: v.id,
            nombre: v.nombre,
            colorHex: v.colorHex,
            sku: v.sku,
            codigoBarras: v.codigoBarras,
            precio: v.precio,
            precioOferta: v.precioOferta,
            costo: v.costo,
            stock: v.stock,
            stockMinimo: v.stockMinimo,
            activo: v.activo,
          })),
        }}
      />
    </>
  );
}
