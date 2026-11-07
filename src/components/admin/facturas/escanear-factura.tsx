"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, CircleAlert, FileText, LoaderCircle, PackagePlus, RotateCcw, ScanText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { claseSelect } from "@/components/compartidos/campos";
import { BuscadorVariantes } from "@/components/admin/buscador-variantes";
import { leerFactura, registrarFactura, type LineaSugerida } from "@/features/facturas/actions";
import type { DatosImportacion, FacturaExtraida } from "@/features/facturas/schemas";
import { claveDiaBogota, formatoCOP } from "@/lib/formato";
import { cn } from "@/lib/utils";

type Opcion = { id: string; nombre: string };
type Linea = {
  descripcion: string;
  accion: "existente" | "nuevo" | "omitir";
  varianteId: string | null;
  nombreVariante: string | null;
  nombreProducto: string;
  tono: string;
  categoriaId: string;
  marcaId: string;
  codigoBarras: string;
  cantidad: number;
  costoUnit: number;
};

/** Reduce la foto en el navegador (máx. 2000 px, JPEG): se sube rápido y sigue siendo legible. */
async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith("image/") || archivo.size < 900_000) return archivo;
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(bitmap.width * escala);
  lienzo.height = Math.round(bitmap.height * escala);
  lienzo.getContext("2d")!.drawImage(bitmap, 0, 0, lienzo.width, lienzo.height);
  const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/jpeg", 0.85));
  return blob ? new File([blob], "factura.jpg", { type: "image/jpeg" }) : archivo;
}

const entero = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));

