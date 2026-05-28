import { z } from "zod";

export const puntoEmisionSchema = z.object({
  establecimientoId: z
    .string("Debe seleccionar un establecimiento")
    .min(1, "Debe seleccionar un establecimiento"),
  codigo: z
    .string("El código es obligatorio")
    .min(1, "El código es obligatorio")
    .regex(/^\d{3}$/, "El código debe tener exactamente 3 dígitos (ej. 001)"),
  descripcion: z
    .string("La descripción es obligatoria")
    .min(3, "La descripción debe tener entre 3 y 100 caracteres")
    .max(100, "La descripción debe tener entre 3 y 100 caracteres"),
});

export type PuntoEmisionFormValues = z.infer<typeof puntoEmisionSchema>;
