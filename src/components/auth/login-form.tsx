"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, MessageCircle, Phone, Loader2 } from "lucide-react";
import { loginSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import type { LoginFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { roleToSlug } from "@/src/modules/auth/utils/role.utils";
import { RecoverPasswordModal } from "@/src/components/auth/recover-password-modal";
import { BrandPanel } from "@/src/components/auth/brand-panel";
import { FloatingInput } from "@/src/components/auth/floating-input";
import { VerifyEmailModal } from "@/src/components/auth/verify-email-modal";

// ── Component ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [showPassword, setShowPassword] = React.useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false);
  const [pendingLoginResponse, setPendingLoginResponse] = React.useState<{ ruc: string; cedula: string; email?: string } | null>(null);
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

  const { register } = form;

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

      setSession({ user: response.user });

      if (response.user.email_verificado === false) {
        setPendingLoginResponse({
          ruc: values.ruc,
          cedula: values.cedula,
          email: response.user.email,
        });
        setVerifyModalOpen(true);
      } else {
        router.replace(`/dashboard/${roleToSlug[response.user.role]}`);
      }
    } catch (error) {
      await ensureMinDelay();
      const message =
        error instanceof Error ? error.message : "No se pudo iniciar sesión.";
      toast.error(message);
    }
  });

  return (
    <div className="auth-page min-h-screen flex bg-white font-sans text-slate-800">
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

      {/* Form Panel */}
      <div className="auth-panel flex-1 flex flex-col justify-center px-6 lg:px-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-card w-full max-w-sm mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="auth-logo-block mb-8"
          >
            <img src="/Factory.png" alt="Factory" className="auth-logo h-16 w-auto object-contain lg:h-20" />
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="auth-header mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#00517C] mb-2">
              Bienvenido de nuevo
            </h1>
            <p className="text-gray-500 text-sm">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate className="space-y-8">
            {/* Fields */}
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <FloatingInput
                  label="RUC"
                  placeholder="1790000000001"
                  inputMode="numeric" pattern="[0-9]*" maxLength={13}
                  onInput={numOnly}
                  error={!!E.ruc}
                  {...register("ruc")}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <FloatingInput
                  label="Cédula"
                  placeholder="1710204155"
                  inputMode="numeric" pattern="[0-9]*" maxLength={10}
                  onInput={numOnly}
                  error={!!E.cedula}
                  {...register("cedula")}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <FloatingInput
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  error={!!E.clave}
                  {...register("clave")}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
              </motion.div>
            </div>

            {/* Submit */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="auth-btn-primary w-full py-3 px-6 bg-gradient-to-r from-[#00517C] to-[#0967A4] text-white font-semibold rounded-xl shadow-md shadow-[#0967A4]/20 hover:shadow-lg hover:shadow-[#0967A4]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                whileHover={{ scale: form.formState.isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: form.formState.isSubmitting ? 1 : 0.98 }}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="auth-links flex flex-col items-center gap-2 pt-6"
          >
            <span className="text-xs text-[#41474e] flex items-center gap-1">
              <span className="auth-recover-question">¿Olvidaste tu contraseña?</span>
              <RecoverPasswordModal />
            </span>
            <div className="flex items-center gap-1">
              <span className="auth-register-question text-xs text-[#41474e]">¿No tienes cuenta?</span>
              <Link
                href="/auth/register"
                className="text-xs font-bold text-[#0967A4] transition-colors hover:underline"
              >
                Crear una cuenta
              </Link>
            </div>
          </motion.div>

          {/* Support Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 flex flex-col items-center"
          >
            <div className="mb-6 flex w-full items-center gap-3">
              <div className="flex-1 border-t border-[#c1c7d0]" />
              <span className="text-xs font-medium text-[#71787f]">o</span>
              <div className="flex-1 border-t border-[#c1c7d0]" />
            </div>
            <p className="mb-4 text-center text-xs text-[#41474e]">
              <span className="font-bold text-[#0967A4]">¿Necesitas ayuda?</span> Contáctanos
            </p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#248C95] hover:text-white hover:shadow-md active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {contactNumber}
                  </span>
                </a>
                <a
                  href={phoneLink}
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#0967A4] hover:text-white hover:shadow-md active:scale-95"
                >
                  <Phone className="h-4 w-4" />
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {contactNumber}
                  </span>
                </a>
                <a
                  href={mailLink}
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-300 hover:scale-110 hover:bg-[#00517C] hover:text-white hover:shadow-md active:scale-95"
                >
                  <Mail className="h-4 w-4" />
                  <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {contactEmail}
                  </span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-center text-xs text-gray-400"
          >
            © 2026 Factory. Todos los derechos reservados.
          </motion.p>
        </motion.div>
      </div>

      {/* Brand Panel */}
      <BrandPanel variant="login" />

      {/* Email Verification Modal */}
      {pendingLoginResponse && (
        <VerifyEmailModal
          open={verifyModalOpen}
          onOpenChange={(open) => {
            setVerifyModalOpen(open);
            if (!open) {
              useAuthStore.getState().clearSession();
              setPendingLoginResponse(null);
            }
          }}
          ruc={pendingLoginResponse.ruc}
          cedula={pendingLoginResponse.cedula}
          email={pendingLoginResponse.email}
          onVerified={() => {
            useAuthStore.getState().clearSession();
            toast.success("Correo verificado correctamente. Inicia sesión nuevamente.");
            router.push("/auth/login");
          }}
        />
      )}
    </div>
  );
}
