"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Banknote, CircleCheck, LoaderCircle, Minus, Plus, Printer, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BuscadorVariantes } from "@/components/admin/buscador-variantes";
import { claseSelect } from "@/components/compartidos/campos";
import { usePOS } from "@/store/pos";
import { useMontado } from "@/hooks/use-montado";
import { registrarVentaPOS } from "@/features/pos/actions";
import { CANALES_POS, METODOS_POS, METODOS_SIMPLES } from "@/features/pos/schemas";
import { calcularTotales } from "@/features/pedidos/calculos";
import { CANAL_VENTA, METODO_PAGO } from "@/lib/etiquetas";
import { formatoCOP } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { cn } from "@/lib/utils";

type Metodo = (typeof METODOS_POS)[number];
type MetodoSimple = (typeof METODOS_SIMPLES)[number];

/** Billetes más comunes en Colombia para cobrar en efectivo con un toque. */
const BILLETES = [10000, 20000, 50000, 100000];

const entero = (v: string) => Math.max(0, Math.round(Number(v.replace(/\D/g, "")) || 0));

export function PantallaPOS() {
  const montado = useMontado();
  const pos = usePOS();
  const buscador = useRef<HTMLInputElement>(null);
  const [metodo, setMetodo] = useState<Metodo>("EFECTIVO");
  const [recibido, setRecibido] = useState("");
  const [mixto, setMixto] = useState<{ metodo: MetodoSimple; monto: number }[]>([
    { metodo: "EFECTIVO", monto: 0 },
    { metodo: "NEQUI", monto: 0 },
  ]);
  const [notas, setNotas] = useState("");
  const [vendido, setVendido] = useState<{ id: string; codigo: string; cambio: number | null } | null>(null);
  const [cobrando, iniciar] = useTransition();

  const totales = useMemo(
    () => calcularTotales(pos.items.map((i) => ({ precioUnit: i.precio, cantidad: i.cantidad, descuento: i.descuento })), pos.descuentoTotal),
    [pos.items, pos.descuentoTotal],
  );
  const efectivoACobrar = metodo === "EFECTIVO" ? totales.total : metodo === "MIXTO" ? mixto.filter((m) => m.metodo === "EFECTIVO").reduce((t, m) => t + m.monto, 0) : 0;
  const recibidoNum = recibido ? entero(recibido) : null;
  const cambio = recibidoNum !== null && efectivoACobrar > 0 ? recibidoNum - efectivoACobrar : null;
  const sumaMixto = mixto.reduce((t, m) => t + m.monto, 0);

  const enfocar = () => setTimeout(() => buscador.current?.focus(), 50);

  const cobrar = () => {
    if (!pos.items.length) return void toast.error("El ticket está vacío");
    if (metodo === "MIXTO" && sumaMixto !== totales.total) {
      return void toast.error(`Los pagos suman ${formatoCOP(sumaMixto)}; deben sumar ${formatoCOP(totales.total)}`);
    }
    if (cambio !== null && cambio < 0) return void toast.error("El efectivo recibido no alcanza");
    iniciar(async () => {
      const r = await registrarVentaPOS({
        canal: pos.canal,
        items: pos.items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad, descuento: i.descuento })),
        descuentoTotal: pos.descuentoTotal,
        clienta: {
          nombre: pos.clienta.nombre.trim() || null,
          telefono: pos.clienta.telefono.replace(/\D/g, "") || null,
        },
        metodoPago: metodo,
        pagos: metodo === "MIXTO" ? mixto : [],
        recibido: efectivoACobrar > 0 ? recibidoNum : null,
        notas: notas.trim() || null,
      });
      if (!r.ok) return void toast.error(r.error);
      toast.success(`${r.mensaje} ${r.datos.codigo}`);
      setVendido({ ...r.datos, cambio });
    });
  };

  const nuevaVenta = () => {
    pos.nuevaVenta();
    setMetodo("EFECTIVO");
    setRecibido("");
    setNotas("");
    setMixto([
      { metodo: "EFECTIVO", monto: 0 },
      { metodo: "NEQUI", monto: 0 },
    ]);
    setVendido(null);
    enfocar();
  };

  if (!montado) return <div className="h-96 animate-pulse rounded-3xl bg-white" />;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      {/* ---------------- Ticket ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Canal de la venta">
          {CANALES_POS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={pos.canal === c}
              onClick={() => pos.setCanal(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                pos.canal === c ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary",
              )}
            >
              {CANAL_VENTA[c].etiqueta}
            </button>
          ))}
        </div>

        <BuscadorVariantes
          ref={buscador}
          autoFocus
          soloActivas
          alElegir={(v) => {
            const r = pos.agregar({ varianteId: v.id, nombre: v.nombre, sku: v.sku, imagen: v.imagen, precio: v.precio, stock: v.stock });
            if (r === "sin-stock") toast.error(`Sin stock suficiente de ${v.nombre} (quedan ${v.stock})`);
            enfocar();
          }}
        />

        <div className="rounded-3xl bg-white shadow-suave">
          {pos.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
              <ShoppingBag className="size-10 text-secondary" aria-hidden />
              <p className="font-medium">Escanea o busca un producto para empezar</p>
              <p className="text-xs">El lector de código de barras funciona directamente en el buscador.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {pos.items.map((i) => (
                <li key={i.varianteId} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 p-3 sm:grid-cols-[48px_1fr_130px_110px_100px_auto]">
                  <Image src={i.imagen ?? IMAGEN_PLACEHOLDER} alt="" width={48} height={48} className="size-12 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatoCOP(i.precio)} · {i.sku} · Stock {i.stock}
                    </p>
                  </div>
                  <div className="col-start-2 flex items-center gap-1 sm:col-start-auto" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                    <Button size="icon-sm" variant="outline" aria-label="Restar uno" onClick={() => pos.cambiarCantidad(i.varianteId, i.cantidad - 1)}>
                      <Minus aria-hidden />
                    </Button>
                    <Input
                      value={i.cantidad}
                      onChange={(e) => pos.cambiarCantidad(i.varianteId, entero(e.target.value))}
                      inputMode="numeric"
                      aria-label="Cantidad"
                      className="h-8 w-12 px-1 text-center"
                    />
                    <Button size="icon-sm" variant="outline" aria-label="Sumar uno" onClick={() => pos.cambiarCantidad(i.varianteId, i.cantidad + 1)}>
                      <Plus aria-hidden />
                    </Button>
                  </div>
                  <label className="col-start-2 text-xs text-muted-foreground sm:col-start-auto">
                    Descuento
                    <Input
                      value={i.descuento || ""}
                      onChange={(e) => pos.cambiarDescuento(i.varianteId, entero(e.target.value))}
                      inputMode="numeric"
                      placeholder="$0"
                      className="h-8"
                    />
                  </label>
                  <p className="text-right text-sm font-semibold tabular-nums">{formatoCOP(i.precio * i.cantidad - i.descuento)}</p>
                  <Button size="icon-sm" variant="ghost" aria-label={`Quitar ${i.nombre}`} onClick={() => pos.quitar(i.varianteId)}>
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <details className="rounded-3xl bg-white p-4 shadow-suave">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <UserRound className="size-4 text-primary" aria-hidden /> Clienta (opcional)
            {pos.clienta.nombre && <span className="text-muted-foreground">· {pos.clienta.nombre}</span>}
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pos-nombre">Nombre</Label>
              <Input id="pos-nombre" value={pos.clienta.nombre} onChange={(e) => pos.setClienta({ nombre: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pos-tel">Celular</Label>
              <Input
                id="pos-tel"
                type="tel"
                inputMode="tel"
                placeholder="300 123 4567"
                value={pos.clienta.telefono}
                onChange={(e) => pos.setClienta({ telefono: e.target.value })}
              />
            </div>
          </div>
        </details>
      </section>

      {/* ---------------- Cobro ---------------- */}
      <aside className="h-fit space-y-4 rounded-3xl bg-white p-5 shadow-suave lg:sticky lg:top-20">
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular-nums">{formatoCOP(totales.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">
              <label htmlFor="pos-desc">Descuento total</label>
            </dt>
            <dd>
              <Input
                id="pos-desc"
                value={pos.descuentoTotal || ""}
                onChange={(e) => pos.setDescuentoTotal(entero(e.target.value))}
                inputMode="numeric"
                placeholder="$0"
                className="h-8 w-32 text-right"
              />
            </dd>
          </div>
          <div className="flex items-end justify-between border-t border-border pt-3">
            <dt className="font-semibold">Total</dt>
            <dd className="text-3xl font-bold text-berry tabular-nums">{formatoCOP(totales.total)}</dd>
          </div>
        </dl>

        <div className="space-y-1.5">
          <Label htmlFor="pos-metodo">Método de pago</Label>
          <select id="pos-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value as Metodo)} className={claseSelect}>
            {METODOS_POS.map((m) => (
              <option key={m} value={m}>
                {METODO_PAGO[m]}
              </option>
            ))}
          </select>
        </div>

        {metodo === "MIXTO" && (
          <div className="space-y-2 rounded-2xl bg-nude p-3">
            {mixto.map((m, k) => (
              <div key={k} className="flex gap-2">
                <select
                  aria-label={`Método ${k + 1}`}
                  value={m.metodo}
                  onChange={(e) => setMixto(mixto.map((x, j) => (j === k ? { ...x, metodo: e.target.value as MetodoSimple } : x)))}
                  className={cn(claseSelect, "h-9")}
                >
                  {METODOS_SIMPLES.map((s) => (
                    <option key={s} value={s}>
                      {METODO_PAGO[s]}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label={`Monto ${k + 1}`}
                  inputMode="numeric"
                  value={m.monto || ""}
                  placeholder="$0"
                  onChange={(e) => setMixto(mixto.map((x, j) => (j === k ? { ...x, monto: entero(e.target.value) } : x)))}
                  className="h-9 text-right"
                />
              </div>
            ))}
            <div className="flex items-center justify-between text-xs">
              <button type="button" className="font-medium text-primary" onClick={() => setMixto([...mixto, { metodo: "TARJETA", monto: 0 }])}>
                + Otro método
              </button>
              <span className={sumaMixto === totales.total ? "text-green-700" : "text-destructive"}>
                {sumaMixto === totales.total ? "✓ Completo" : `Faltan ${formatoCOP(totales.total - sumaMixto)}`}
              </span>
            </div>
          </div>
        )}

        {efectivoACobrar > 0 && (
          <div className="space-y-2 rounded-2xl bg-nude p-3">
            <Label htmlFor="pos-recibido" className="flex items-center gap-1.5">
              <Banknote className="size-4 text-primary" aria-hidden /> Efectivo recibido
            </Label>
            <Input id="pos-recibido" inputMode="numeric" placeholder={formatoCOP(efectivoACobrar)} value={recibido} onChange={(e) => setRecibido(e.target.value)} />
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setRecibido(String(efectivoACobrar))} className="rounded-full bg-white px-3 py-1 text-xs font-medium hover:bg-secondary">
                Exacto
              </button>
              {BILLETES.filter((b) => b >= efectivoACobrar).slice(0, 3).map((b) => (
                <button key={b} type="button" onClick={() => setRecibido(String(b))} className="rounded-full bg-white px-3 py-1 text-xs font-medium hover:bg-secondary">
                  {formatoCOP(b)}
                </button>
              ))}
            </div>
            {cambio !== null && (
              <p className={cn("flex justify-between text-sm font-semibold", cambio < 0 ? "text-destructive" : "text-green-700")}>
                <span>{cambio < 0 ? "Falta" : "Cambio"}</span>
                <span className="text-xl tabular-nums">{formatoCOP(Math.abs(cambio))}</span>
              </p>
            )}
          </div>
        )}

        <Input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Nota (opcional)" aria-label="Nota de la venta" />

        <Button variant="glow" size="lg" className="h-14 w-full text-lg" onClick={cobrar} disabled={cobrando || !pos.items.length}>
          {cobrando ? <LoaderCircle className="animate-spin" aria-hidden /> : <CircleCheck aria-hidden />}
          Cobrar {formatoCOP(totales.total)}
        </Button>
        {pos.items.length > 0 && (
          <button type="button" onClick={nuevaVenta} className="w-full text-center text-xs text-muted-foreground hover:text-destructive">
            Vaciar ticket
          </button>
        )}
      </aside>

      <Dialog open={vendido !== null} onOpenChange={(abierto) => !abierto && nuevaVenta()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Venta {vendido?.codigo} registrada! 💖</DialogTitle>
            <DialogDescription>El stock ya se descontó y la venta aparece en Pedidos.</DialogDescription>
          </DialogHeader>
          {vendido?.cambio !== null && vendido?.cambio !== undefined && vendido.cambio > 0 && (
            <p className="rounded-2xl bg-green-50 p-4 text-center text-green-800">
              Cambio a entregar: <strong className="block text-3xl">{formatoCOP(vendido.cambio)}</strong>
            </p>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <a
              href={`/admin/pos/comprobante/${vendido?.id}`}
              target="_blank"
              rel="noopener"
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
            >
              <Printer aria-hidden /> Imprimir comprobante
            </a>
            <Button variant="glow" onClick={nuevaVenta} autoFocus>
              Nueva venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
