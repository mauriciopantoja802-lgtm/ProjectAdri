import type { DefaultSession } from "next-auth";
import type { Rol } from "@prisma/client";

// Agrega el id y el rol a los tipos de Auth.js para tener autocompletado y verificación de tipos.
declare module "next-auth" {
  interface User {
    rol: Rol;
  }
  interface Session {
    user: { id: string; rol: Rol } & DefaultSession["user"];
  }
}

// En Auth.js v5 el tipo JWT se define en @auth/core (next-auth/jwt solo lo reexporta).
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}
