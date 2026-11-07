import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { obtenerSesionAdmin } from "@/lib/auth";

/**
 * Firma las subidas a Cloudinary (las usa el widget de next-cloudinary).
 * Solo una ADMIN puede pedir firmas, y el secreto de la API nunca sale del servidor.
 * Algoritmo de Cloudinary: SHA-1 de "clave=valor&..." (ordenado) + API secret.
 */
export async function POST(request: Request) {
  if (!(await obtenerSesionAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const secreto = process.env.CLOUDINARY_API_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "Cloudinary no está configurado" }, { status: 500 });
  }

  const cuerpo = (await request.json().catch(() => null)) as { paramsToSign?: Record<string, unknown> } | null;
  const parametros = cuerpo?.paramsToSign;
  if (!parametros || typeof parametros !== "object") {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  // Obligamos a que todo quede en la carpeta de la tienda.
  if (typeof parametros.folder === "string" && !parametros.folder.startsWith("glow-by-adri")) {
    return NextResponse.json({ error: "Carpeta no permitida" }, { status: 400 });
  }

  const cadena = Object.keys(parametros)
    .filter((k) => !["file", "cloud_name", "resource_type", "api_key"].includes(k) && parametros[k] !== "")
    .sort()
    .map((k) => `${k}=${Array.isArray(parametros[k]) ? (parametros[k] as unknown[]).join(",") : String(parametros[k])}`)
    .join("&");

  const signature = createHash("sha1").update(cadena + secreto).digest("hex");
  return NextResponse.json({ signature });
}
