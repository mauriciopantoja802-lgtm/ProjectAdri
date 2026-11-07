import type { ConfiguracionTienda } from "@prisma/client";

/** Misma forma que la tabla ConfiguracionTienda de la base de datos. */
export type ConfiguracionPublica = ConfiguracionTienda;

/**
 * Valores por defecto de la tienda. Se usan solo si la base de datos todavía no tiene
 * la fila de ConfiguracionTienda (por ejemplo, antes de correr el seed).
 * Los datos reales se editan desde /admin/configuracion.
 */
export const CONFIG_POR_DEFECTO: ConfiguracionPublica = {
  id: "tienda",
  nombre: "Glow by Adri",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "573000000000",
  instagram: "glowbyadri",
  facebook: null,
  tiktok: null,
  direccion: "[DIRECCIÓN DE LA TIENDA]",
  ciudad: "Popayán",
  horario: "[HORARIO DE ATENCIÓN]",
  mapaUrl: null,
  costoDomicilio: 0,
  costoNacional: 0,
  envioGratisDesde: null,
  datosPago: null,
};

export const NAV_TIENDA = [
  { href: "/", etiqueta: "Inicio" },
  { href: "/productos", etiqueta: "Productos" },
  { href: "/productos?oferta=1", etiqueta: "Ofertas" },
  { href: "/sobre-adri", etiqueta: "Sobre Adri" },
  { href: "/contacto", etiqueta: "Contacto" },
] as const;

export const NAV_AYUDA = [
  { href: "/envios-y-devoluciones", etiqueta: "Envíos y devoluciones" },
  { href: "/terminos", etiqueta: "Términos y condiciones" },
  { href: "/privacidad", etiqueta: "Política de privacidad" },
] as const;

/** Testimonios del inicio. Cámbialos por reseñas reales de clientas (con su permiso). */
export const TESTIMONIOS = [
  {
    nombre: "Valentina M.",
    ciudad: "Popayán",
    texto: "Adri me ayudó a encontrar mi tono de base perfecto. ¡La atención es lo mejor y el domicilio llegó el mismo día!",
  },
  {
    nombre: "Daniela O.",
    ciudad: "Popayán",
    texto: "Los labiales mate duran todo el día. Pedí por WhatsApp y fue súper fácil, me respondieron rapidísimo.",
  },
  {
    nombre: "Natalia G.",
    ciudad: "Cali",
    texto: "Me llegó el pedido a Cali bien empacado y con una muestra de regalo. Ya hice mi segunda compra 💖",
  },
];

export const MENSAJE_WHATSAPP_GENERAL =
  "¡Hola Adri! 💖 Vengo de la página web y quiero más información.";
