import "server-only";
import type { EstadoPedido, Pedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatoCOP } from "@/lib/formato";
import { obtenerConfiguracion } from "@/features/configuracion/queries";
import { crearEnlaceWhatsapp } from "./enlaces";
import { PLANTILLAS_WHATSAPP, rellenarPlantilla, type ClavePlantilla } from "./mensajes";

/** Plantilla sugerida según el estado del pedido ("Escribir a la clienta"). */
export const PLANTILLA_POR_ESTADO: Partial<Record<EstadoPedido, ClavePlantilla>> = {
  PENDIENTE: "DATOS_PAGO",
  CONFIRMADO: "PEDIDO_CONFIRMADO",
  PAGADO: "PEDIDO_CONFIRMADO",
  EN_PREPARACION: "PEDIDO_CONFIRMADO",
  ENVIADO: "ENVIADO",
  LISTO_PARA_RECOGER: "LISTO_RECOGER",
  ENTREGADO: "GRACIAS",
};

export async function obtenerPlantillas() {
  const guardadas = await prisma.plantillaWhatsapp.findMany();
  const porClave = new Map(guardadas.map((p) => [p.clave, p.mensaje]));
  return (Object.keys(PLANTILLAS_WHATSAPP) as ClavePlantilla[]).map((clave) => ({
    clave,
    etiqueta: PLANTILLAS_WHATSAPP[clave],
    mensaje: porClave.get(clave) ?? "",
  }));
}

/** Todas las plantillas ya rellenadas con los datos del pedido, con su enlace wa.me a la clienta. */
export async function mensajesParaPedido(pedido: Pick<Pedido, "codigo" | "nombreClienta" | "total" | "telefono" | "estado">) {
  const [plantillas, config] = await Promise.all([obtenerPlantillas(), obtenerConfiguracion()]);
  const variables = {
    nombre: pedido.nombreClienta?.split(" ")[0] ?? "",
    codigo: pedido.codigo,
    total: formatoCOP(pedido.total),
    direccionTienda: `${config.direccion} (${config.horario})`,
    datosPago: config.datosPago ?? "",
  };
  const sugerida = PLANTILLA_POR_ESTADO[pedido.estado];
  return {
    sugerida: sugerida ?? null,
    mensajes: plantillas
      .filter((p) => p.mensaje)
      .map((p) => {
        const texto = rellenarPlantilla(p.mensaje, variables);
        return { ...p, texto, url: pedido.telefono ? crearEnlaceWhatsapp(pedido.telefono, texto) : null };
      }),
  };
}
