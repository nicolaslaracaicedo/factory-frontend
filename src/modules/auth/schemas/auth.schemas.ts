import { z } from "zod";

export const loginSchema = z.object({
  ruc: z
    .string({ error: "El RUC es requerido." })
    .trim()
    .length(13, "El RUC debe tener 13 digitos."),
  cedula: z
    .string({ error: "La cedula es requerida." })
    .trim()
    .length(10, "La cedula debe tener 10 digitos."),
  clave: z
    .string({ error: "La contrasena es requerida." })
    .min(8, "La contrasena debe tener al menos 8 caracteres.")
    .regex(/[A-Z]/, "Debe contener una mayuscula.")
    .regex(/[a-z]/, "Debe contener una minuscula.")
    .regex(/[0-9]/, "Debe contener un numero."),
});

export const registerSchema = z
  .object({
    ruc: z.string().trim().min(10, "RUC invalido."),
    identificacion: z.string().trim().min(8, "Identificacion invalida."),
    nombre: z
      .string()
      .trim()
      .min(2, "Nombre invalido.")
      .max(60, "El nombre no debe exceder 60 caracteres.")
      .regex(/^[a-zA-ZáéíóúüñÑ\s-]+$/, "Solo se permiten letras y espacios."),
    apellido: z
      .string()
      .trim()
      .min(2, "Apellido invalido.")
      .max(60, "El apellido no debe exceder 60 caracteres.")
      .regex(/^[a-zA-ZáéíóúüñÑ\s-]+$/, "Solo se permiten letras y espacios."),
    email: z.email("Correo invalido."),
    password: z
      .string()
      .min(8, "Debe tener al menos 8 caracteres.")
      .regex(/[A-Z]/, "Debe contener una mayuscula.")
      .regex(/[a-z]/, "Debe contener una minuscula.")
      .regex(/[0-9]/, "Debe contener un numero."),
    confirmPassword: z.string().min(8, "Confirma tu clave."),
    direccion: z
      .string()
      .trim()
      .min(2, "Direccion invalida.")
      .max(200, "La direccion no debe exceder 200 caracteres."),
    telefono: z
      .string()
      .trim()
      .length(10, "El telefono debe tener 10 digitos.")
      .regex(/^0/, "Debe comenzar con 0.")
      .regex(/^\d+$/, "Solo se permiten numeros."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las claves no coinciden.",
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
