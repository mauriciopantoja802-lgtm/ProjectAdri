import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * Protege las rutas privadas. Las reglas están en authConfig.callbacks.authorized:
 * - /admin   → solo ADMIN
 * - /cuenta  → cualquier usuaria con sesión
 * - /login y /registro → redirigen si ya hay sesión
 */
export default NextAuth(authConfig).auth;

export const config = {
  // Solo se ejecuta en estas rutas; el resto de la tienda no paga el costo del middleware.
  matcher: ["/admin/:path*", "/cuenta/:path*", "/login", "/registro"],
};
