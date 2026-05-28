import { z } from "zod";

function validaCedula(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const digitoVerificador = Number(cedula[9]);
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = Number(cedula[i]) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }
  return (10 - (suma % 10)) % 10 === digitoVerificador;
}

export const clienteSchema = z
  .object({
    tipo_identificacion: z
      .string("Debe seleccionar un tipo de identificación")
      .min(1, "Debe seleccionar un tipo de identificación"),
    identificacion: z.string(),
    razon_social: z
      .string("La razón social es obligatoria")
      .min(3, "La razón social debe tener al menos 3 caracteres")
      .max(300, "La razón social no debe exceder 300 caracteres"),
    telefono: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val || val.length === 0) return true;
          return /^\d{7}$/.test(val) || /^09\d{8}$/.test(val);
        },
        "Debe tener 7 dígitos (fijo) o 10 dígitos comenzando con 09 (celular)",
      ),
    email: z
      .string("El correo electrónico es obligatorio")
      .min(1, "El correo electrónico es obligatorio")
      .email("Correo electrónico inválido")
      .max(150, "El correo no debe exceder 150 caracteres"),
    direccion: z
      .string("La dirección es obligatoria")
      .min(5, "La dirección debe tener al menos 5 caracteres")
      .max(300, "La dirección no debe exceder 300 caracteres"),
    es_recurrente: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const tipo = data.tipo_identificacion;
    const id = data.identificacion;

    if (!id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identificacion"],
        message: "La identificación es obligatoria",
      });
      return;
    }

    if (tipo === "05") {
      if (!/^\d{10}$/.test(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "La cédula debe tener exactamente 10 dígitos",
        });
      } else if (!validaCedula(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "Cédula inválida",
        });
      }
    } else if (tipo === "04") {
      if (!/^\d{13}$/.test(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "El RUC debe tener exactamente 13 dígitos",
        });
      } else if (!id.endsWith("001")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "El RUC debe terminar en 001",
        });
      }
    } else if (tipo === "06") {
      if (id.length < 3 || id.length > 20) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "El pasaporte debe tener entre 3 y 20 caracteres",
        });
      } else if (!/^[a-zA-Z0-9]+$/.test(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identificacion"],
          message: "El pasaporte solo permite letras y números",
        });
      }
    }
  });

export type ClienteFormValues = z.infer<typeof clienteSchema>;
