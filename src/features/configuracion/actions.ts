"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requerirAdmin } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { revalidarTienda } from "@/lib/revalidar";
import { esquemaBanner, esquemaCupon, esquemaPlantillas, esquemaTienda } from "./schemas";

function refrescar() {
  revalidatePath("/admin/configuracion");
  revalidarTienda();
}

export async function guardarTienda(datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaTienda.parse(datos);
    const instagram = d.instagram?.replace(/^@/, "") ?? null;
    const data = { ...d, instagram, whatsapp: d.whatsapp.length === 10 ? `57${d.whatsapp}` : d.whatsapp };
    await prisma.configuracionTienda.upsert({ where: { id: "tienda" }, create: { id: "tienda", ...data }, update: data });
    refrescar();
    return null;
  }, "Datos de la tienda guardados");
}

export async function guardarPlantillas(datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaPlantillas.parse(datos);
    await prisma.$transaction(
      d.plantillas.map((p) =>
        prisma.plantillaWhatsapp.upsert({ where: { clave: p.clave }, create: p, update: { mensaje: p.mensaje } }),
      ),
    );
    refrescar();
    return null;
  }, "Plantillas guardadas");
}

export async function guardarCupon(id: string | null, datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaCupon.parse(datos);
    const data = {
      codigo: d.codigo,
      porcentaje: d.tipo === "porcentaje" ? d.valor : null,
      valorFijo: d.tipo === "valor" ? d.valor : null,
      minimoCompra: d.minimoCompra,
      usosMaximos: d.usosMaximos,
      // Vence al final del día indicado (hora de Bogotá)
      venceEn: d.venceEn ? new Date(`${d.venceEn}T23:59:59-05:00`) : null,
      activo: d.activo,
    };
    if (id) await prisma.cupon.update({ where: { id }, data });
    else await prisma.cupon.create({ data });
    refrescar();
    return null;
  }, id ? "Cupón actualizado" : "Cupón creado");
}

export async function eliminarCupon(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    // Si ya se usó en pedidos, se desactiva para conservar el historial.
    const usado = await prisma.pedido.count({ where: { cuponId: id } });
    if (usado) await prisma.cupon.update({ where: { id }, data: { activo: false } });
    else await prisma.cupon.delete({ where: { id } });
    refrescar();
    return null;
  }, "Cupón eliminado");
}

export async function guardarBanner(id: string | null, datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    const d = esquemaBanner.parse(datos);
    if (id) await prisma.banner.update({ where: { id }, data: d });
    else await prisma.banner.create({ data: d });
    refrescar();
    return null;
  }, id ? "Banner actualizado" : "Banner creado");
}

export async function eliminarBanner(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    await requerirAdmin();
    await prisma.banner.delete({ where: { id } });
    refrescar();
    return null;
  }, "Banner eliminado");
}
