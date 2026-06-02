"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, ArrowRight, Check, Building2, User, Lock, Loader2,
  Eye, EyeOff, CheckCircle2, AlertCircle
} from "lucide-react";

import { registerSchema } from "@/src/modules/auth/schemas/auth.schemas";
import { authService } from "@/src/modules/auth/services/auth.service";
import type { RegisterFormValues } from "@/src/modules/auth/schemas/auth.schemas";
import { TermsModal } from "@/src/components/auth/terms-modal";
import { BrandPanel } from "@/src/components/auth/brand-panel";
import { FloatingInput } from "@/src/components/auth/floating-input";
import { VerifyEmailModal } from "@/src/components/auth/verify-email-modal";

// -- Validation helpers --------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "warn" | "ok" | "error" | "orange" | "yellow";
type Hint   = { status: Status; text: string };

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
  const d = (v || "").replace(/\D/g, "");
  if (!v) return { status: "idle",  text: "" };
  if (d.length < 13) return { status: "warn",  text: "Debe tener 13 dígitos (13/13)." };
  if (isValidRUC(v)) return { status: "ok",    text: "RUC válido." };
  return { status: "error", text: "El RUC no es válido o no termina en 001." };
}

function cedulaHint(v: string): Hint {
  const d = (v || "").replace(/\D/g, "");
  if (!v) return { status: "idle",  text: "" };
  if (d.length < 10) return { status: "warn",  text: "Debe tener 10 dígitos (10/10)." };
  if (isValidCedula(v)) return { status: "ok", text: "Cédula válida." };
  return { status: "error", text: "No coincide con el dígito verificador." };
}

function telefonoHint(v: string): Hint {
  const d = (v || "").replace(/\D/g, "");
  if (!v) return { status: "idle",  text: "" };
  if (d.length === 0) return { status: "warn",  text: "Debe tener 10 dígitos." };
  if (d.length < 10)  return { status: "warn",  text: "Debe tener 10 dígitos (10/10)." };
  if (d.length > 10)  return { status: "error", text: "Máximo 10 dígitos." };
  if (!d.startsWith("0")) return { status: "error", text: "Debe comenzar con 0." };
  return { status: "ok", text: "Número ecuatoriano válido." };
}

function nombreHint(v: string): Hint {
  if (!v) return { status: "idle", text: "" };
  if (v.length > 60) return { status: "error", text: "Máximo 60 caracteres (60/60)." };
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
  return { status: "error", text: "El formato del correo no es válido." };
}

function passwordHint(v: string): Hint {
  if (!v) return { status: "idle", text: "" };
  const s = passwordScore(v);
  if (s === 5) return { status: "ok",     text: "Contraseña fuerte." };
  if (s === 4) return { status: "yellow", text: "Casi fuerte: agrega 1 carácter." };
  if (s === 3) return { status: "orange", text: "Media: añade mayúsculas o números." };
  return { status: "error",  text: "Débil: usa más variedad." };
}

function confirmHint(pw: string, conf: string): Hint {
  if (!conf) return { status: "idle",  text: "" };
  if (pw === conf) return { status: "ok",    text: "Las contraseñas coinciden." };
  return { status: "error", text: "Las contraseñas no coinciden." };
}

// -- Hint display --------------------------------------------------------------

function FieldHint({ hint, errorMsg }: { hint?: Hint, errorMsg?: string }) {
  if (errorMsg) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-500 mt-1">
        <AlertCircle className="h-3 w-3 shrink-0" />
        {errorMsg}
      </span>
    );
  }
  if (!hint || hint.status === "idle" || !hint.text) return null;
  const map = {
    ok:     { cls: "text-emerald-700", Icon: CheckCircle2 },
    warn:   { cls: "text-amber-500",   Icon: AlertCircle },
    error:  { cls: "text-red-500",     Icon: AlertCircle },
    orange: { cls: "text-orange-500",  Icon: AlertCircle },
    yellow: { cls: "text-yellow-500",  Icon: AlertCircle },
  }[hint.status as "ok" | "warn" | "error" | "orange" | "yellow"];
  return (
      <span className={`flex items-center gap-1 text-xs font-medium mt-1 min-w-0 break-words ${(map && map.cls) || ""}`}>
        <map.Icon className="h-3 w-3 shrink-0" />
        <span>{hint.text}</span>
      </span>
  );
}

