import type { NextAuthConfig } from "next-auth";

/**
 * Configuración de Auth.js que se puede usar en el middleware.
 * Aquí NO va nada que dependa de Prisma ni de bcrypt: el middleware corre antes de cada
 * petición en un entorno liviano. El proveedor de correo/contraseña se agrega en lib/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  // Con usuario y contraseña, Auth.js exige sesiones JWT (cookie cifrada, sin tabla de sesiones).
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 días
  trustHost: true,
  providers: [],
  callbacks: {
    /** Decide en el middleware quién puede entrar a cada ruta. */
    authorized({ auth, request: { nextUrl } }) {
      const logueada = Boolean(auth?.user);
      const esAdmin = auth?.user?.rol === "ADMIN";
      const ruta = nextUrl.pathname;

      if (ruta.startsWith("/admin")) {
        if (esAdmin) return true;
        // Una clienta con sesión no tiene nada que hacer en el panel: la mandamos al inicio.
        if (logueada) return Response.redirect(new URL("/", nextUrl));
        return false; // sin sesión → /login?callbackUrl=...
      }

      if (ruta.startsWith("/cuenta")) return logueada;

      // Si ya inició sesión, no tiene sentido mostrarle el login o el registro.
      if ((ruta === "/login" || ruta === "/registro") && logueada) {
        return Response.redirect(new URL(esAdmin ? "/admin" : "/cuenta", nextUrl));
      }

      return true;
    },
    /** Guarda el id y el rol dentro del token al iniciar sesión. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rol = user.rol;
      }
      return token;
    },
    /** Expone el id y el rol en la sesión (auth() y useSession()). */
    session({ session, token }) {
      session.user.id = token.id;
      session.user.rol = token.rol;
      return session;
    },
  },
} satisfies NextAuthConfig;
