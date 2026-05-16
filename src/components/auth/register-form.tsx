"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { registerSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import type { RegisterFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { TermsModal } from "@/src/components/auth/terms-modal";

export function RegisterForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    if (!acceptedTerms) {
      toast.error("Debes aceptar los Términos y Condiciones.");
      return;
    }

    try {
      const response = await authService.register(values);
      toast.success(response.message);
      form.reset();
      setAcceptedTerms(false);
      router.push("/auth/login");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo registrar el usuario.";
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
            <span className="text-xs font-semibold text-slate-600">Registrando...</span>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Crear cuenta</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Registra una cuenta empresarial para emitir facturación electrónica.
                </p>
              </div>
            </div>
          </div>

          <form className="p-6 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <h2 className="mb-4 text-sm font-semibold text-slate-700">Información fiscal</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="RUC"
                      htmlFor="register-ruc"
                      error={form.formState.errors.ruc?.message}
                    >
                      <Input
                        id="register-ruc"
                        placeholder="1710204155001"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        error={!!form.formState.errors.ruc}
                        onInput={(event) => {
                          event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                        }}
                        {...form.register("ruc")}
                      />
                    </Field>

                    <Field
                      label="Identificación"
                      htmlFor="register-identificacion"
                      error={form.formState.errors.identificacion?.message}
                    >
                      <Input
                        id="register-identificacion"
                        placeholder="1710204155"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        error={!!form.formState.errors.identificacion}
                        onInput={(event) => {
                          event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                        }}
                        {...form.register("identificacion")}
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <h2 className="mb-4 text-sm font-semibold text-slate-700">Seguridad</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Clave"
                      htmlFor="register-password"
                      error={form.formState.errors.password?.message}
                    >
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          error={!!form.formState.errors.password}
                          className="pr-10"
                          {...form.register("password")}
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

                    <Field
                      label="Confirmar clave"
                      htmlFor="register-confirmPassword"
                      error={form.formState.errors.confirmPassword?.message}
                    >
                      <div className="relative">
                        <Input
                          id="register-confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          error={!!form.formState.errors.confirmPassword}
                          className="pr-10"
                          {...form.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100"
                          aria-label={showConfirmPassword ? "Ocultar clave" : "Mostrar clave"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </Field>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <h2 className="mb-4 text-sm font-semibold text-slate-700">Información personal</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Nombre"
                      htmlFor="register-nombre"
                      error={form.formState.errors.nombre?.message}
                    >
                      <Input
                        id="register-nombre"
                        placeholder="Tu nombre"
                        error={!!form.formState.errors.nombre}
                        {...form.register("nombre")}
                      />
                    </Field>

                    <Field
                      label="Apellido"
                      htmlFor="register-apellido"
                      error={form.formState.errors.apellido?.message}
                    >
                      <Input
                        id="register-apellido"
                        placeholder="Tu apellido"
                        error={!!form.formState.errors.apellido}
                        {...form.register("apellido")}
                      />
                    </Field>

                    <Field
                      label="Correo electrónico"
                      htmlFor="register-email"
                      error={form.formState.errors.email?.message}
                    >
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        error={!!form.formState.errors.email}
                        {...form.register("email")}
                      />
                    </Field>

                    <Field
                      label="Teléfono"
                      htmlFor="register-telefono"
                      error={form.formState.errors.telefono?.message}
                    >
                      <Input
                        id="register-telefono"
                        placeholder="0987654321"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        error={!!form.formState.errors.telefono}
                        onInput={(event) => {
                          event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "");
                        }}
                        {...form.register("telefono")}
                      />
                    </Field>

                    <div className="sm:col-span-2">
                      <Field
                        label="Dirección"
                        htmlFor="register-direccion"
                        error={form.formState.errors.direccion?.message}
                      >
                        <Input
                          id="register-direccion"
                          placeholder="Dirección fiscal"
                          error={!!form.formState.errors.direccion}
                          {...form.register("direccion")}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <label className="cntr flex items-center gap-1 text-sm text-slate-600 select-none pt-2">
              <input
                type="checkbox"
                id="cbx"
                className="hidden-xs-up"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <label htmlFor="cbx" className="cbx" />
              <span className="lbl">
                Acepto los{" "}
                <TermsModal />
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 pt-2">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
              >
                Volver al inicio de sesión
              </Link>
              <Button type="submit" fullWidth={false} disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Registrando..." : "Crear cuenta"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
