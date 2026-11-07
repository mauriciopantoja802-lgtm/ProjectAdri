import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Receipt, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { TarjetaMetrica } from "@/components/admin/tarjeta-metrica";
import { InsigniaCanal, InsigniaEstado } from "@/components/admin/pedidos/insignias";
import { obtenerClienta } from "@/features/clientas/queries";
import { ESTADOS_VENTA } from "@/features/reportes/queries";
import { crearEnlaceWhatsapp } from "@/features/whatsapp/enlaces";
import { formatoCOP, formatoFecha } from "@/lib/formato";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Clienta" };

export default async function DetalleClienta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await obtenerClienta(id);
  if (!c) notFound();
  const ventas = c.pedidos.filter((p) => ESTADOS_VENTA.includes(p.estado));
  const total = ventas.reduce((t, p) => t + p.total, 0);

  return (
    <>
      <Link href="/admin/clientas" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        <ArrowLeft aria-hidden /> Clientas
      </Link>
      <EncabezadoPagina titulo={c.nombre} descripcion={[c.telefono.replace(/^57/, ""), c.email ?? c.usuario?.email].filter(Boolean).join(" · ")}>
        <a
          href={crearEnlaceWhatsapp(c.telefono, `¡Hola ${c.nombre.split(" ")[0]}! 💖 Te escribe Adri de Glow by Adri.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "whatsapp" }))}
        >
          <MessageCircle aria-hidden /> Escribir por WhatsApp
        </a>
      </EncabezadoPagina>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <TarjetaMetrica titulo="Total gastado" valor={formatoCOP(total)} icono={Wallet} />
        <TarjetaMetrica titulo="Compras" valor={String(ventas.length)} detalle={`${c.pedidos.length} pedido(s) en total`} icono={Receipt} />
        <TarjetaMetrica titulo="Ticket promedio" valor={formatoCOP(ventas.length ? Math.round(total / ventas.length) : 0)} icono={Receipt} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="overflow-hidden rounded-3xl bg-white shadow-suave">
          <h2 className="p-5 pb-2 text-lg font-semibold text-berry">Historial de pedidos</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {c.pedidos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/pedidos/${p.id}`} className="font-semibold text-primary hover:underline">
                      {p.codigo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{formatoFecha(p.creadoEn)}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <InsigniaCanal canal={p.canal} />
                  </TableCell>
                  <TableCell>
                    <InsigniaEstado estado={p.estado} />
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatoCOP(p.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
        <section className="h-fit rounded-3xl bg-white p-5 shadow-suave">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-berry">
            <MapPin className="size-5 text-primary" aria-hidden /> Direcciones
          </h2>
          {c.direcciones.length ? (
            <ul className="space-y-2 text-sm">
              {c.direcciones.map((d) => (
                <li key={d.id} className="rounded-2xl bg-nude p-3">
                  {d.direccion}
                  <span className="block text-xs text-muted-foreground">{[d.barrio, d.ciudad, d.referencia].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Sin direcciones guardadas.</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            {c.usuario ? `Tiene cuenta en la web desde ${formatoFecha(c.usuario.creadoEn)}.` : "Compra sin cuenta (registrada desde el POS, WhatsApp o como invitada)."}
          </p>
        </section>
      </div>
    </>
  );
}
