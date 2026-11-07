"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { verificarLimite } from "@/lib/limite";
import { prisma } from "@/lib/prisma";
import { requerirSesion } from "@/lib/auth";
import { ejecutar, type Resultado } from "@/lib/acciones";
import { ErrorNegocio } from "@/lib/errores";

const esquemaCambioClave = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual"),
    nueva: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .max(72)
      .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "Debe tener al menos una letra")
      .regex(/\d/, "Debe tener al menos un número"),
  })
  .refine((d) => d.actual !== d.nueva, { path: ["nueva"], error: "La nueva contraseña debe ser diferente" });

/** Cambia la contraseña de quien tiene la sesión (clientas y administradora). */
export async function cambiarContrasena(datos: unknown): Promise<Resultado> {
  return ejecutar(async () => {
    const sesion = await requerirSesion();
    verificarLimite(`clave:${sesion.user.id}`, 5, 15 * 60 * 1000);
    const d = esquemaCambioClave.parse(datos);
    const usuario = await prisma.usuario.findUnique({ where: { id: sesion.user.id }, select: { password: true } });
    if (!usuario || !(await bcrypt.compare(d.actual, usuario.password))) throw new ErrorNegocio("La contraseña actual no es correcta");
    await prisma.usuario.update({ where: { id: sesion.user.id }, data: { password: await bcrypt.hash(d.nueva, 12) } });
    return null;
  }, "Contraseña actualizada 🔒");
}

/** Borra una dirección guardada, solo si pertenece a la clienta con sesión. */
export async function eliminarDireccion(id: string): Promise<Resultado> {
  return ejecutar(async () => {
    const sesion = await requerirSesion();
    const r = await prisma.direccion.deleteMany({ where: { id, clienta: { usuarioId: sesion.user.id } } });
    if (r.count === 0) throw new ErrorNegocio("No encontramos esa dirección");
    revalidatePath("/cuenta");
    return null;
  }, "Dirección eliminada");
}
