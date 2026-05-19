"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X, KeyRound, ArrowLeft, EyeOff, Eye, Timer } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useState, useEffect } from "react";
import { authService } from "@/src/modules/auth/services/auth.service";
import { toast } from "sonner";

export function RecoverPasswordModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutos en segundos

  // Form State
  const [ruc, setRuc] = useState("");
  const [cedula, setCedula] = useState("");
  const [otpFields, setOtpFields] = useState<string[]>(Array(6).fill(""));
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const codigo = otpFields.join("");

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (open && step >= 2 && timeLeft > 0) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      toast.error("El código de verificación ha expirado. Solicita uno nuevo.");
      setStep(1);
    }
    return () => clearInterval(timerId);
  }, [open, step, timeLeft]);

  const numOnly = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        setRuc("");
        setCedula("");
        setOtpFields(Array(6).fill(""));
        setNuevaContrasena("");
        setConfirmarContrasena("");
        setTimeLeft(900);
      }, 200);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruc || ruc.length < 13) {
      toast.error("El RUC debe tener 13 dígitos.");
      return;
    }
    if (!cedula || cedula.length < 10) {
      toast.error("La cédula debe tener 10 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.solicitarRecuperacion({ ruc, cedula });
      toast.success(res.message);
      setTimeLeft(900);
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || "Error al solicitar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length < 6) {
      toast.error("Por favor completa los 6 dígitos del código.");
      return;
    }
    // Avance visual (simulando validación paso 2 a paso 3)
    setStep(3);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length < 6) {
      toast.error("Falta el código de verificación.");
      return;
    }
    if (nuevaContrasena.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.restablecerContrasena({
        ruc,
        cedula,
        codigo,
        nuevaContrasena,
        confirmarContrasena,
      });
      toast.success(res.message);
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Handling Functions
  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, "");
    if (!digit) {
      const newOtp = [...otpFields];
      newOtp[index] = "";
      setOtpFields(newOtp);
      return;
    }
    const char = digit[digit.length - 1]; // siempre toma el último caracter escrito
    const newOtp = [...otpFields];
    newOtp[index] = char;
    setOtpFields(newOtp);

    if (index < 5 && char) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpFields[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`otp-input-${index - 1}`)?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;
    const newOtp = [...otpFields];
    for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
    }
    setOtpFields(newOtp);
    const nextIdx = pastedData.length < 6 ? pastedData.length : 5;
    document.getElementById(`otp-input-${nextIdx}`)?.focus();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <span className="cursor-pointer font-bold text-[#006591] transition-colors hover:underline">
          Recupérala
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px] disabled:pointer-events-none" />
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden flex flex-col focus:outline-none"
        >
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-5 shrink-0">
            <div className="flex items-center gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step === 2 ? 1 : 2)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                  aria-label="Volver"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <KeyRound className="h-6 w-6 text-app-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  Recuperar contraseña
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {step === 1 && "Ingresa tus datos para enviarte un código de recuperación."}
                  {step === 2 && "Ingresa el código enviado a tu correo electrónico."}
                  {step === 3 && "Crea tu nueva contraseña segura."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 outline-none focus:ring-2 focus:ring-slate-300"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div className="px-6 py-6 bg-white">
            {step === 1 ? (
              <form id="recover-step-1" onSubmit={handleRequestCode} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rec-ruc" className="text-sm font-semibold tracking-wide text-[#003959]">RUC</label>
                  <input
                    id="rec-ruc"
                    className="w-full rounded-lg border border-slate-200 p-3.5 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                    placeholder="1790000000001"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={13}
                    onInput={numOnly}
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rec-cedula" className="text-sm font-semibold tracking-wide text-[#003959]">Cédula</label>
                  <input
                    id="rec-cedula"
                    className="w-full rounded-lg border border-slate-200 p-3.5 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                    placeholder="1710204155"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={10}
                    onInput={numOnly}
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    required
                  />
                </div>
              </form>
            ) : step === 2 ? (
              <form id="recover-step-2" onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <label className="text-sm font-semibold tracking-wide text-[#003959]">Código de verificación</label>
                  <div className="flex justify-center gap-2 items-center" dir="ltr">
                    {otpFields.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-input-${i}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={1}
                        className="w-12 h-14 rounded-lg border border-slate-200 text-center text-2xl font-bold text-slate-800 transition-all focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, i)}
                        onKeyDown={(e) => handleOtpKeyDown(e, i)}
                        onPaste={handleOtpPaste}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Timer className="h-4 w-4 text-[#0EA5E9]" />
                    <span className="text-sm">El código expira en:</span>
                  </div>
                  <span className={`text-[28px] font-bold tracking-widest ${timeLeft <= 60 ? 'text-red-500' : 'text-slate-800'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </form>
            ) : (
              <form id="recover-step-3" onSubmit={handleResetPassword} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rec-nueva" className="text-sm font-semibold tracking-wide text-[#003959]">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      id="rec-nueva"
                      type={showPw ? "text" : "password"}
                      className="w-full rounded-lg border border-slate-200 p-3.5 pr-10 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                      placeholder="••••••••"
                      value={nuevaContrasena}
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                      aria-label={showPw ? "Ocultar" : "Mostrar"}>
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="rec-confirmar" className="text-sm font-semibold tracking-wide text-[#003959]">Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      id="rec-confirmar"
                      type={showCpw ? "text" : "password"}
                      className="w-full rounded-lg border border-slate-200 p-3.5 pr-10 text-sm outline-none transition-all duration-200 focus:border-[#0EA5E9] focus:ring-4 focus:ring-[#0EA5E9]/10"
                      placeholder="••••••••"
                      value={confirmarContrasena}
                      onChange={(e) => setConfirmarContrasena(e.target.value)}
                      required
                    />
                    <button type="button" onClick={() => setShowCpw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-[#71787f] transition-colors hover:bg-slate-100"
                      aria-label={showCpw ? "Ocultar" : "Mostrar"}>
                      {showCpw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0 bg-slate-50">
            <Dialog.Close asChild>
              <Button variant="secondary" className="h-10 px-5" disabled={loading}>
                Cancelar
              </Button>
            </Dialog.Close>
            {step === 1 ? (
              <Button
                type="submit"
                form="recover-step-1"
                disabled={loading}
                className="h-10 px-5 bg-[#0EA5E9] hover:bg-[#0284c7] text-white disabled:bg-slate-300 disabled:text-slate-500"
              >
                {loading ? "Solicitando..." : "Solicitar código"}
              </Button>
            ) : step === 2 ? (
              <Button
                type="submit"
                form="recover-step-2"
                disabled={timeLeft <= 0}
                className="h-10 px-5 bg-[#0EA5E9] hover:bg-[#0284c7] text-white disabled:bg-slate-300 disabled:text-slate-500"
              >
                Ingresar código
              </Button>
            ) : (
              <Button
                type="submit"
                form="recover-step-3"
                disabled={loading}
                className="h-10 px-5 bg-[#0EA5E9] hover:bg-[#0284c7] text-white disabled:bg-slate-300 disabled:text-slate-500"
              >
                {loading ? "Restableciendo..." : "Restablecer contraseña"}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
