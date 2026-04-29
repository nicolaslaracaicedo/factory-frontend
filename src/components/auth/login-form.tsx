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
import { loginSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import type { LoginFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { roleToSlug } from "@/src/modules/auth/utils/role.utils";

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      ruc: "",
      cedula: "",
      clave: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await authService.login({
        ruc: values.ruc,
        cedula: values.cedula,
        clave: values.clave,
      });

      setSession(response);
      toast.success("Acceso concedido.");
      router.replace(`/dashboard/${roleToSlug[response.user.role]}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      toast.error(message);
    }
  });

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede con RUC, identificacion y clave. El perfil se detecta automaticamente segun tu usuario."
      footer={
        <span>
          No tienes cuenta?{" "}
          <Link href="/auth/register" className="font-semibold text-sky-700 hover:text-sky-800">
            Registrarse
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="RUC" htmlFor="ruc" error={form.formState.errors.ruc?.message}>
          <Input
            id="ruc"
            placeholder="1710204155001"
            error={!!form.formState.errors.ruc}
            {...form.register("ruc")}
          />
        </Field>

        <Field
          label="Cedula"
          htmlFor="cedula"
          error={form.formState.errors.cedula?.message}
        >
          <Input
            id="cedula"
            placeholder="1710204155"
            error={!!form.formState.errors.cedula}
            {...form.register("cedula")}
          />
        </Field>

        <Field label="Clave" htmlFor="clave" error={form.formState.errors.clave?.message}>
          <Input
            id="clave"
            type="password"
            placeholder="Ingresa tu clave"
            error={!!form.formState.errors.clave}
            {...form.register("clave")}
          />
        </Field>

        <Button type="submit" fullWidth disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Ingresando..." : "Entrar al sistema"}
        </Button>
      </form>
    </AuthShell>
  );
}
