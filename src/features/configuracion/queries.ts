import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { CONFIG_POR_DEFECTO, type ConfiguracionPublica } from "@/lib/constantes";

/**
 * Lee la configuración de la tienda (dirección, horario, WhatsApp…).
 * `cache` evita repetir la consulta si el header, el footer y la página la piden
 * en la misma petición. Si la base de datos no responde, la tienda sigue mostrándose
 * con los valores por defecto en vez de romperse.
 */
export const obtenerConfiguracion = cache(async (): Promise<ConfiguracionPublica> => {
  try {
    const config = await prisma.configuracionTienda.findUnique({ where: { id: "tienda" } });
    return config ?? CONFIG_POR_DEFECTO;
  } catch (error) {
    console.error("[configuracion] No se pudo leer la configuración de la tienda:", error);
    return CONFIG_POR_DEFECTO;
  }
});
