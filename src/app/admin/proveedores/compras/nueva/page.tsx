import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { DialogoProveedor } from "@/components/admin/inventario/dialogo-proveedor";
import { FormularioCompra } from "@/components/admin/inventario/formulario-compra";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Registrar compra" };

export default async function NuevaCompra() {
  const proveedores = await prisma.proveedor.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true } });
  return (
    <>
      <EncabezadoPagina titulo="Registrar compra" descripcion="Cada producto agregado crea una entrada en el inventario." />
      {proveedores.length === 0 ? (
        <EstadoVacio titulo="Primero crea un proveedor" descripcion="Necesitas al menos un proveedor para registrar compras.">
          <DialogoProveedor
            disparador={
              <Button variant="glow">
                <Plus aria-hidden /> Nuevo proveedor
              </Button>
            }
          />
        </EstadoVacio>
      ) : (
        <FormularioCompra proveedores={proveedores} />
      )}
    </>
  );
}
