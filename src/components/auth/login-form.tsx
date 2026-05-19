"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, MessageCircle, Phone, AlertCircle } from "lucide-react";
import { loginSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import type { LoginFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { roleToSlug } from "@/src/modules/auth/utils/role.utils";
import { RecoverPasswordModal } from "@/src/components/auth/recover-password-modal";

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

  const E = form.formState.errors;

  const numOnly = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

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
      {/* Loading overlay */}
      {form.formState.isSubmitting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-5">
            <div className="typewriter typewriter-login" aria-hidden="true">
              <div className="slide"><i /></div>
              <div className="paper" />
              <div className="keyboard" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Cargando...</span>
          </div>
        </div>
      )}

      <main className="flex h-screen w-full overflow-hidden bg-[#f8f9fd]">
        {/* ── Left: Login Form ── */}
        <section className="flex w-full flex-col overflow-y-auto bg-white lg:w-1/2">
          {/* Padded scrollable content */}
          <div className="flex flex-1 flex-col justify-center px-6 py-6 lg:px-10 lg:py-10">
            {/* Form Content */}
            <div className="mx-auto w-full max-w-sm">
              {/* Brand */}
              <div className="mb-8">
                <img src="/Factory.png" alt="Factory" className="h-16 w-auto object-contain lg:h-20" />
              </div>

              <header className="mb-8">
                <h1 className="text-[32px] font-bold leading-tight text-[#191c1f]">
                  Bienvenido de nuevo
                </h1>
                <p className="mt-1 text-sm text-[#41474e]">
                  Ingresa tus credenciales para acceder al sistema.
                </p>
              </header>

              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                {/* RUC */}
                <div className="space-y-1">
                  <label htmlFor="ruc" className="text-xs font-semibold tracking-wide text-[#003959]">
                    RUC
                  </label>
                  <input
                    id="ruc"
                    className={
                      `w-full rounded-lg border bg-[#f8f9fd] px-4 py-2.5 text-sm text-[#191c1f] placeholder:text-[#71787f]/60 outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 ${
                        E.ruc ? "border-red-400 bg-red-50/30" : "border-slate-400"
                      }`
                    }
                    placeholder="17xxxxxxxx001"
                    inputMode="numeric" pattern="[0-9]*" maxLength={13}
                    onInput={numOnly}
                    {...form.register("ruc")}
                  />
                  {E.ruc?.message && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.ruc.message}</span>
                  )}
                </div>

                {/* Cédula */}
                <div className="space-y-1">
                  <label htmlFor="cedula" className="text-xs font-semibold tracking-wide text-[#003959]">
                    Cédula
                  </label>
                  <input
                    id="cedula"
                    className={
                      `w-full rounded-lg border bg-[#f8f9fd] px-4 py-2.5 text-sm text-[#191c1f] placeholder:text-[#71787f]/60 outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 ${
                        E.cedula ? "border-red-400 bg-red-50/30" : "border-slate-400"
                      }`
                    }
                    placeholder="17xxxxxxxx"
                    inputMode="numeric" pattern="[0-9]*" maxLength={10}
                    onInput={numOnly}
                    {...form.register("cedula")}
                  />
                  {E.cedula?.message && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.cedula.message}</span>
                  )}
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                  <label htmlFor="clave" className="text-xs font-semibold tracking-wide text-[#003959]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="clave"
                      type={showPassword ? "text" : "password"}
                      className={
                        `w-full rounded-lg border bg-[#f8f9fd] px-4 py-2.5 pr-10 text-sm text-[#191c1f] placeholder:text-[#71787f]/60 outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/10 ${
                          E.clave ? "border-red-400 bg-red-50/30" : "border-slate-400"
                        }`
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...form.register("clave")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {E.clave?.message && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.clave.message}</span>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full rounded-lg bg-[#00517c] px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  >
                    {form.formState.isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                  </button>
                </div>
              </form>

              {/* Links */}
              <div className="flex flex-col items-center gap-2 pt-4">
                <span className="text-sm text-[#41474e] flex items-center gap-1">
                  ¿Olvidaste tu contraseña?
                  <RecoverPasswordModal />
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[#41474e]">¿No tienes cuenta?</span>
                  <Link
                    href="/auth/register"
                    className="text-sm font-bold text-[#003959] transition-colors hover:underline"
                  >
                    Crear una cuenta
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Support Section ── */}
            <div className="mt-6 flex flex-col items-center">
              <div className="mb-6 flex w-full items-center gap-3">
                <div className="flex-1 border-t border-[#c1c7d0]" />
                <span className="text-xs font-medium text-[#71787f]">o</span>
                <div className="flex-1 border-t border-[#c1c7d0]" />
              </div>
              <p className="mb-4 text-center text-xs text-[#41474e]">
                <span className="font-bold text-[#006591]">¿Necesitas ayuda?</span> Solicita la creación de usuario y credenciales por estos contactos.
              </p>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  {/* WhatsApp */}
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#278E98] hover:text-white hover:shadow-md active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      {contactNumber}
                    </span>
                  </a>
                  {/* Phone */}
                  <a
                    href={phoneLink}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#0EA5E9] hover:text-white hover:shadow-md active:scale-95"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      {contactNumber}
                    </span>
                  </a>
                  {/* Email */}
                  <a
                    href={mailLink}
                    className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#10365D] hover:text-white hover:shadow-md active:scale-95"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                      {contactEmail}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: Marketing Panel ── */}
        <section className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden lg:flex">
          {/* Background image + overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdRCnaCW6nwflVY6iPBgSz1yftfdF5mkmqm0iGC0eN_-cA5QZbIfEH2EM5R9pLKhsQ80pvnSoVo-IcZKmzqBKCmBcPyVEuV4QZ53_CS6BCcgaeXqupsfMIVTsf1d9073kkliQf9_LLOzsNxyqSPgGO_EBktBgMw1ycScelhDVre44YAAAUe9CwkggEuFKUDSZHAMsYKesjFcaUxuYaP3Icbkz22tkEeeY_UluM5y-HPoLpzyVCnfnoZdhiYzrafonRPrjwyhEBbks"
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#003959]/95 via-[#003959]/80 to-[#006591]/60" />
            <div className="absolute right-0 top-0 h-96 w-96 -mr-48 -mt-48 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 -mb-32 -ml-32 rounded-full bg-[#39b8fd]/10 blur-2xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-xl px-10 text-white">
            <h2 className="text-3xl xl:text-5xl font-bold leading-tight tracking-tight">
              Gestión de facturación lista para escalar.
            </h2>
            <ul className="mt-6 xl:mt-8 space-y-4 xl:space-y-6">
              {[
                { icon: "hub", text: "Centraliza la operación y mantén todo bajo control en un solo entorno." },
                { icon: "receipt_long", text: "Emite facturas electrónicas, notas de crédito y débito en minutos." },
                { icon: "inventory_2", text: "Controla productos, clientes, proveedores y puntos de emisión desde un solo lugar." },
                { icon: "groups", text: "Administra equipos, permisos y usuarios con trazabilidad completa." },
                { icon: "analytics", text: "Consulta reportes e impuestos con paneles listos para auditoría." },
              ].map((item, i) => (
                <li key={i} className="group flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 transition-colors group-hover:bg-white/20">
                    <span className="material-symbols-outlined text-white">{item.icon}</span>
                  </div>
                  <p className="pt-1 text-sm xl:text-base">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
