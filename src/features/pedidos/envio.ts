import type { TipoEntrega } from "@prisma/client";

interface ConfigEnvio {
  costoDomicilio: number;
  costoNacional: number;
  envioGratisDesde: number | null;
}

/**
 * Costo de envío según las reglas de entrega:
 * recoger en tienda es gratis; domicilio y envío nacional tienen costo configurable,
 * y son gratis desde el monto mínimo configurado (sobre el valor ya con descuentos).
 */
export function calcularEnvio(tipo: TipoEntrega, valorCompra: number, config: ConfigEnvio): number {
  if (tipo === "RECOGER_EN_TIENDA") return 0;
  if (config.envioGratisDesde !== null && config.envioGratisDesde > 0 && valorCompra >= config.envioGratisDesde) return 0;
  return tipo === "DOMICILIO_POPAYAN" ? config.costoDomicilio : config.costoNacional;
}

/** Contra entrega solo aplica en Popayán (domicilio o recogiendo en la tienda). */
export function permiteContraEntrega(tipo: TipoEntrega) {
  return tipo === "DOMICILIO_POPAYAN" || tipo === "RECOGER_EN_TIENDA";
}