// -- Helper functions for style ------------------------------------------------
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

const steps = [
  { id: 1, title: "Información fiscal", icon: Building2, fields: ["ruc", "identificacion"] },
  { id: 2, title: "Información personal", icon: User, fields: ["nombre", "apellido", "telefono", "direccion"] },
  { id: 3, title: "Seguridad", icon: Lock, fields: ["email", "password", "confirmPassword"] },
];

export function RegisterForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(1);
  const [showPw,  setShowPw]  = React.useState(false);
  const [showCpw, setShowCpw] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = React.useState(false);
  const [verifyData, setVerifyData] = React.useState<{ ruc: string; cedula: string; email: string } | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { ruc: "", identificacion: "", nombre: "", apellido: "", email: "", password: "", confirmPassword: "", direccion: "", telefono: "" },
    mode: "onChange",
  });

  const { watch, register, trigger, setValue, getValues, formState: { errors, isValid, isSubmitting } } = form;
  
  const ruc   = watch("ruc");
  const id    = watch("identificacion");
  const nombre = watch("nombre");
  const apellido = watch("apellido");
  const tel   = watch("telefono");
  const mail  = watch("email");
  const pw    = watch("password");
  const cpw   = watch("confirmPassword");

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
  React.useEffect(() => {
    if (id && id.length === 10) {
      const currentRuc = getValues("ruc");
      if (!currentRuc || currentRuc.length < 13) {
        setValue("ruc", id + "001", { shouldValidate: true });
      }
    }
  }, [id, getValues, setValue]);

  const numOnly = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep - 1].fields as any[];
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (currentStep < 3) {
      nextStep();
      return;
    }
    
    if (!acceptedTerms) { 
      toast.error("Debes aceptar los Términos y Condiciones."); 
      return; 
    }
    
    try {
      const res = await authService.register(values);
      toast.success(res.message);
      form.reset();
      setAcceptedTerms(false);
      setVerifyData({
        ruc: values.ruc,
        cedula: values.identificacion,
        email: values.email,
      });
      setVerifyModalOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar.");
    }
  });

  const pwColor =
    hPwScore === 0 ? "bg-slate-200"
    : hPwScore <= 2 ? "bg-red-500"
    : hPwScore === 3 ? "bg-orange-500"
    : hPwScore === 4 ? "bg-yellow-500"
    : "bg-emerald-500";

  return (
    <div className="auth-page min-h-screen flex bg-white font-sans text-slate-800">
      {/* Form Panel */}
      <div className="auth-panel flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-20 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="auth-card w-full max-w-lg mx-auto"
        >
          {/* Back link */}
          <Link
            href="/auth/login"
            className="auth-backlink inline-flex items-center gap-2 text-[#0967A4] font-medium hover:text-[#00517C] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio de sesión
          </Link>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="auth-header mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#00517C] mb-2">
              Crear cuenta empresarial
            </h1>
            <p className="text-gray-500 text-sm">
              Registra tu empresa para emitir comprobantes electrónicos autorizados por el SRI.
            </p>
          </motion.div>

          {/* Step indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <motion.div
                    className="flex flex-col items-center z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                        currentStep > step.id
                          ? "bg-[#248C95] text-white shadow-sm shadow-[#248C95]/30"
                          : currentStep === step.id
                          ? "bg-[#00517C] text-white shadow-sm shadow-[#00517C]/20"
                          : "bg-slate-100 text-slate-400"
                      }`}
                      whileHover={{ scale: 1.05 }}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span className={`mt-1.5 text-[11px] font-medium hidden sm:block ${
                      currentStep >= step.id ? "text-[#00517C]" : "text-slate-400"
                    }`}>
                      {step.title}
                    </span>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-gray-100 relative">
                      <motion.div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#0967A4] to-[#248C95]"
                        initial={{ width: "0%" }}
                        animate={{ 
                          width: currentStep > step.id ? "100%" : "0%" 
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} noValidate>
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#0967A4] to-[#248C95] rounded-full" />
                    <div>
                      <h3 className="text-base font-semibold text-[#0967A4]">Información fiscal</h3>
                      <p className="text-[11px] text-gray-500">Datos del SRI para comprobantes electrónicos.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingInput
                      label="RUC"
                      placeholder="1790000000001"
                      inputMode="numeric" pattern="[0-9]*" maxLength={13}
                      onInput={numOnly}
                      error={!!errors.ruc}
                      hint={<FieldHint hint={hRuc} errorMsg={errors.ruc?.message} />}
                      className={borderCls(hRuc.status, !!errors.ruc)}
                      {...register("ruc")}
                    />
                    <FloatingInput
                      label="Número de identificación"
                      placeholder="1710204155"
                      inputMode="numeric" pattern="[0-9]*" maxLength={10}
                      onInput={numOnly}
                      error={!!errors.identificacion}
                      hint={<FieldHint hint={hId} errorMsg={errors.identificacion?.message} />}
                      className={borderCls(hId.status, !!errors.identificacion)}
                      {...register("identificacion")}
                    />
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#0967A4] to-[#248C95] rounded-full" />
                    <div>
                      <h3 className="text-base font-semibold text-[#0967A4]">Información personal</h3>
                      <p className="text-[11px] text-gray-500">Datos del representante legal.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FloatingInput
                      label="Nombre"
                      placeholder="Ej. Juan"
                      maxLength={60}
                      error={!!errors.nombre}
                      hint={<FieldHint hint={hNombre} errorMsg={errors.nombre?.message} />}
                      className={borderCls(hNombre.status, !!errors.nombre)}
                      {...register("nombre")}
                    />
                    <FloatingInput
                      label="Apellido"
                      placeholder="Ej. Pérez"
                      maxLength={60}
                      error={!!errors.apellido}
                      hint={<FieldHint hint={hApellido} errorMsg={errors.apellido?.message} />}
                      className={borderCls(hApellido.status, !!errors.apellido)}
                      {...register("apellido")}
                    />
                  </div>
                  
                  <FloatingInput
                    label="Teléfono"
                    type="tel"
                    placeholder="+593 99 999 9999"
                    inputMode="numeric" pattern="[0-9]*" maxLength={10}
                    onInput={numOnly}
                    error={!!errors.telefono}
                    hint={<FieldHint hint={hTel} errorMsg={errors.telefono?.message} />}
                    className={borderCls(hTel.status, !!errors.telefono)}
                    {...register("telefono")}
                  />
                  
                  <FloatingInput
                    label="Dirección fiscal"
                    type="text"
                    placeholder="Ej. Av. Amazonas y Villalengua"
                    error={!!errors.direccion}
                    hint={<FieldHint hint={{ status: "idle", text: "" }} errorMsg={errors.direccion?.message} />}
                    className={borderCls("idle", !!errors.direccion)}
                    {...register("direccion")}
                  />
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#0967A4] to-[#248C95] rounded-full" />
                    <div>
                      <h3 className="text-base font-semibold text-[#0967A4]">Seguridad</h3>
                      <p className="text-[11px] text-gray-500">Credenciales de acceso.</p>
                    </div>
                  </div>
                  
                  <FloatingInput
                    label="Correo electrónico"
                    type="email"
                    placeholder="admin@empresa.com"
                    autoComplete="email"
                    error={!!errors.email}
                    hint={<FieldHint hint={hMail} errorMsg={errors.email?.message} />}
                    className={borderCls(hMail.status, !!errors.email)}
                    {...register("email")}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FloatingInput
                        label="Contraseña"
                        type={showPw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={!!errors.password}
                        className={borderCls(hPw.status, !!errors.password)}
                        {...register("password")}
                        endAdornment={
                          <button type="button" onClick={() => setShowPw(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                            aria-label={showPw ? "Ocultar" : "Mostrar"}>
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                      <FieldHint hint={hPw} errorMsg={errors.password?.message} />
                    </div>
                    
                    <div>
                      <FloatingInput
                        label="Confirmar contraseña"
                        type={showCpw ? "text" : "password"}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        error={!!errors.confirmPassword}
                        className={borderCls(hCpw.status, !!errors.confirmPassword)}
                        {...register("confirmPassword")}
                        endAdornment={
                          <button type="button" onClick={() => setShowCpw(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                            aria-label={showCpw ? "Ocultar" : "Mostrar"}>
                            {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        }
                      />
                      <FieldHint hint={hCpw} errorMsg={errors.confirmPassword?.message} />
                    </div>
                  </div>

                  {/* Terms checkbox */}
                  <div className="auth-terms cntr flex items-start mt-4">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="hidden-xs-up"
                      id="cbx"
                    />
                    <label htmlFor="cbx" className="auth-terms-box cbx" />
                    <label htmlFor="cbx" className="auth-terms-label lbl text-sm text-gray-600 select-none">
                      Acepto los{" "}
                      <TermsModal onAccept={() => setAcceptedTerms(true)} />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className="flex gap-4 mt-8">
              {currentStep > 1 && (
                <motion.button
                  type="button"
                  onClick={prevStep}
                  className="auth-btn flex-1 py-3 px-6 border-2 border-gray-200 text-[#00517C] font-semibold rounded-xl hover:border-[#0967A4] hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Anterior
                </motion.button>
              )}
              
              {currentStep < 3 ? (
                <motion.button
                  type="button"
                  onClick={nextStep}
                  className="auth-btn-primary flex-1 py-3 px-6 bg-gradient-to-r from-[#00517C] to-[#0967A4] text-white font-semibold rounded-xl shadow-md shadow-[#0967A4]/20 hover:shadow-lg hover:shadow-[#0967A4]/30 transition-all duration-300 flex items-center justify-center gap-2 group w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !acceptedTerms}
                  className="auth-btn-primary flex-1 py-3 px-6 bg-gradient-to-r from-[#00517C] to-[#0967A4] text-white font-semibold rounded-xl shadow-md shadow-[#0967A4]/20 hover:shadow-lg hover:shadow-[#0967A4]/30 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Crear cuenta"
                  )}
                </motion.button>
              )}
            </div>
          </form>

          {/* Login link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-gray-500 text-sm"
          >
            ¿Ya tienes cuenta?{" "}
            <Link href="/auth/login" className="text-[#0967A4] font-semibold hover:text-[#00517C] transition-colors">
              Inicia sesión
            </Link>
          </motion.p>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center text-xs text-gray-400"
          >
            © 2026 Factory. Todos los derechos reservados.
          </motion.p>
        </motion.div>
      </div>

      {/* Brand Panel */}
      <BrandPanel variant="register" />

      {/* Email Verification Modal */}
      {verifyData && (
        <VerifyEmailModal
          open={verifyModalOpen}
          onOpenChange={(open) => {
            setVerifyModalOpen(open);
            if (!open) {
              router.push("/auth/login");
            }
          }}
          ruc={verifyData.ruc}
          cedula={verifyData.cedula}
          email={verifyData.email}
          onVerified={() => {
            toast.success("Correo verificado correctamente. Ahora puedes iniciar sesión.");
            router.push("/auth/login");
          }}
        />
      )}
    </div>
  );
}
