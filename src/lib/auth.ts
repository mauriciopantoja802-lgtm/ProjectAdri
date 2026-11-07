import "server-only";
import NextAuth, { CredentialsSignin, type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import { esquemaLogin } from "@/features/auth/schemas";

/**
 * Hash de una contraseña aleatoria que nadie conoce. Si el correo no existe, comparamos
 * contra este hash para que la respuesta tarde lo mismo: así no se puede averiguar
 * qué correos están registrados midiendo el tiempo de respuesta.
 */
const HASH_FALSO = "$2b$12$ecdlY/V01RnlGlo0OrzcSOz/EQ3P0532YImd8/vcEoasM/tQyjtB2";

/** Error de login por demasiados intentos (se muestra con un mensaje distinto). */
export class LoginBloqueado extends CredentialsSignin {
  code = "limite";
}

// Intentos FALLIDOS de login por IP + correo: máximo 8 cada 15 minutos. Frena a quien intente
// adivinar contraseñas, también si llama directo a /api/auth/callback/credentials.
// Un ingreso correcto reinicia el contador (entrar varias veces desde distintos equipos no bloquea).
const VENTANA_FALLOS = 15 * 60 * 1000;
const fallos = new Map<string, number[]>();
function fallosRecientes(clave: string) {
  const ahora = Date.now();
  const lista = (fallos.get(clave) ?? []).filter((t) => ahora - t < VENTANA_FALLOS);
  fallos.set(clave, lista);
  return lista;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credenciales, request) {
        const datos = esquemaLogin.safeParse(credenciales);
        if (!datos.success) return null;
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
        const clave = `${ip}:${datos.data.email}`;
        if (fallosRecientes(clave).length >= 8) throw new LoginBloqueado();

        const usuario = await prisma.usuario.findUnique({ where: { email: datos.data.email } });
        const claveValida = await bcrypt.compare(datos.data.password, usuario?.password ?? HASH_FALSO);
        if (!usuario || !claveValida) {
          fallos.set(clave, [...fallosRecientes(clave), Date.now()]);
          return null;
        }

        fallos.delete(clave); // ingreso correcto: se reinicia el contador
        return { id: usuario.id, name: usuario.nombre, email: usuario.email, rol: usuario.rol };
      },
    }),
  ],
});

export class ErrorNoAutorizado extends Error {
  constructor(mensaje = "No tienes permiso para realizar esta acción") {
    super(mensaje);
    this.name = "ErrorNoAutorizado";
  }
}

/**
 * Devuelve la sesión solo si es de una ADMIN, o null.
 * Además del rol guardado en la cookie, confirma el rol en la base de datos: si a alguien
 * le quitan el rol de administradora, pierde el acceso de inmediato y no cuando expire la cookie.
 */
export async function obtenerSesionAdmin(): Promise<Session | null> {
  const sesion = await auth();
  if (!sesion?.user?.id || sesion.user.rol !== "ADMIN") return null;
  const usuario = await prisma.usuario.findUnique({ where: { id: sesion.user.id }, select: { rol: true } });
  return usuario?.rol === "ADMIN" ? sesion : null;
}

/**
 * Llamar al inicio de CADA Server Action de administración.
 * Las Server Actions se pueden invocar directamente por HTTP, así que el middleware
 * no basta: cada acción debe verificar el rol por su cuenta.
 */
export async function requerirAdmin(): Promise<Session> {
  const sesion = await obtenerSesionAdmin();
  if (!sesion) throw new ErrorNoAutorizado();
  return sesion;
}

/** Para acciones de la clienta (direcciones, historial): exige una sesión iniciada. */
export async function requerirSesion(): Promise<Session> {
  const sesion = await auth();
  if (!sesion?.user?.id) throw new ErrorNoAutorizado("Debes iniciar sesión");
  return sesion;
}