export function EscanearFactura({
  disponible,
  categorias,
  marcas,
  proveedores,
}: {
  disponible: boolean;
  categorias: Opcion[];
  marcas: Opcion[];
  proveedores: Opcion[];
}) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<string | null>(null);
  const [leyendo, iniciarLectura] = useTransition();
  const [guardando, iniciarGuardado] = useTransition();
  const [factura, setFactura] = useState<FacturaExtraida | null>(null);
  const [proveedorId, setProveedorId] = useState<string>("");
  const [proveedor, setProveedor] = useState({ nombre: "", nit: "", telefono: "" });
  const [fecha, setFecha] = useState(claveDiaBogota(new Date()));
  const [numero, setNumero] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [actualizarCosto, setActualizarCosto] = useState(true);
  const [creados, setCreados] = useState<{ id: string; nombre: string }[] | null>(null);

  const elegir = async (f: File | undefined) => {
    if (!f) return;
    const listo = await comprimirImagen(f);
    setArchivo(listo);
    setVista(listo.type.startsWith("image/") ? URL.createObjectURL(listo) : null);
  };

  const leer = () => {
    if (!archivo) return;
    const datos = new FormData();
    datos.set("factura", archivo);
    iniciarLectura(async () => {
      const r = await leerFactura(datos);
      if (!r.ok) return void toast.error(r.error);
      const { factura: f, sugerencias, proveedorId: pid } = r.datos;
      setFactura(f);
      setProveedorId(pid ?? "");
      setProveedor({ nombre: f.proveedor.nombre, nit: f.proveedor.nit ?? "", telefono: f.proveedor.telefono ?? "" });
      if (f.fecha && /^\d{4}-\d{2}-\d{2}$/.test(f.fecha)) setFecha(f.fecha);
      setNumero(f.numeroFactura ?? "");
      setLineas(
        f.items.map((it, i) => {
          const s: LineaSugerida = sugerencias[i];
          return {
            descripcion: it.descripcion,
            accion: s.varianteId ? "existente" : "nuevo",
            varianteId: s.varianteId,
            nombreVariante: s.nombreVariante,
            nombreProducto: it.nombreProducto,
            tono: it.tono ?? "",
            categoriaId: s.categoriaId ?? "",
            marcaId: s.marcaId ?? "",
            codigoBarras: it.codigoBarras?.replace(/\D/g, "") ?? "",
            cantidad: it.cantidad,
            costoUnit: it.costoUnitario,
          };
        }),
      );
      toast.success(r.mensaje);
    });
  };

  const cambiar = (i: number, cambios: Partial<Linea>) => setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambios } : l)));
  const activas = lineas.filter((l) => l.accion !== "omitir");
  const total = activas.reduce((t, l) => t + l.cantidad * l.costoUnit, 0);
  const diferencia = factura?.total ? total - factura.total : 0;

  const guardar = () => {
    const faltantes = lineas.findIndex(
      (l) => (l.accion === "existente" && !l.varianteId) || (l.accion === "nuevo" && (!l.categoriaId || l.nombreProducto.trim().length < 3)),
    );
    if (faltantes >= 0) return void toast.error(`Completa la línea ${faltantes + 1}: elige el producto existente o la categoría del nuevo`);
    const datos: DatosImportacion = {
      proveedor: { id: proveedorId || null, nombre: proveedor.nombre, nit: proveedor.nit || null, telefono: proveedor.telefono || null },
      fecha,
      numeroFactura: numero || null,
      actualizarCosto,
      items: lineas.map((l) =>
        l.accion === "omitir"
          ? { accion: "omitir" as const }
          : l.accion === "existente"
            ? { accion: "existente" as const, varianteId: l.varianteId!, cantidad: l.cantidad, costoUnit: l.costoUnit }
            : {
                accion: "nuevo" as const,
                nombreProducto: l.nombreProducto,
                tono: l.tono.trim() || null,
                categoriaId: l.categoriaId,
                marcaId: l.marcaId || null,
                codigoBarras: l.codigoBarras || null,
                cantidad: l.cantidad,
                costoUnit: l.costoUnit,
              },
      ),
    };
    iniciarGuardado(async () => {
      const r = await registrarFactura(datos);
      if (!r.ok) return void toast.error(r.error);
      toast.success(r.mensaje);
      setCreados(r.datos.productosNuevos);
      router.refresh();
    });
  };

  const reiniciar = () => {
    setArchivo(null);
    setVista(null);
    setFactura(null);
    setLineas([]);
    setCreados(null);
  };

  // ------------------------------------------------------------ Resultado
  if (creados) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-suave">
        <h2 className="text-xl font-semibold text-berry">¡Listo! La compra quedó registrada y el stock ya subió 🎉</h2>
        {creados.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Se crearon {creados.length} producto(s) nuevos. Están <strong>ocultos en la tienda</strong> hasta que les pongas precio de venta, fotos y
              descripción:
            </p>
            <ul className="space-y-2">
              {creados.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-2xl bg-nude p-3">
                  <span className="font-medium">{p.nombre}</span>
                  <Link href={`/admin/productos/${p.id}`} className={buttonVariants({ variant: "glow", size: "sm" })}>
                    Definir precio y fotos
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Todos los productos ya existían; solo se sumó el stock.</p>
        )}
        <Button variant="outline" onClick={reiniciar}>
          <ScanText aria-hidden /> Escanear otra factura
        </Button>
      </div>
    );
  }

  // ------------------------------------------------------------ Paso 1: subir
  if (!factura) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-3xl bg-white p-6 shadow-suave">
          {!disponible && (
            <p className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              El lector de facturas necesita la variable ANTHROPIC_API_KEY en el servidor (ver README). Mientras tanto puedes{" "}
              <Link href="/admin/proveedores/compras/nueva" className="font-semibold underline">
                registrar la compra a mano
              </Link>
              .
            </p>
          )}
          <input
            ref={entrada}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            capture="environment"
            className="sr-only"
            aria-label="Foto o PDF de la factura"
            onChange={(e) => elegir(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-secondary bg-nude/50 p-10 text-center transition-colors hover:border-primary"
          >
            {vista ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:), no pasa por next/image
              <img src={vista} alt="Vista previa de la factura" className="max-h-80 rounded-2xl object-contain shadow-suave" />
            ) : archivo ? (
              <FileText className="size-12 text-primary" aria-hidden />
            ) : (
              <Camera className="size-12 text-primary" aria-hidden />
            )}
            <span className="font-semibold text-berry">{archivo ? archivo.name : "Toma una foto o elige el PDF de la factura"}</span>
            <span className="text-xs text-muted-foreground">JPG, PNG, WebP o PDF · máximo 8 MB</span>
          </button>
          <Button variant="glow" size="lg" className="w-full" disabled={!archivo || leyendo || !disponible} onClick={leer}>
            {leyendo ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {leyendo ? "Leyendo la factura… (puede tardar unos segundos)" : "Leer factura con IA"}
          </Button>
        </div>
        <aside className="h-fit space-y-2 rounded-3xl bg-white p-5 text-sm shadow-suave">
          <h2 className="font-semibold text-berry">Consejos para una buena lectura</h2>
          <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
            <li>Foto de frente, con buena luz y sin sombras.</li>
            <li>Que se vea toda la tabla de productos.</li>
            <li>Si la factura es larga, sube el PDF del proveedor.</li>
            <li>Siempre revisarás los datos antes de guardar: la IA puede equivocarse.</li>
          </ul>
        </aside>
      </div>
    );
  }

  // ------------------------------------------------------------ Paso 2: revisar
  return (
    <div className="space-y-6 pb-24">
      {factura.observaciones && (
        <p className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> <span><strong>Notas de la lectura:</strong> {factura.observaciones}</span>
        </p>
      )}

      <section className="grid gap-4 rounded-3xl bg-white p-5 shadow-suave sm:grid-cols-2 lg:grid-cols-4">
        <h2 className="text-lg font-semibold text-berry sm:col-span-2 lg:col-span-4">Datos de la factura</h2>
        <div className="space-y-1.5">
          <Label htmlFor="f-prov">Proveedor</Label>
          <select id="f-prov" className={claseSelect} value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
            <option value="">➕ Crear nuevo: {proveedor.nombre}</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>
        {!proveedorId && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="f-pnom">Nombre del proveedor</Label>
              <Input id="f-pnom" value={proveedor.nombre} onChange={(e) => setProveedor({ ...proveedor, nombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-nit">NIT</Label>
              <Input id="f-nit" value={proveedor.nit} onChange={(e) => setProveedor({ ...proveedor, nit: e.target.value })} />
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="f-num">Número de factura</Label>
          <Input id="f-num" value={numero} onChange={(e) => setNumero(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-fecha">Fecha</Label>
          <Input id="f-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-berry">Productos ({lineas.length})</h2>
        {lineas.map((l, i) => (
          <article key={i} className={cn("space-y-3 rounded-3xl bg-white p-4 shadow-suave", l.accion === "omitir" && "opacity-60")}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-sm">
                <span className="mr-2 rounded-full bg-nude px-2 py-0.5 text-xs font-semibold text-primary">Línea {i + 1}</span>
                <span className="text-muted-foreground">{l.descripcion}</span>
              </p>
              <div className="flex shrink-0 gap-1" role="radiogroup" aria-label={`Qué hacer con la línea ${i + 1}`}>
                {(["existente", "nuevo", "omitir"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={l.accion === a}
                    onClick={() => cambiar(i, { accion: a })}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      l.accion === a ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary",
                    )}
                  >
                    {a === "existente" ? "Ya lo tengo" : a === "nuevo" ? "Producto nuevo" : "Omitir"}
                  </button>
                ))}
              </div>
            </div>

            {l.accion === "existente" && (
              <div className="space-y-1.5">
                {l.varianteId ? (
                  <p className="flex items-center justify-between gap-2 rounded-2xl bg-green-50 p-3 text-sm text-green-900">
                    <span>
                      ✓ Se sumará a: <strong>{l.nombreVariante}</strong>
                    </span>
                    <button type="button" className="text-xs underline" onClick={() => cambiar(i, { varianteId: null, nombreVariante: null })}>
                      Cambiar
                    </button>
                  </p>
                ) : (
                  <BuscadorVariantes mostrarCosto placeholder="Busca el producto existente…" alElegir={(v) => cambiar(i, { varianteId: v.id, nombreVariante: v.nombre })} />
                )}
              </div>
            )}

            {l.accion === "nuevo" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor={`n-${i}`}>Nombre del producto</Label>
                  <Input id={`n-${i}`} value={l.nombreProducto} onChange={(e) => cambiar(i, { nombreProducto: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`t-${i}`}>Tono (opcional)</Label>
                  <Input id={`t-${i}`} value={l.tono} onChange={(e) => cambiar(i, { tono: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`c-${i}`}>Categoría</Label>
                  <select id={`c-${i}`} className={claseSelect} value={l.categoriaId} onChange={(e) => cambiar(i, { categoriaId: e.target.value })} aria-invalid={!l.categoriaId || undefined}>
                    <option value="">Elige…</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`m-${i}`}>Marca</Label>
                  <select id={`m-${i}`} className={claseSelect} value={l.marcaId} onChange={(e) => cambiar(i, { marcaId: e.target.value })}>
                    <option value="">Sin marca</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {l.accion !== "omitir" && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`q-${i}`}>Cantidad</Label>
                  <Input id={`q-${i}`} inputMode="numeric" value={l.cantidad} onChange={(e) => cambiar(i, { cantidad: Math.max(1, entero(e.target.value)) })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`p-${i}`}>Precio de compra (c/u)</Label>
                  <Input id={`p-${i}`} inputMode="numeric" value={l.costoUnit} onChange={(e) => cambiar(i, { costoUnit: entero(e.target.value) })} />
                </div>
                {l.accion === "nuevo" && (
                  <div className="space-y-1.5">
                    <Label htmlFor={`b-${i}`}>Código de barras</Label>
                    <Input id={`b-${i}`} inputMode="numeric" value={l.codigoBarras} onChange={(e) => cambiar(i, { codigoBarras: e.target.value.replace(/\D/g, "") })} />
                  </div>
                )}
                <p className="self-end pb-2 text-right text-sm font-semibold sm:col-start-4">{formatoCOP(l.cantidad * l.costoUnit)}</p>
              </div>
            )}
          </article>
        ))}
      </section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/95 p-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="text-sm">
            Total: <strong className="text-lg text-berry">{formatoCOP(total)}</strong>
            {factura.total ? (
              <span className={cn("ml-2 text-xs", Math.abs(diferencia) <= 100 ? "text-green-700" : "text-amber-700")}>
                {Math.abs(diferencia) <= 100 ? "✓ coincide con la factura" : `factura dice ${formatoCOP(factura.total)} (diferencia ${formatoCOP(diferencia)})`}
              </span>
            ) : null}
            <label className="ml-0 flex items-center gap-2 text-xs sm:ml-4 sm:inline-flex">
              <input type="checkbox" checked={actualizarCosto} onChange={(e) => setActualizarCosto(e.target.checked)} className="accent-[var(--primary)]" />
              Actualizar el precio de compra de los productos existentes
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reiniciar} disabled={guardando}>
              <RotateCcw aria-hidden /> Empezar de nuevo
            </Button>
            <Button variant="glow" onClick={guardar} disabled={guardando || activas.length === 0}>
              {guardando ? <LoaderCircle className="animate-spin" aria-hidden /> : <PackagePlus aria-hidden />} Crear productos y registrar compra
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
