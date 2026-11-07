"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, HandCoins, LoaderCircle, Lock, MessageCircle, Store, Tag, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CampoTexto } from "@/components/compartidos/campo-texto";
import { CampoArea } from "@/components/compartidos/campos";
import { AlertaError } from "@/components/auth/alerta-error";
import { EstadoVacio } from "@/components/compartidos/estado-vacio";
import { useCarrito } from "@/store/carrito";
import { useMontado } from "@/hooks/use-montado";
import { esquemaCheckout, type DatosCheckout } from "@/features/pedidos/schemas";
import { cotizarPedido, crearPedidoTienda } from "@/features/pedidos/tienda-actions";
import { permiteContraEntrega } from "@/features/pedidos/envio";
import { aTextoONulo } from "@/lib/formularios";
import { formatoCOP } from "@/lib/formato";
import { IMAGEN_PLACEHOLDER } from "@/lib/imagenes";
import { cn } from "@/lib/utils";

type Cotizacion = Awaited<ReturnType<typeof cotizarPedido>>;

interface Props {
  perfil: { nombre: string; email: string; telefono: string; direcciones: { id: string; direccion: string; barrio: string | null; ciudad: string; referencia: string | null }[] } | null;
  config: { ciudad: string; costoDomicilio: number; costoNacional: number; envioGratisDesde: number | null; direccion: string };
  wompiActivo: boolean;
}

function OpcionTarjeta({ activa, onClick, icono: Icono, titulo, detalle, deshabilitada }: { activa: boolean; onClick: () => void; icono: typeof Truck; titulo: string; detalle: string; deshabilitada?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={activa}
      disabled={deshabilitada}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50",
        activa ? "border-primary shadow-glow" : "border-border hover:border-secondary",
      )}
    >
      <Icono className={cn("mt-0.5 size-5 shrink-0", activa ? "text-primary" : "text-muted-foreground")} aria-hidden />
      <span>
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="block text-xs text-muted-foreground">{detalle}</span>
      </span>
    </button>
  );
}

