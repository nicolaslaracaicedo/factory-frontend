"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, MessageCircle, Phone } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const minLoginDelayMs = 2000;
  const contactEmail = "nalara2@espe.edu.ec";
  const contactNumber = "+593 98 481 0928";
  const whatsappLink = "https://wa.me/593984810928";
  const phoneLink = "tel:+593984810928";
  const mailLink = `mailto:${contactEmail}`;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      ruc: "",
      cedula: "",
      clave: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const startedAt = Date.now();
    const ensureMinDelay = async () => {
      const elapsed = Date.now() - startedAt;
      const remaining = minLoginDelayMs - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }
    };

    try {
      const response = await authService.login({
        ruc: values.ruc,
        cedula: values.cedula,
        clave: values.clave,
      });
      await ensureMinDelay();

      setSession(response);
      router.replace(`/dashboard/${roleToSlug[response.user.role]}`);
    } catch (error) {
      await ensureMinDelay();
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      toast.error(message);
    }
  });

  return (
    <>
      {form.formState.isSubmitting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-5">
            <div className="typewriter typewriter-login" aria-hidden="true">
              <div className="slide">
                <i />
              </div>
              <div className="paper" />
              <div className="keyboard" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Cargando...</span>
          </div>
        </div>
      ) : null}
      <AuthShell
        title="Iniciar sesión"
        subtitle="Accede con RUC, identificación y clave."
        footer={
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">¿Necesitas cuenta?</span> Solicita la
              creación de usuario y credenciales por estos contactos.
            </p>
            <div className="flex items-center justify-center gap-3 rounded-[22px] border border-slate-200 bg-slate-100/80 px-4 py-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all duration-300 hover:scale-110 hover:rounded-2xl hover:border-emerald-400 hover:bg-emerald-500 hover:text-white"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                  {contactNumber}
                </span>
              </a>
              <a
                href={phoneLink}
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all duration-300 hover:scale-110 hover:rounded-2xl hover:border-sky-400 hover:bg-sky-500 hover:text-white"
              >
                <Phone className="h-5 w-5" />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                  {contactNumber}
                </span>
              </a>
              <a
                href={mailLink}
                className="group relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 transition-all duration-300 hover:scale-110 hover:rounded-2xl hover:border-amber-400 hover:bg-amber-500 hover:text-white"
              >
                <Mail className="h-5 w-5" />
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                  {contactEmail}
                </span>
              </a>
            </div>
          </div>
        }
      >
        <div className="space-y-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <Field label="RUC" htmlFor="ruc" error={form.formState.errors.ruc?.message}>
              <Input
                id="ruc"
                placeholder="1710204155001"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={13}
                maxLength={13}
                error={!!form.formState.errors.ruc}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                }}
                {...form.register("ruc")}
              />
            </Field>

            <Field
              label="Cédula"
              htmlFor="cedula"
              error={form.formState.errors.cedula?.message}
            >
              <Input
                id="cedula"
                placeholder="1710204155"
                inputMode="numeric"
                pattern="[0-9]*"
                minLength={10}
                maxLength={10}
                error={!!form.formState.errors.cedula}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                }}
                {...form.register("cedula")}
              />
            </Field>

            <Field label="Clave" htmlFor="clave" error={form.formState.errors.clave?.message}>
              <div className="relative">
                <Input
                  id="clave"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu clave"
                  error={!!form.formState.errors.clave}
                  className="pr-10"
                  {...form.register("clave")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                  aria-label={showPassword ? "Ocultar clave" : "Mostrar clave"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <p className="text-xs font-semibold text-sky-600">
              ¿Olvidaste tu contraseña? Recupérala.
            </p>

            <Button type="submit" fullWidth disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Ingresando..." : "Ingresar al sistema"}
            </Button>
          </form>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-xs text-slate-400">o</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <p className="text-center text-xs text-slate-500">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-sky-700 hover:text-sky-800 transition-colors"
            >
              Crear una cuenta
            </Link>
          </p>
        </div>
      </AuthShell>
    </>
  );
}
