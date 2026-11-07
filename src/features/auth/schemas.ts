import { z } from "zod";

/** Se usan igual en el navegador (React Hook Form) y en el servidor (Server Actions). */

const correo = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu correo")
  .pipe(z.email("Escribe un correo válido"));

export const esquemaLogin = z.object({
  email: correo,
  password: z.string().min(1, "Escribe tu contraseña").max(72, "Contraseña demasiado larga"),
});

export const esquemaRegistro = z
  .object({
    nombre: z.string().trim().min(3, "Escribe tu nombre completo").max(80, "Máximo 80 caracteres"),
    email: correo,
    telefono: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^(57)?3\d{9}$/, "Escribe un celular colombiano de 10 dígitos, ej: 300 123 4567")),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      // bcrypt solo tiene en cuenta los primeros 72 bytes
      .max(72, "Máximo 72 caracteres")
      .regex(/[A-Za-zÁÉÍÓÚáéíóúÑñ]/, "Debe tener al menos una letra")
      .regex(/\d/, "Debe tener al menos un número"),
    confirmar: z.string().min(1, "Repite tu contraseña"),
    aceptaDatos: z.boolean().refine((v) => v, "Debes aceptar la política de tratamiento de datos"),
  })
  .refine((d) => d.password === d.confirmar, {
    path: ["confirmar"],
    error: "Las contraseñas no coinciden",
  });

export type DatosLogin = z.input<typeof esquemaLogin>;
export type DatosRegistro = z.input<typeof esquemaRegistro>;
