import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, Plus, ScanText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { claseSelect } from "@/components/compartidos/campos";
import { AccionesProducto } from "@/components/admin/productos/acciones-producto";
import { listarCategorias, listarProductosAdmin } from "@/features/productos/queries";
import { formatoCOP } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";

export const metadata: Metadata = { title: "Productos" };

interface Props {
  searchParams: Promise<{ q?: string; categoria?: string; estado?: string; pagina?: string }>;
}

function rangoPrecio(variantes: { precio: number; precioOferta: number | null }[]) {
  const precios = variantes.map((v) => v.precioOferta ?? v.precio);
  if (!precios.length) return "—";
  const min = Math.min(...precios);
  const max = Math.max(...precios);
  return min === max ? formatoCOP(min) : `${formatoCOP(min)} – ${formatoCOP(max)}`;
}

export default async function PaginaProductos({ searchParams }: Props) {
  const sp = await searchParams;
  const estado = sp.estado === "activos" || sp.estado === "inactivos" ? sp.estado : "todos";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const [{ productos, total, paginas }, categorias] = await Promise.all([
    listarProductosAdmin({ q: sp.q?.trim(), categoria: sp.categoria, estado, pagina }),
    listarCategorias(),
  ]);

  return (
    <>
      <EncabezadoPagina titulo="Productos" descripcion={`${total} producto(s) en el catálogo`}>
        <Link href="/admin/productos/categorias" className={buttonVariants({ variant: "outline" })}>
          Categorías y marcas
        </Link>
        <Link href="/admin/proveedores/compras/factura" className={buttonVariants({ variant: "outline" })}>
          <ScanText aria-hidden /> Escanear factura
        </Link>
        <Link href="/admin/productos/nuevo" className={buttonVariants({ variant: "glow" })}>
          <Plus aria-hidden /> Nuevo producto
        </Link>
      </EncabezadoPagina>

      {/* Filtros con formulario GET: funcionan sin JavaScript y quedan en la URL */}
      <form className="mb-4 grid gap-2 rounded-3xl bg-white p-3 shadow-suave sm:grid-cols-[1fr_200px_160px_auto]">
        <Input name="q" defaultValue={sp.q} placeholder="Buscar por nombre, marca, SKU o código de barras" aria-label="Buscar" />
        <select name="categoria" defaultValue={sp.categoria ?? ""} className={claseSelect} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <select name="estado" defaultValue={estado} className={claseSelect} aria-label="Estado">
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Filtrar
        </Button>
      </form>

      {productos.length === 0 ? (
        <EstadoVacio icono={Package} titulo="No hay productos" descripcion="Prueba con otros filtros o crea tu primer producto.">
          <Link href="/admin/productos/nuevo" className={buttonVariants({ variant: "glow" })}>
            <Plus aria-hidden /> Nuevo producto
          </Link>
        </EstadoVacio>
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Producto</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => {
                const stock = p.variantes.reduce((t, v) => t + v.stock, 0);
                const bajos = p.variantes.filter((v) => v.activo && v.stock <= v.stockMinimo).length;
                const enOferta = p.variantes.some((v) => v.precioOferta !== null);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={p.imagenes[0]?.url ?? IMAGEN_PLACEHOLDER}
                          alt=""
                          width={48}
                          height={48}
                          className="size-12 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0">
                          <Link href={`/admin/productos/${p.id}`} className="font-medium text-berry hover:text-primary">
                            {p.nombre}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {p.marca?.nombre ?? "Sin marca"} · {p.variantes.length} variante(s)
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.esNuevo && <Badge variant="secondary">Nuevo</Badge>}
                            {p.destacado && <Badge className="bg-accent text-berry">Más vendido</Badge>}
                            {enOferta && <Badge>Oferta</Badge>}
                            {p.variantes.some((v) => v.precio === 0) && <Badge className="bg-amber-100 text-amber-900">Sin precio de venta</Badge>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{p.categoria.nombre}</TableCell>
                    <TableCell className="whitespace-nowrap">{rangoPrecio(p.variantes)}</TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold">{stock}</span>
                      {bajos > 0 && <p className="text-xs font-medium text-destructive">{bajos} bajo(s)</p>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {p.activo ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge variant="outline">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AccionesProducto id={p.id} nombre={p.nombre} activo={p.activo} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/productos" parametros={{ ...sp, estado }} />
    </>
  );
}
