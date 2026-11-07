import type { Metadata } from "next";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EscanearFactura } from "@/components/admin/facturas/escanear-factura";
import { lectorDisponible } from "@/features/facturas/lector";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Escanear factura" };

export default async function PaginaEscanearFactura() {
  const [categorias, marcas, proveedores] = await Promise.all([
    prisma.categoria.findMany({ orderBy: [{ orden: "asc" }, { nombre: "asc" }], select: { id: true, nombre: true } }),
    prisma.marca.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);
  return (
    <>
      <EncabezadoPagina
        titulo="Escanear factura"
        descripcion="Toma una foto de la factura del proveedor: la IA lee los productos, cantidades y costos. Tú revisas y confirmas."
      />
      <EscanearFactura disponible={lectorDisponible()} categorias={categorias} marcas={marcas} proveedores={proveedores} />
    </>
  );
}
