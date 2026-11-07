import type { Metadata } from "next";
import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EncabezadoPagina } from "@/components/compartidos/encabezado-pagina";
import { BotonConfirmarServidor } from "@/components/admin/boton-confirmar-servidor";
import { DialogoBanner, DialogoCupon, FormularioPlantillas, FormularioTienda } from "@/components/admin/configuracion/formularios-configuracion";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { eliminarBanner, eliminarCupon } from "@/features/configuracion/actions";
import { obtenerPlantillas } from "@/features/whatsapp/plantillas";
import { prisma } from "@/lib/prisma";
import { claveDiaBogota, formatoCOP, formatoFecha } from "@/lib/formato";

export const metadata: Metadata = { title: "Configuración" };

export default async function Configuracion() {
  const [config, plantillas, cupones, banners] = await Promise.all([
    obtenerConfiguracion(),
    obtenerPlantillas(),
    prisma.cupon.findMany({ orderBy: { codigo: "asc" } }),
    prisma.banner.findMany({ orderBy: { orden: "asc" } }),
  ]);

  return (
    <>
      <EncabezadoPagina titulo="Configuración" descripcion="Datos de la tienda, envíos, mensajes de WhatsApp, cupones y banners." />
      <Tabs defaultValue="tienda">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="tienda">Tienda y envíos</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas WhatsApp</TabsTrigger>
          <TabsTrigger value="cupones">Cupones</TabsTrigger>
          <TabsTrigger value="banners">Banners</TabsTrigger>
        </TabsList>

        <TabsContent value="tienda">
          <FormularioTienda
            inicial={{
              nombre: config.nombre,
              whatsapp: config.whatsapp.replace(/^57/, ""),
              instagram: config.instagram,
              facebook: config.facebook,
              tiktok: config.tiktok,
              direccion: config.direccion,
              ciudad: config.ciudad,
              horario: config.horario,
              mapaUrl: config.mapaUrl,
              costoDomicilio: config.costoDomicilio,
              costoNacional: config.costoNacional,
              envioGratisDesde: config.envioGratisDesde,
              datosPago: config.datosPago,
            }}
          />
        </TabsContent>

        <TabsContent value="plantillas">
          <FormularioPlantillas plantillas={plantillas} />
        </TabsContent>

        <TabsContent value="cupones">
          <div className="mb-3 flex justify-end">
            <DialogoCupon disparador={<Button variant="glow"><Plus aria-hidden /> Nuevo cupón</Button>} />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cupones.map((c) => {
              const vencido = c.venceEn !== null && c.venceEn < new Date();
              return (
                <li key={c.id} className="rounded-3xl bg-white p-4 shadow-suave">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-lg font-bold text-berry">{c.codigo}</p>
                      <p className="text-sm">{c.porcentaje ? `${c.porcentaje}% de descuento` : `${formatoCOP(c.valorFijo ?? 0)} de descuento`}</p>
                    </div>
                    <div className="flex">
                      <DialogoCupon
                        cupon={{
                          id: c.id,
                          codigo: c.codigo,
                          tipo: c.porcentaje ? "porcentaje" : "valor",
                          valor: c.porcentaje ?? c.valorFijo ?? 0,
                          minimoCompra: c.minimoCompra,
                          usosMaximos: c.usosMaximos,
                          venceEn: c.venceEn ? claveDiaBogota(c.venceEn) : null,
                          activo: c.activo,
                        }}
                        disparador={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${c.codigo}`}><Pencil aria-hidden /></Button>}
                      />
                      <BotonConfirmarServidor
                        titulo={`¿Eliminar el cupón ${c.codigo}?`}
                        descripcion="Si ya se usó en pedidos, se desactivará para conservar el historial."
                        accion={eliminarCupon.bind(null, c.id)}
                        etiqueta={`Eliminar ${c.codigo}`}
                        icono={<Trash2 className="text-destructive" aria-hidden />}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Mínimo {formatoCOP(c.minimoCompra)} · {c.usos}/{c.usosMaximos ?? "∞"} usos{c.venceEn && ` · vence ${formatoFecha(c.venceEn)}`}
                  </p>
                  <div className="mt-2">{!c.activo ? <Badge variant="outline">Inactivo</Badge> : vencido ? <Badge variant="outline">Vencido</Badge> : <Badge className="bg-green-100 text-green-800">Activo</Badge>}</div>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="banners">
          <div className="mb-3 flex justify-end">
            <DialogoBanner disparador={<Button variant="glow"><Plus aria-hidden /> Nuevo banner</Button>} />
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {banners.map((b) => (
              <li key={b.id} className="overflow-hidden rounded-3xl bg-white shadow-suave">
                <div className="relative aspect-[12/5]">
                  <Image src={b.imagen} alt="" fill sizes="600px" className="object-cover" />
                  {!b.activo && <span className="absolute inset-0 flex items-center justify-center bg-white/70 font-semibold">Oculto</span>}
                </div>
                <div className="flex items-start justify-between gap-2 p-4">
                  <div>
                    <p className="font-semibold">
                      #{b.orden} · {b.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.subtitulo} {b.enlace && `→ ${b.enlace}`}</p>
                  </div>
                  <div className="flex">
                    <DialogoBanner
                      banner={{ id: b.id, titulo: b.titulo, subtitulo: b.subtitulo, imagen: b.imagen, enlace: b.enlace, orden: b.orden, activo: b.activo }}
                      disparador={<Button variant="ghost" size="icon-sm" aria-label={`Editar ${b.titulo}`}><Pencil aria-hidden /></Button>}
                    />
                    <BotonConfirmarServidor
                      titulo="¿Eliminar este banner?"
                      descripcion="Dejará de mostrarse en el inicio."
                      accion={eliminarBanner.bind(null, b.id)}
                      etiqueta={`Eliminar ${b.titulo}`}
                      icono={<Trash2 className="text-destructive" aria-hidden />}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </>
  );
}
