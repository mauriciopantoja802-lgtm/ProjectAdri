import "server-only";
import { crearEnlaceWhatsapp } from "./enlaces";

/**
 * Punto único para enviar mensajes de WhatsApp a las clientas.
 *
 * Hoy se usa `EnlaceWaMe`: genera un enlace wa.me que Adri abre con un clic y envía desde su
 * propio WhatsApp. Cuando el negocio tenga la API oficial de WhatsApp Business (Meta Cloud API),
 * basta con completar `MetaCloudApi` y definir las variables de entorno: el resto del sistema
 * no cambia porque todo usa esta interfaz.
 */
export interface ResultadoEnvio {
  /** "enlace": hay que abrir la URL para enviar; "enviado": la API ya lo envió. */
  modo: "enlace" | "enviado";
  url?: string;
  idMensaje?: string;
}

export interface ServicioWhatsapp {
  enviarTexto(telefono: string, mensaje: string): Promise<ResultadoEnvio>;
}

class EnlaceWaMe implements ServicioWhatsapp {
  async enviarTexto(telefono: string, mensaje: string): Promise<ResultadoEnvio> {
    return { modo: "enlace", url: crearEnlaceWhatsapp(telefono, mensaje) };
  }
}

/**
 * Preparado para el futuro (NO implementado todavía).
 * Requiere: WHATSAPP_CLOUD_TOKEN y WHATSAPP_PHONE_NUMBER_ID.
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api/messages/text-messages
 * Nota: fuera de la ventana de 24 h, Meta solo permite enviar plantillas aprobadas.
 */
class MetaCloudApi implements ServicioWhatsapp {
  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string,
  ) {}

  async enviarTexto(_telefono: string, _mensaje: string): Promise<ResultadoEnvio> {
    // POST https://graph.facebook.com/v21.0/{phoneNumberId}/messages
    //   headers: Authorization: Bearer {token}
    //   body: { messaging_product: "whatsapp", to: telefono, type: "text", text: { body: mensaje } }
    void this.token;
    void this.phoneNumberId;
    throw new Error("La integración con WhatsApp Cloud API aún no está implementada");
  }
}

export function obtenerServicioWhatsapp(): ServicioWhatsapp {
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneId && process.env.WHATSAPP_USAR_API === "true") return new MetaCloudApi(token, phoneId);
  return new EnlaceWaMe();
}