export function FormularioCheckout({ perfil, config, wompiActivo }: Props) {
  const router = useRouter();
  const montado = useMontado();
  const { items, vaciar } = useCarrito();
  const [enviando, iniciar] = useTransition();
  const [cotizacion, setCotizacion] = useState<Cotizacion>(null);
  const [cuponAplicado, setCuponAplicado] = useState<string | null>(null);
  const [cuponTexto, setCuponTexto] = useState("");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const dir0 = perfil?.direcciones[0];

  const { register, control, handleSubmit, setValue, formState } = useForm<DatosCheckout>({
    resolver: zodResolver(esquemaCheckout),
    defaultValues: {
      items: [],
      canal: "WEB",
      nombre: perfil?.nombre ?? "",
      telefono: perfil?.telefono.replace(/^57/, "") ?? "",
      email: perfil?.email ?? null,
      tipoEntrega: "DOMICILIO_POPAYAN",
      direccion: dir0?.direccion ?? null,
      barrio: dir0?.barrio ?? null,
      ciudad: dir0 && dir0.ciudad !== "Popayán" ? dir0.ciudad : null,
      referencia: dir0?.referencia ?? null,
      metodoPago: wompiActivo ? "WOMPI" : "CONTRA_ENTREGA",
      cupon: null,
      notas: null,
      guardarDireccion: Boolean(perfil),
      aceptaDatos: false,
    },
  });
  const [tipoEntrega, metodoPago] = useWatch({ control, name: ["tipoEntrega", "metodoPago"] });
  const e = formState.errors;
  const lineas = useMemo(() => items.map((i) => ({ varianteId: i.varianteId, cantidad: i.cantidad })), [items]);

  // Resumen calculado en el servidor (precios reales, envío y cupón)
  useEffect(() => {
    if (!montado || lineas.length === 0) return;
    let vigente = true;
    cotizarPedido({ items: lineas, tipoEntrega, cupon: cuponAplicado }).then((r) => vigente && setCotizacion(r));
    return () => {
      vigente = false;
    };
  }, [montado, lineas, tipoEntrega, cuponAplicado]);

  // Contra entrega solo en Popayán: si cambia a envío nacional, se pasa a pago en línea.
  useEffect(() => {
    if (metodoPago === "CONTRA_ENTREGA" && !permiteContraEntrega(tipoEntrega) && wompiActivo) setValue("metodoPago", "WOMPI");
  }, [tipoEntrega, metodoPago, setValue, wompiActivo]);

  useEffect(() => {
    if (cotizacion?.errorCupon && cuponAplicado) {
      toast.error(cotizacion.errorCupon);
      setCuponAplicado(null);
    } else if (cuponAplicado && cotizacion && cotizacion.descuento > 0) {
      toast.success(`Cupón aplicado: -${formatoCOP(cotizacion.descuento)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cotizacion]);

  if (!montado) return <Skeleton className="h-[600px] rounded-3xl" />;
  if (items.length === 0) {
    return (
      <EstadoVacio titulo="Tu carrito está vacío" descripcion="Agrega productos para continuar con tu compra.">
        <Link href="/productos" className={buttonVariants({ variant: "glow" })}>
          Ver productos
        </Link>
      </EstadoVacio>
    );
  }

  const enviar = (canal: "WEB" | "WHATSAPP") => {
    const metodoElegido = metodoPago;
    // En WhatsApp el pago se acuerda por chat: si eligió pago en línea (o contra entrega donde
    // no aplica), el pedido queda como transferencia y Adri le envía los datos de pago.
    const metodoFinal =
      canal === "WHATSAPP" && (metodoElegido === "WOMPI" || (metodoElegido === "CONTRA_ENTREGA" && !permiteContraEntrega(tipoEntrega)))
        ? "TRANSFERENCIA"
        : metodoElegido;
    setValue("items", lineas);
    setValue("canal", canal);
    setValue("metodoPago", metodoFinal);
    const restaurar = () => setValue("metodoPago", metodoElegido); // la selección visible no cambia
    return handleSubmit(
      (d) => {
        restaurar();
        setErrorGeneral(null);
        // Para WhatsApp se abre la pestaña de inmediato (evita el bloqueo de ventanas en celulares)
        const ventana = canal === "WHATSAPP" ? window.open("about:blank", "_blank") : null;
        iniciar(async () => {
          const r = await crearPedidoTienda({ ...d, canal, items: lineas, cupon: cuponAplicado });
          if (!r.ok) {
            ventana?.close();
            setErrorGeneral(r.error);
            toast.error(r.error);
            return;
          }
          vaciar();
          if (r.datos.pago) {
            toast.success("Te llevamos a la pasarela de pago segura…");
            window.location.href = r.datos.pago;
            return;
          }
          if (r.datos.whatsapp) {
            if (ventana) ventana.location.href = r.datos.whatsapp;
            else window.open(r.datos.whatsapp, "_blank");
          }
          toast.success(`${r.mensaje} ${r.datos.codigo}`);
          router.push(r.datos.url);
        });
      },
      () => {
        restaurar();
        toast.error("Revisa los datos marcados en rojo");
      },
    )();
  };

  const gratisDesde = config.envioGratisDesde ? ` · gratis desde ${formatoCOP(config.envioGratisDesde)}` : "";

  return (
    <form onSubmit={(ev) => { ev.preventDefault(); enviar("WEB"); }} noValidate className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {errorGeneral && <AlertaError mensaje={errorGeneral} />}
        {!perfil && (
          <p className="rounded-2xl bg-nude p-4 text-sm">
            Estás comprando como invitada.{" "}
            <Link href="/login?callbackUrl=/checkout" className="font-semibold text-primary hover:underline">
              Inicia sesión
            </Link>{" "}
            para guardar tus direcciones y ver tus pedidos.
          </p>
        )}

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-suave sm:p-6">
          <h2 className="text-xl font-semibold text-berry">1. Tus datos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoTexto etiqueta="Nombre completo" autoComplete="name" registro={register("nombre")} error={e.nombre?.message} />
            <CampoTexto etiqueta="Celular (WhatsApp)" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="300 123 4567" registro={register("telefono")} error={e.telefono?.message} />
            <div className="sm:col-span-2">
              <CampoTexto
                etiqueta="Correo (opcional, para el comprobante de pago)"
                type="email"
                autoComplete="email"
                registro={register("email", { setValueAs: aTextoONulo })}
                error={e.email?.message}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-suave sm:p-6">
          <h2 className="text-xl font-semibold text-berry">2. Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de entrega">
            <OpcionTarjeta activa={tipoEntrega === "DOMICILIO_POPAYAN"} onClick={() => setValue("tipoEntrega", "DOMICILIO_POPAYAN")} icono={Home} titulo={`Domicilio en ${config.ciudad}`} detalle={`${formatoCOP(config.costoDomicilio)}${gratisDesde}`} />
            <OpcionTarjeta activa={tipoEntrega === "RECOGER_EN_TIENDA"} onClick={() => setValue("tipoEntrega", "RECOGER_EN_TIENDA")} icono={Store} titulo="Recoger en la tienda" detalle="Gratis" />
            <OpcionTarjeta activa={tipoEntrega === "ENVIO_NACIONAL"} onClick={() => setValue("tipoEntrega", "ENVIO_NACIONAL")} icono={Truck} titulo="Envío nacional" detalle={`${formatoCOP(config.costoNacional)}${gratisDesde}`} />
          </div>
          {tipoEntrega === "RECOGER_EN_TIENDA" ? (
            <p className="rounded-2xl bg-nude p-3 text-sm">📍 Te esperamos en {config.direccion}. Te avisaremos por WhatsApp cuando tu pedido esté listo.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {perfil && perfil.direcciones.length > 1 && (
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  {perfil.direcciones.map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => {
                        setValue("direccion", dir.direccion);
                        setValue("barrio", dir.barrio);
                        setValue("referencia", dir.referencia);
                        setValue("ciudad", dir.ciudad === "Popayán" ? null : dir.ciudad);
                      }}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary"
                    >
                      {dir.direccion}
                    </button>
                  ))}
                </div>
              )}
              <div className="sm:col-span-2">
                <CampoTexto etiqueta="Dirección" autoComplete="street-address" placeholder="Calle 5 # 10-20, apto 301" registro={register("direccion", { setValueAs: aTextoONulo })} error={e.direccion?.message} />
              </div>
              <CampoTexto etiqueta="Barrio" registro={register("barrio", { setValueAs: aTextoONulo })} error={e.barrio?.message} />
              {tipoEntrega === "ENVIO_NACIONAL" ? (
                <CampoTexto etiqueta="Ciudad y departamento" placeholder="Cali, Valle" registro={register("ciudad", { setValueAs: aTextoONulo })} error={e.ciudad?.message} />
              ) : (
                <CampoTexto etiqueta="Referencia (opcional)" placeholder="Casa esquinera, portón rosado" registro={register("referencia", { setValueAs: aTextoONulo })} />
              )}
              {perfil && (
                <Controller
                  control={control}
                  name="guardarDireccion"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 text-sm sm:col-span-2">
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} /> Guardar esta dirección en mi cuenta
                    </label>
                  )}
                />
              )}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-suave sm:p-6">
          <h2 className="text-xl font-semibold text-berry">3. Pago</h2>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pago">
            <OpcionTarjeta
              activa={metodoPago === "WOMPI"}
              onClick={() => setValue("metodoPago", "WOMPI")}
              icono={CreditCard}
              titulo="Pagar en línea"
              detalle={wompiActivo ? "Tarjeta, PSE, Nequi o Bancolombia con Wompi" : "No disponible por ahora"}
              deshabilitada={!wompiActivo}
            />
            <OpcionTarjeta
              activa={metodoPago === "CONTRA_ENTREGA"}
              onClick={() => setValue("metodoPago", "CONTRA_ENTREGA")}
              icono={HandCoins}
              titulo="Contra entrega"
              detalle={permiteContraEntrega(tipoEntrega) ? "Pagas al recibir (solo en Popayán)" : "Solo disponible en Popayán"}
              deshabilitada={!permiteContraEntrega(tipoEntrega)}
            />
          </div>
          {e.metodoPago?.message && <p className="text-sm text-destructive">{e.metodoPago.message}</p>}
          <CampoArea etiqueta="Notas para Adri (opcional)" rows={2} placeholder="Ej: es para regalo 🎁" registro={register("notas", { setValueAs: aTextoONulo })} />
          <Controller
            control={control}
            name="aceptaDatos"
            render={({ field }) => (
              <div>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} aria-invalid={e.aceptaDatos ? true : undefined} className="mt-0.5" />
                  <span>
                    Acepto los{" "}
                    <Link href="/terminos" target="_blank" className="text-primary underline">
                      términos
                    </Link>{" "}
                    y autorizo el tratamiento de mis datos según la{" "}
                    <Link href="/privacidad" target="_blank" className="text-primary underline">
                      Política de privacidad
                    </Link>{" "}
                    (Ley 1581 de 2012).
                  </span>
                </label>
                {e.aceptaDatos && <p className="mt-1 text-xs text-destructive">{e.aceptaDatos.message}</p>}
              </div>
            )}
          />
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-3xl bg-white p-5 shadow-suave lg:sticky lg:top-32">
        <h2 className="text-xl font-semibold text-berry">Tu pedido</h2>
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {items.map((i) => (
            <li key={i.varianteId} className="flex items-center gap-3 text-sm">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-nude">
                <Image src={i.imagen ?? IMAGEN_PLACEHOLDER} alt="" fill sizes="48px" className="object-cover" />
                <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-berry text-[0.65rem] text-white">{i.cantidad}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{i.nombre}</span>
                {i.variante !== "Única" && <span className="block text-xs text-muted-foreground">{i.variante}</span>}
              </span>
              <span className="font-medium tabular-nums">{formatoCOP(i.precio * i.cantidad)}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={cuponTexto} onChange={(ev) => setCuponTexto(ev.target.value.toUpperCase())} placeholder="Cupón" aria-label="Código de cupón" className="pl-9" />
          </div>
          <Button type="button" variant="secondary" disabled={!cuponTexto.trim()} onClick={() => setCuponAplicado(cuponTexto.trim())}>
            Aplicar
          </Button>
        </div>

        {cotizacion?.error && <AlertaError mensaje={cotizacion.error} />}
        <dl className="space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{cotizacion ? formatoCOP(cotizacion.subtotal) : "…"}</dd>
          </div>
          {cotizacion && cotizacion.descuento > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Descuento ({cuponAplicado})</dt>
              <dd className="tabular-nums">-{formatoCOP(cotizacion.descuento)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Envío</dt>
            <dd className="tabular-nums">{cotizacion ? (cotizacion.costoEnvio ? formatoCOP(cotizacion.costoEnvio) : "Gratis") : "…"}</dd>
          </div>
          <div className="flex items-end justify-between pt-2">
            <dt className="font-semibold">Total</dt>
            <dd className="text-2xl font-bold text-berry tabular-nums">{cotizacion ? formatoCOP(cotizacion.total) : "…"}</dd>
          </div>
        </dl>

        <Button type="submit" variant="glow" size="lg" className="w-full" disabled={enviando || Boolean(cotizacion?.error)}>
          {enviando ? <LoaderCircle className="animate-spin" aria-hidden /> : metodoPago === "WOMPI" ? <Lock aria-hidden /> : null}
          {metodoPago === "WOMPI" ? "Pagar en línea" : "Confirmar pedido"}
        </Button>
        <Button type="button" variant="whatsapp" size="lg" className="w-full" disabled={enviando || Boolean(cotizacion?.error)} onClick={() => enviar("WHATSAPP")}>
          <MessageCircle aria-hidden /> Enviar pedido por WhatsApp
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Por WhatsApp acordamos el pago contigo (transferencia, Nequi o Daviplata).
        </p>
      </aside>
    </form>
  );
}
