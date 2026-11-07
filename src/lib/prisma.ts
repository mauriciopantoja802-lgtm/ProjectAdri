import { PrismaClient } from "@prisma/client";

/**
 * Cliente único de Prisma.
 * En desarrollo, Next.js recarga los módulos en cada cambio; sin este truco se abriría
 * una conexión nueva a la base de datos en cada recarga hasta agotar el límite.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalParaPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
