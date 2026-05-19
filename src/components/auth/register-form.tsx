"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye, EyeOff, ArrowLeft,
  CheckCircle2, AlertCircle,
} from "lucide-react";
import { registerSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import type { RegisterFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { TermsModal } from "@/src/components/auth/terms-modal";

// ── Validation helpers ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "warn" | "ok" | "error" | "orange" | "yellow";
type Hint   = { status: Status; text: string };

// Ecuador cédula algorithm
function isValidCedula(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 10) return false;
  const prov = Number(d.slice(0, 2));
  if (prov < 1 || prov > 24) return false;
  if (Number(d[2]) >= 6) return false;
  const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let p = Number(d[i]) * coef[i];
    if (p >= 10) p -= 9;
    sum += p;
  }
  return ((10 - (sum % 10)) % 10) === Number(d[9]);
}

// RUC = cédula (10 dig) + "001" suffix, or sociedad (starts with 20/30)
function isValidRUC(raw: string): boolean {
  const d = raw.replace(/\D/g, "");
  if (d.length !== 13) return false;
  if (!d.endsWith("001")) return false;
  return isValidCedula(d.slice(0, 10));
}

function passwordScore(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[a-z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return s;
}

function rucHint(v: string): Hint {
  const d = v.replace(/\D/g, "");
  if (!v)    return { status: "idle",  text: "" };
  if (d.length < 13) return { status: "warn",  text: `Debe tener 13 dígitos (${d.length}/13).` };
  if (isValidRUC(v)) return { status: "ok",    text: "RUC válido." };
  return              { status: "error", text: "El RUC no es válido. Verifica que termine en 001." };
}

function cedulaHint(v: string): Hint {
  const d = v.replace(/\D/g, "");
  if (!v)    return { status: "idle",  text: "" };
  if (d.length < 10) return { status: "warn",  text: `Debe tener 10 dígitos (${d.length}/10).` };
  if (isValidCedula(v)) return { status: "ok", text: "Cédula válida." };
  return                 { status: "error", text: "No coincide con el dígito verificador." };
}

function telefonoHint(v: string): Hint {
  const d = v.replace(/\D/g, "");
  if (!v)    return { status: "idle",  text: "" };
  if (d.length === 0) return { status: "warn",  text: "Debe tener 10 dígitos." };
  if (d.length < 10)  return { status: "warn",  text: `Debe tener 10 dígitos (${d.length}/10).` };
  if (d.length > 10)  return { status: "error", text: "Máximo 10 dígitos." };
  if (!d.startsWith("0")) return { status: "error", text: "Debe comenzar con 0." };
  return { status: "ok", text: "Número ecuatoriano válido." };
}

function nombreHint(v: string): Hint {
  if (!v) return { status: "idle", text: "" };
  if (v.length > 60) return { status: "error", text: `Máximo 60 caracteres (${v.length}/60).` };
  if (v.trim().length < 2) return { status: "warn", text: "Mínimo 2 caracteres." };
  if (/[0-9]/.test(v)) return { status: "error", text: "No se permiten números." };
  if (/[^a-zA-ZáéíóúüñÑ\s-]/.test(v)) return { status: "error", text: "Solo letras y espacios." };
  return { status: "ok", text: "Nombre válido." };
}

function apellidoHint(v: string): Hint {
  return nombreHint(v);
}

function emailHint(v: string): Hint {
  if (!v) return { status: "idle",  text: "" };
  if (EMAIL_RE.test(v)) return { status: "ok",    text: "Formato de correo válido." };
  return                        { status: "error", text: "El formato del correo no es válido." };
}

function passwordHint(v: string): Hint {
  if (!v) return { status: "idle", text: "" };
  const s = passwordScore(v);
  if (s === 5) return { status: "ok",     text: "Contraseña fuerte." };
  if (s === 4) return { status: "yellow", text: "Contraseña media alta: falta un carácter." };
  if (s === 3) return { status: "orange", text: "Contraseña media: añade mayúsculas o números." };
  return              { status: "error",  text: "Contraseña débil: requiere más variedad." };
}

function confirmHint(pw: string, conf: string): Hint {
  if (!conf) return { status: "idle",  text: "" };
  if (pw === conf) return { status: "ok",    text: "Las contraseñas coinciden." };
  return                   { status: "error", text: "Las contraseñas no coinciden." };
}

// ── Hint display ──────────────────────────────────────────────────────────────

function FieldHint({ hint }: { hint: Hint }) {
  if (hint.status === "idle" || !hint.text) return null;
  const map = {
    ok:     { cls: "text-emerald-700", Icon: CheckCircle2 },
    warn:   { cls: "text-amber-500",   Icon: AlertCircle },
    error:  { cls: "text-red-500",     Icon: AlertCircle },
    orange: { cls: "text-orange-500",  Icon: AlertCircle },
    yellow: { cls: "text-yellow-500",  Icon: AlertCircle },
  }[hint.status as "ok" | "warn" | "error" | "orange" | "yellow"];
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${map.cls}`}>
      <map.Icon className="h-3 w-3 shrink-0" />
      {hint.text}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RegisterForm() {
  const router = useRouter();
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { ruc: "", identificacion: "", nombre: "", apellido: "", email: "", password: "", confirmPassword: "", direccion: "", telefono: "" },
    mode: "onChange",
  });

  const ruc   = form.watch("ruc");
  const id    = form.watch("identificacion");
  const nombre = form.watch("nombre");
  const apellido = form.watch("apellido");
  const tel   = form.watch("telefono");
  const mail  = form.watch("email");
  const pw    = form.watch("password");
  const cpw   = form.watch("confirmPassword");
  const E     = form.formState.errors;

  // Compute live hints
  const hRuc   = rucHint(ruc);
  const hId    = cedulaHint(id);
  const hNombre = nombreHint(nombre);
  const hApellido = apellidoHint(apellido);
  const hTel   = telefonoHint(tel);
  const hMail  = emailHint(mail);
  const hPw    = passwordHint(pw);
  const hCpw   = confirmHint(pw, cpw);
  const hPwScore = passwordScore(pw);

  // Auto-completar RUC basado en la cédula
  useEffect(() => {
    if (id && id.length === 10) {
      const currentRuc = form.getValues("ruc");
      if (!currentRuc || currentRuc.length < 13) {
        form.setValue("ruc", `${id}001`, { shouldValidate: true });
      }
    }
  }, [id, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!acceptedTerms) { toast.error("Debes aceptar los Términos y Condiciones."); return; }
    try {
      const res = await authService.register(values);
      toast.success(res.message);
      form.reset();
      setAcceptedTerms(false);
      router.push("/auth/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar.");
    }
  });

  const numOnly = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  // Password strength color
  const pwColor =
    hPwScore === 0 ? "bg-slate-200"
    : hPwScore <= 2 ? "bg-red-500"
    : hPwScore === 3 ? "bg-orange-500"
    : hPwScore === 4 ? "bg-yellow-500"
    : "bg-emerald-500";

  function borderCls(status: Status, error: boolean) {
    if (error) return "border-red-400 bg-red-50/30";
    return {
      idle:   "border-[#c1c7d0]",
      warn:   "border-amber-400",
      ok:     "border-emerald-400",
      error:  "border-red-400 bg-red-50/30",
      orange: "border-orange-400",
      yellow: "border-yellow-400",
    }[status];
  }

  return (
    <>
      {form.formState.isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/60 bg-white/90 px-6 py-5">
            <div className="typewriter typewriter-login" aria-hidden="true">
              <div className="slide"><i /></div>
              <div className="paper" />
              <div className="keyboard" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Registrando...</span>
          </div>
        </div>
      )}

      <main className="flex h-screen w-full overflow-hidden bg-[#f8f9fd]">
        {/* ── Left: Registration Form ── */}
        <section className="w-full overflow-y-auto bg-white lg:w-1/2">
          <div className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-8">
            {/* Back link */}
            <div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#006591] transition-colors hover:text-[#003959] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio de sesión
              </Link>
            </div>

            {/* Header */}
            <header className="flex flex-col gap-1">
              <h1 className="text-[32px] font-semibold tracking-tight text-[#003959]">Crear cuenta empresarial</h1>
              <p className="text-base text-[#41474e]">Registra tu empresa para emitir comprobantes electrónicos autorizados por el SRI.</p>
            </header>

            <form className="flex flex-col gap-8" onSubmit={onSubmit} noValidate>
              {/* ── Información fiscal ── */}
              <fieldset className="flex flex-col gap-4">
                <div className="border-l-4 border-[#39b8fd] pl-4">
                  <legend className="text-[20px] font-semibold text-[#191c1f]">Información fiscal</legend>
                  <p className="text-xs font-medium tracking-wide text-[#41474e]">Datos registrados en el SRI para la emisión de comprobantes electrónicos.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-ruc" className="text-xs font-semibold tracking-wide text-[#003959]">RUC</label>
                    <input
                      id="reg-ruc"
                      className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hRuc.status, !!E.ruc)}`}
                      placeholder="1790000000001"
                      inputMode="numeric" pattern="[0-9]*" maxLength={13}
                      onInput={numOnly}
                      {...form.register("ruc")}
                    />
                    {E.ruc?.message
                      ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.ruc.message}</span>
                      : <FieldHint hint={hRuc} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-id" className="text-xs font-semibold tracking-wide text-[#003959]">Número de identificación</label>
                    <input
                      id="reg-id"
                      className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hId.status, !!E.identificacion)}`}
                      placeholder="1710204155"
                      inputMode="numeric" pattern="[0-9]*" maxLength={10}
                      onInput={numOnly}
                      {...form.register("identificacion")}
                    />
                    {E.identificacion?.message
                      ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.identificacion.message}</span>
                      : <FieldHint hint={hId} />}
                  </div>
                </div>
              </fieldset>

              {/* ── Información personal ── */}
              <fieldset className="flex flex-col gap-4">
                <div className="border-l-4 border-[#39b8fd] pl-4">
                  <legend className="text-[20px] font-semibold text-[#191c1f]">Información personal</legend>
                  <p className="text-xs font-medium tracking-wide text-[#41474e]">Datos del representante legal o responsable de la empresa.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-nombre" className="text-xs font-semibold tracking-wide text-[#003959]">Nombre</label>
                    <input
                      id="reg-nombre"
                      className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hNombre.status, !!E.nombre)}`}
                      placeholder="Ej. Juan"
                      maxLength={60}
                      {...form.register("nombre")}
                    />
                    {E.nombre?.message
                      ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.nombre.message}</span>
                      : <FieldHint hint={hNombre} />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-apellido" className="text-xs font-semibold tracking-wide text-[#003959]">Apellido</label>
                    <input
                      id="reg-apellido"
                      className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hApellido.status, !!E.apellido)}`}
                      placeholder="Ej. Pérez"
                      maxLength={60}
                      {...form.register("apellido")}
                    />
                    {E.apellido?.message
                      ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.apellido.message}</span>
                      : <FieldHint hint={hApellido} />}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="reg-tel" className="text-xs font-semibold tracking-wide text-[#003959]">Teléfono</label>
                  <input
                    id="reg-tel"
                    className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hTel.status, !!E.telefono)}`}
                    placeholder="+593 99 999 9999"
                    inputMode="numeric" pattern="[0-9]*" maxLength={10}
                    onInput={numOnly}
                    {...form.register("telefono")}
                  />
                  {E.telefono?.message
                    ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.telefono.message}</span>
                    : <FieldHint hint={hTel} />}
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="reg-dir" className="text-xs font-semibold tracking-wide text-[#003959]">Dirección fiscal</label>
                  <input
                    id="reg-dir"
                    className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls("idle", !!E.direccion)}`}
                    placeholder="Ej. Av. Amazonas y Villalengua"
                    maxLength={200}
                    {...form.register("direccion")}
                  />
                  {E.direccion?.message && (
                    <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.direccion.message}</span>
                  )}
                </div>
              </fieldset>

              {/* ── Seguridad ── */}
              <fieldset className="flex flex-col gap-4">
                <div className="border-l-4 border-[#39b8fd] pl-4">
                  <legend className="text-[20px] font-semibold text-[#191c1f]">Seguridad</legend>
                  <p className="text-xs font-medium tracking-wide text-[#41474e]">Credenciales de acceso al sistema de facturación electrónica.</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="reg-email" className="text-xs font-semibold tracking-wide text-[#003959]">Correo electrónico</label>
                  <input
                    id="reg-email" type="email"
                    className={`w-full rounded-lg border p-4 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hMail.status, !!E.email)}`}
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                    {...form.register("email")}
                  />
                  {E.email?.message
                    ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.email.message}</span>
                    : <FieldHint hint={hMail} />}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-pw" className="text-xs font-semibold tracking-wide text-[#003959]">Contraseña</label>
                    <div className="relative">
                      <input
                        id="reg-pw"
                        type={showPw ? "text" : "password"}
                        className={`w-full rounded-lg border p-4 pr-10 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hPw.status, !!E.password)}`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...form.register("password")}
                      />
                      <button type="button" onClick={() => setShowPw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                        aria-label={showPw ? "Ocultar" : "Mostrar"}>
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pw && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pwColor}`}
                            style={{ width: `${(hPwScore / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="mt-1">
                      {pw
                        ? <FieldHint hint={hPw} />
                        : (E.password?.message ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.password.message}</span> : null)
                      }
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="reg-cpw" className="text-xs font-semibold tracking-wide text-[#003959]">Confirmar contraseña</label>
                    <div className="relative">
                      <input
                        id="reg-cpw"
                        type={showCpw ? "text" : "password"}
                        className={`w-full rounded-lg border p-4 pr-10 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10 ${borderCls(hCpw.status, !!E.confirmPassword)}`}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...form.register("confirmPassword")}
                      />
                      <button type="button" onClick={() => setShowCpw(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                        aria-label={showCpw ? "Ocultar" : "Mostrar"}>
                        {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {E.confirmPassword?.message
                      ? <span className="flex items-center gap-1 text-xs font-medium text-red-500"><AlertCircle className="h-3 w-3 shrink-0" />{E.confirmPassword.message}</span>
                      : <FieldHint hint={hCpw} />}
                  </div>
                </div>
              </fieldset>

              {/* ── Footer & CTA ── */}
              <div className="flex flex-col gap-6">
                <div className="cntr flex select-none items-start gap-2 text-sm text-[#41474e]">
                  <input type="checkbox" id="cbx" className="hidden-xs-up" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                  <label htmlFor="cbx" className="cbx mt-0.5 cursor-pointer" />
                  <span className="lbl text-[#41474e] transition-colors group-hover:text-[#191c1f]">
                    <label htmlFor="cbx" className="cursor-pointer">Acepto los </label>
                    <TermsModal onAccept={() => setAcceptedTerms(true)} />
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="w-full rounded-lg bg-[#00517c] py-4 text-base font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                >
                  {form.formState.isSubmitting ? "Registrando..." : "Crear cuenta"}
                </button>
                <div className="pt-4 text-center">
                  <Link href="/auth/login" className="text-sm text-[#41474e] transition-colors hover:text-[#003959]">
                    ¿Ya tienes cuenta?{" "}
                    <span className="font-bold text-[#006591]">Inicia sesión</span>
                  </Link>
                </div>
              </div>
            </form>

            {/* Bottom legal */}
            <footer className="border-t border-[#c1c7d0] pt-8 text-center">
              <p className="text-xs font-medium text-[#71787f]">© {new Date().getFullYear()} Factory. Todos los derechos reservados.</p>
            </footer>
          </div>
        </section>

        {/* ── Right: Branding Panel ── */}
        <section className="relative hidden flex-col overflow-hidden bg-[#003959] px-8 lg:flex lg:w-1/2">
          {/* Background decorations */}
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <div className="absolute -right-[10%] -top-[10%] h-[600px] w-[600px] rounded-full bg-[#39b8fd] blur-3xl" />
            <div className="absolute -bottom-[20%] -left-[10%] h-[800px] w-[800px] rounded-full bg-[#00517c] blur-3xl" />
          </div>

          {/* Center content (including logo) */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center py-12">
            <div className="flex w-full max-w-lg flex-col gap-8 xl:gap-12">
              {/* Branding header */}
              <div className="flex items-center gap-3">
                <img src="/Factory.png" alt="Factory" className="h-20 w-auto object-contain brightness-0 invert lg:h-24" />
              </div>

              <div>
                <h2 className="mb-6 xl:mb-8 text-[32px] xl:text-[48px] font-bold leading-tight tracking-tight text-white">
                  Sistema de facturación electrónica profesional.
                </h2>
                <div className="flex flex-col gap-4 xl:gap-6">
                  {[
                    { icon: "verified", title: "Autorizado por el SRI", text: "Cumplimiento total con la normativa vigente ecuatoriana para comprobantes electrónicos." },
                    { icon: "trending_up", title: "Gestión lista para escalar", text: "Infraestructura robusta diseñada para manejar miles de transacciones mensuales sin fricción." },
                    { icon: "description", title: "Cumplimiento tributario total", text: "Facturación electrónica 100% apegada a la normativa del SRI con actualizaciones automáticas." },
                    { icon: "account_balance", title: "Módulos contables completos", text: "Gestión integral de retenciones, liquidaciones de compra y guías de remisión en un solo entorno." },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 xl:h-12 xl:w-12 shrink-0 items-center justify-center rounded-xl bg-[#00517c]">
                        <span className="material-symbols-outlined fill-icon text-white text-[20px] xl:text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                      </div>
                      <div>
                        <h3 className="mb-1 text-[16px] xl:text-[20px] font-semibold text-white">{item.title}</h3>
                        <p className="text-xs xl:text-sm text-[#c9e6ff] opacity-90">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
