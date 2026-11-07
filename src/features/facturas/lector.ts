import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ErrorNegocio } from "@/lib/errores";
import { esquemaFacturaExtraida, type FacturaExtraida } from "./schemas";

/**
 * Lee la foto o el PDF de una factura de proveedor con Claude (visión + salida estructurada).
 * La respuesta llega validada contra `esquemaFacturaExtraida`, así que no hay que interpretar texto libre.
 * Requiere ANTHROPIC_API_KEY en el entorno.
 */
export function lectorDisponible() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const INSTRUCCIONES = `Eres asistente de inventario de "Glow by Adri", una tienda de maquillaje en Popayán, Colombia.
Recibirás la foto o el PDF de una factura (o remisión) de un proveedor de cosméticos y debes extraer sus datos.

Cómo leer los valores:
- Los montos están en pesos colombianos. En Colombia el punto separa miles y la coma los decimales: "$1.234.567,50" = 1234567.5. Devuelve enteros (redondea).
- costoUnitario es lo que la tienda paga por UNA unidad al final: incluye el IVA y los descuentos de esa línea. Si la factura muestra el IVA aparte (por línea o total), súmalo proporcionalmente al costo unitario y explícalo en "observaciones".
- Si una línea trae "caja x 12", "docena" o un empaque, la cantidad son las UNIDADES individuales que se venderán y el costo es por unidad.
- Separa el nombre del producto de su tono: "LABIAL MATE VOGUE TONO 03 ROSA NUDE" → nombreProducto "Labial Mate", marca "Vogue", tono "Tono 03 - Rosa Nude".
- Una entrada en "items" por cada línea de producto. Ignora líneas de fletes, retenciones, subtotales y totales.
- No inventes nada: si un dato no se ve o no es legible, usa null y menciónalo en "observaciones".`;

const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type TipoImagen = (typeof TIPOS_IMAGEN)[number];

export async function leerFacturaConIA(base64: string, tipo: string): Promise<FacturaExtraida> {
  if (!lectorDisponible()) {
    throw new ErrorNegocio("El lector de facturas no está configurado (falta ANTHROPIC_API_KEY en el servidor).");
  }
  const archivo: Anthropic.Beta.BetaContentBlockParam =
    tipo === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : TIPOS_IMAGEN.includes(tipo as TipoImagen)
        ? { type: "image", source: { type: "base64", media_type: tipo as TipoImagen, data: base64 } }
        : (() => {
            throw new ErrorNegocio("Formato no soportado. Usa una foto (JPG, PNG, WebP) o un PDF.");
          })();

  const cliente = new Anthropic();
  try {
    const respuesta = await cliente.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      // Si el modelo declina por un falso positivo de seguridad, la API reintenta con el modelo de respaldo.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium", format: zodOutputFormat(esquemaFacturaExtraida) },
      system: INSTRUCCIONES,
      messages: [{ role: "user", content: [archivo, { type: "text", text: "Extrae los datos de esta factura de proveedor." }] }],
    });

    if (respuesta.stop_reason === "refusal") throw new ErrorNegocio("No fue posible leer este documento. Prueba con otra foto o regístralo manualmente.");
    if (respuesta.stop_reason === "max_tokens") throw new ErrorNegocio("La factura es demasiado larga para leerla de una vez. Divídela en partes (por páginas).");
    if (!respuesta.parsed_output) throw new ErrorNegocio("No pudimos entender la factura. Toma una foto más nítida, de frente y con buena luz.");
    return respuesta.parsed_output;
  } catch (error) {
    if (error instanceof ErrorNegocio) throw error;
    if (error instanceof Anthropic.AuthenticationError) throw new ErrorNegocio("La llave de la API de Anthropic no es válida (revisa ANTHROPIC_API_KEY).");
    if (error instanceof Anthropic.RateLimitError) throw new ErrorNegocio("El lector está ocupado. Intenta de nuevo en un minuto.");
    if (error instanceof Anthropic.BadRequestError) throw new ErrorNegocio("El archivo no se pudo procesar. Verifica que la imagen o el PDF no estén dañados.");
    if (error instanceof Anthropic.APIError) throw new ErrorNegocio("El servicio de lectura no respondió. Intenta de nuevo en unos minutos.");
    throw error;
  }
}
