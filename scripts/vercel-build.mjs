/**
 * Build para Vercel: revisa las variables de entorno, aplica las migraciones y compila.
 * Vercel lo ejecuta solo (script "vercel-build" de package.json).
 */
import { execSync } from "node:child_process";

const env = process.env;

// Neon conectado desde Vercel crea DATABASE_URL (pooled) y DATABASE_URL_UNPOOLED (directa).
// Si no definiste DIRECT_URL, usamos la directa que exista; como último recurso, DATABASE_URL.
if (!env.DIRECT_URL) {
  // Ojo: asignar `undefined` a process.env lo convierte en el texto "undefined"; solo se asigna si hay valor.
  const directa = env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL_NON_POOLING || env.DATABASE_URL;
  if (directa) {
    env.DIRECT_URL = directa;
    console.log("ℹ️  DIRECT_URL no estaba definida: se usará la conexión directa disponible.");
  }
}

const errores = [];
if (!env.DATABASE_URL) errores.push("DATABASE_URL: conexión a PostgreSQL (en Neon, la URL con “-pooler”).");
if (!env.AUTH_SECRET) errores.push("AUTH_SECRET: genera uno con `npx auth secret` (o `openssl rand -base64 32`).");
if (env.DATABASE_URL && /@(localhost|127\.0\.0\.1)[:/]/.test(env.DATABASE_URL)) {
  errores.push("DATABASE_URL apunta a localhost (tu computador). Vercel no puede conectarse ahí: usa la URL de Neon o Supabase.");
}

if (errores.length) {
  console.error("\n❌ Faltan variables de entorno en Vercel (Settings → Environment Variables):\n");
  for (const e of errores) console.error(`   • ${e}`);
  console.error("\n   Después de agregarlas, vuelve a desplegar (Deployments → ⋯ → Redeploy).\n");
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SITE_URL) {
  console.warn("⚠️  NEXT_PUBLIC_SITE_URL no está definida: los enlaces de Wompi, el sitemap y Open Graph usarán localhost. Defínela con tu dominio (ej. https://glowbyadri.vercel.app).");
}

const correr = (cmd) => execSync(cmd, { stdio: "inherit", env });
correr("npx prisma generate");
correr("npx prisma migrate deploy");
correr("npx next build");
