"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AuthShell } from "@/src/components/auth/auth-shell";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { registerSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import type { RegisterFormValues } from "@/src/modules/auth/schemas/auth.schemas";

export function RegisterForm() {
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      ruc: "",
      identificacion: "",
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      confirmPassword: "",
      direccion: "",
      telefono: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await authService.register(values);
      toast.success(response.message);
      form.reset();
      router.push("/auth/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo registrar el usuario.";
      toast.error(message);
    }
  });

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registra una cuenta empresarial. Luego podrás iniciar sesión y el sistema detectará el rol asignado."
      footer={
        <span>
          Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-sky-700 hover:text-sky-800">
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="RUC" htmlFor="register-ruc" error={form.formState.errors.ruc?.message}>
            <Input
              id="register-ruc"
              placeholder="1710204155001"
              error={!!form.formState.errors.ruc}
              {...form.register("ruc")}
            />
          </Field>

          <Field
            label="Identificacion"
            htmlFor="identificacion"
            error={form.formState.errors.identificacion?.message}
          >
            <Input
              id="identificacion"
              placeholder="1710204155"
              error={!!form.formState.errors.identificacion}
              {...form.register("identificacion")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
            htmlFor="nombre"
            error={form.formState.errors.nombre?.message}
          >
            <Input id="nombre" error={!!form.formState.errors.nombre} {...form.register("nombre")} />
          </Field>

          <Field
            label="Apellido"
            htmlFor="apellido"
            error={form.formState.errors.apellido?.message}
          >
            <Input id="apellido" error={!!form.formState.errors.apellido} {...form.register("apellido")} />
          </Field>
        </div>

        <Field label="Correo" htmlFor="email" error={form.formState.errors.email?.message}>
          <Input
            id="email"
            type="email"
            error={!!form.formState.errors.email}
            {...form.register("email")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Clave"
            htmlFor="password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="password"
              type="password"
              error={!!form.formState.errors.password}
              {...form.register("password")}
            />
          </Field>

          <Field
            label="Confirmar clave"
            htmlFor="confirmPassword"
            error={form.formState.errors.confirmPassword?.message}
          >
            <Input
              id="confirmPassword"
              type="password"
              error={!!form.formState.errors.confirmPassword}
              {...form.register("confirmPassword")}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Direccion"
            htmlFor="direccion"
            error={form.formState.errors.direccion?.message}
          >
            <Input
              id="direccion"
              error={!!form.formState.errors.direccion}
              {...form.register("direccion")}
            />
          </Field>

          <Field
            label="Telefono"
            htmlFor="telefono"
            error={form.formState.errors.telefono?.message}
          >
            <Input
              id="telefono"
              error={!!form.formState.errors.telefono}
              {...form.register("telefono")}
            />
          </Field>
        </div>

        <Button type="submit" fullWidth disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Registrando..." : "Crear cuenta"}
        </Button>
      </form>
    </AuthShell>
  );
}
