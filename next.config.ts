import type { NextConfig } from "next";
import { HOSTS_IMAGENES } from "./src/lib/imagenes";

const esDesarrollo = process.env.NODE_ENV !== "production";

/**
 * Política de seguridad de contenido (CSP): limita desde dónde se pueden cargar scripts,
 * imágenes, iframes y conexiones. Si alguien lograra inyectar código, no podría enviar datos
 * a un servidor externo ni cargar scripts de otros dominios.
 * - Cloudinary: widget de subida de imágenes (solo en el panel).
 * - Google Maps: iframe del mapa "Visítanos".
 * - Wompi: la clienta es redirigida a checkout.wompi.co (navegación, no se incrusta).
 * 'unsafe-inline' en scripts es necesario para los scripts de arranque de Next.js sin nonces.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${esDesarrollo ? "'unsafe-eval'" : ""} https://upload-widget.cloudinary.com https://widget.cloudinary.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${HOSTS_IMAGENES.map((h) => `https://${h}`).join(" ")}`,
  "font-src 'self'",
  `connect-src 'self' https://api.cloudinary.com https://upload-widget.cloudinary.com https://sandbox.wompi.co https://production.wompi.co ${esDesarrollo ? "ws:" : ""}`,
  "frame-src https://www.google.com https://upload-widget.cloudinary.com https://widget.cloudinary.com",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // Solo si el sitio corre en HTTPS (Vercel). En `npm start` local por http rompería las peticiones.
  ...((process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  // Permite compilar en otra carpeta (ej: NEXT_DIST_DIR=.next-prod) sin chocar con `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  images: {
    // Dominios desde los que next/image puede optimizar imágenes (Cloudinary y las de ejemplo del seed).
    remotePatterns: HOSTS_IMAGENES.map((hostname) => ({ protocol: "https" as const, hostname })),
    // placehold.co entrega SVG si no se pide PNG; por seguridad no se permiten SVG remotos.
    dangerouslyAllowSVG: false,
  },
  // Librerías pesadas de servidor que no deben empaquetarse (generación de PDF y Excel).
  serverExternalPackages: ["@react-pdf/renderer", "exceljs"],
  experimental: {
    // Fotos y PDF de facturas (máx. 8 MB) para el lector con IA
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: 'camera=(self "https://upload-widget.cloudinary.com"), microphone=(), geolocation=(), payment=()' },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
      {
        // El panel y la API nunca se guardan en cachés intermedias
        source: "/(admin|api)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
