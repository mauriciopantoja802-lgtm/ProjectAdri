import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Boxes, History, PackageX, ScanText, Search, TrendingUp, Truck, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { Paginacion } from "@/components/compartidos/paginacion";
import { TarjetaMetrica } from "@/components/admin/tarjeta-metrica";
import { DialogoAjuste } from "@/components/admin/inventario/dialogo-ajuste";
import { listarInventario, resumenInventario } from "@/features/inventario/queries";
import { formatoCOP, formatoNumeroCO } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { nombreCompleto } from "@/lib/nombres";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inventario" };

interface Props {
  searchParams: Promise<{ q?: string; bajo?: string; pagina?: string }>;
}

export default async function PaginaInventario({ searchParams }: Props) {
  const sp = await searchParams;
  const bajo = sp.bajo === "1";
  const pagina = Math.max(1, Number(sp.pagina) || 1);
  const [{ variantes, total, totalBajo, paginas }, resumen] = await Promise.all([
    listarInventario({ q: sp.q?.trim(), bajo, pagina }),
    resumenInventario(),
  ]);

  return (
    <>
      <EncabezadoPagina titulo="Inventario" descripcion="Stock por variante. Cada cambio queda registrado en el kardex.">
        <Link href="/admin/inventario/movimientos" className={buttonVariants({ variant: "outline" })}>
          <History aria-hidden /> Movimientos
        </Link>
        <Link href="/admin/proveedores/compras/nueva" className={buttonVariants({ variant: "outline" })}>
          <Truck aria-hidden /> Registrar compra
        </Link>
        <Link href="/admin/proveedores/compras/factura" className={buttonVariants({ variant: "glow" })}>
          <ScanText aria-hidden /> Escanear factura
        </Link>
      </EncabezadoPagina>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <TarjetaMetrica titulo="Unidades en stock" valor={formatoNumeroCO(resumen.unidades)} icono={Boxes} />
        <TarjetaMetrica titulo="Inventario a costo" valor={formatoCOP(resumen.valorCosto)} detalle="lo que pagaste" icono={Wallet} />
        <TarjetaMetrica titulo="Inventario a precio de venta" valor={formatoCOP(resumen.valorVenta)} icono={Wallet} />
        <TarjetaMetrica
          titulo="Ganancia potencial"
          valor={formatoCOP(resumen.gananciaPotencial)}
          detalle={resumen.sinPrecio ? `${resumen.sinPrecio} variante(s) sin precio de venta` : "si vendes todo el stock"}
          icono={TrendingUp}
          alerta={resumen.sinPrecio > 0}
        />
        <TarjetaMetrica
          titulo="Con stock bajo"
          valor={String(totalBajo)}
          detalle="variantes en o por debajo del mínimo"
          icono={PackageX}
          alerta={totalBajo > 0}
        />
      </div>

      <form className="mb-4 flex flex-col gap-2 rounded-3xl bg-white p-3 shadow-suave sm:flex-row">
        <Input name="q" defaultValue={sp.q} placeholder="Buscar por producto, tono, SKU o código de barras" aria-label="Buscar" />
        {bajo && <input type="hidden" name="bajo" value="1" />}
        <Button type="submit" variant="secondary">
          <Search aria-hidden /> Buscar
        </Button>
        <Link
          href={bajo ? "/admin/inventario" : "/admin/inventario?bajo=1"}
          className={cn(buttonVariants({ variant: bajo ? "default" : "outline" }), "whitespace-nowrap")}
          aria-current={bajo ? "page" : undefined}
        >
          <PackageX aria-hidden /> Solo stock bajo
        </Link>
      </form>

      {variantes.length === 0 ? (
        <EstadoVacio
          icono={Boxes}
          titulo={bajo ? "¡Todo en orden!" : "Sin resultados"}
          descripcion={bajo ? "Ninguna variante está por debajo de su stock mínimo." : "Prueba con otra búsqueda."}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-white shadow-suave">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-64">Producto / variante</TableHead>
                <TableHead className="hidden md:table-cell">SKU</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="hidden text-center sm:table-cell">Mínimo</TableHead>
                <TableHead className="text-right">Precio compra</TableHead>
                <TableHead className="text-right">Precio venta</TableHead>
                <TableHead className="text-right">Ganancia / u.</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantes.map((v) => {
                const nombre = nombreCompleto(v.producto.nombre, v.nombre);
                const esBajo = v.stock <= v.stockMinimo;
                const venta = v.precioOferta ?? v.precio; // precio al que se vende hoy
                const ganancia = venta - v.costo;
                const margen = venta > 0 ? Math.round((ganancia / venta) * 100) : 0;
                return (
                  <TableRow key={v.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={v.producto.imagenes[0]?.url ?? IMAGEN_PLACEHOLDER}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="flex items-center gap-1.5 font-medium">
                            {v.colorHex && (
                              <span className="inline-block size-3 rounded-full ring-1 ring-border" style={{ backgroundColor: v.colorHex }} />
                            )}
                            {nombre}
                          </p>
                          {(!v.activo || !v.producto.activo) && <Badge variant="outline">Inactiva</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">{v.sku}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          "inline-flex min-w-10 justify-center rounded-full px-2 py-0.5 font-bold",
                          v.stock === 0 ? "bg-red-100 text-destructive" : esBajo ? "bg-amber-100 text-amber-800" : "bg-green-50 text-green-800",
                        )}
                      >
                        {v.stock}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-center sm:table-cell">{v.stockMinimo}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatoCOP(v.costo)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {venta > 0 ? (
                        <>
                          {formatoCOP(venta)}
                          {v.precioOferta !== null && <span className="block text-[0.7rem] text-muted-foreground line-through">{formatoCOP(v.precio)}</span>}
                        </>
                      ) : (
                        <Link href={`/admin/productos/${v.productoId}`}>
                          <Badge className="bg-amber-100 text-amber-900">Sin precio</Badge>
                        </Link>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {venta > 0 ? (
                        <span className={cn("font-semibold", ganancia > 0 ? "text-green-700" : "text-destructive")}>
                          {formatoCOP(ganancia)}
                          <span className="block text-[0.7rem] font-normal">{margen}%</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <DialogoAjuste varianteId={v.id} nombre={nombre} stock={v.stock} />
                        <Link href={`/admin/inventario/${v.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                          Kardex
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">{total} variante(s)</p>
      <Paginacion pagina={pagina} paginas={paginas} ruta="/admin/inventario" parametros={sp} />
    </>
  );
}
