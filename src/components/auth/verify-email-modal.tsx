"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, Mail, Timer, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { authService } from "@/src/modules/auth/services/auth.service";
import { toast } from "sonner";

interface VerifyEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruc: string;
  cedula: string;
  email?: string;
  onVerified: () => void;
}

const OTP_LENGTH = 6;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VerifyEmailModal({ open, onOpenChange, ruc, cedula, email, onVerified }: VerifyEmailModalProps) {
  const [otpFields, setOtpFields] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [verified, setVerified] = useState(false);

  const codigo = otpFields.join("");

  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (open && timeLeft > 0 && !verified) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [open, timeLeft, verified]);

  useEffect(() => {
    if (open) {
      setOtpFields(Array(OTP_LENGTH).fill(""));
      setVerifying(false);
      setResending(false);
      setTimeLeft(900);
      setVerified(false);
    }
  }, [open]);

  useEffect(() => {
    if (codigo.length === OTP_LENGTH && !verifying) {
      handleVerify();
    }
  }, [codigo]);

  const handleOtpChange = (val: string, index: number) => {
    const digit = val.replace(/\D/g, "");
    if (!digit) {
      const newOtp = [...otpFields];
      newOtp[index] = "";
      setOtpFields(newOtp);
      return;
    }
    const char = digit[digit.length - 1];
    const newOtp = [...otpFields];
    newOtp[index] = char;
    setOtpFields(newOtp);

    if (index < OTP_LENGTH - 1 && char) {
      const nextInput = document.getElementById(`ve-otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otpFields[index] && index > 0) {
      const prevInput = document.getElementById(`ve-otp-input-${index - 1}`);
      prevInput?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      document.getElementById(`ve-otp-input-${index - 1}`)?.focus();
    }
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      document.getElementById(`ve-otp-input-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pastedData) return;
    const newOtp = [...otpFields];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtpFields(newOtp);
    const nextIdx = pastedData.length < OTP_LENGTH ? pastedData.length : OTP_LENGTH - 1;
    document.getElementById(`ve-otp-input-${nextIdx}`)?.focus();
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authService.reenviarVerificacion({ ruc, cedula });
      toast.success(res.message);
      setTimeLeft(900);
      setOtpFields(Array(OTP_LENGTH).fill(""));
    } catch (error: any) {
      toast.error(error.message || "No se pudo reenviar el código.");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (codigo.length < OTP_LENGTH) return;
    setVerifying(true);
    try {
      const res = await authService.verificarEmail({ ruc, cedula, codigo });
      toast.success(res.message);
      setVerified(true);
      setTimeout(() => {
        onVerified();
        onOpenChange(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Código incorrecto.");
      setOtpFields(Array(OTP_LENGTH).fill(""));
      const firstInput = document.getElementById("ve-otp-input-0");
      firstInput?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (codigo.length < OTP_LENGTH) {
      toast.error(`Por favor completa los ${OTP_LENGTH} dígitos del código.`);
      return;
    }
    handleVerify();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px] disabled:pointer-events-none"
          />
        </Dialog.Overlay>
        <Dialog.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          className="auth-modal fixed left-1/2 top-1/2 z-50 w-[min(92vw,500px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden flex flex-col focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col"
          >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5 shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200">
                  <Mail className="h-6 w-6 text-[#00517C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Verificar correo electrónico
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {verified
                      ? "Tu correo ha sido verificado exitosamente."
                      : `Ingresa el código de verificación enviado a${email ? ` ${email}` : " tu correo electrónico."}`
                    }
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 outline-none"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="px-6 py-6 bg-white">
              {verified ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-4 py-8"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm text-slate-600 text-center">
                    Redirigiendo...
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleVerifyClick} className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <label className="text-sm font-semibold tracking-wide text-[#00517C]">
                      Código de verificación
                    </label>
                    <div className="flex justify-center gap-2 items-center" dir="ltr">
                      {otpFields.map((digit, i) => (
                        <input
                          key={i}
                          id={`ve-otp-input-${i}`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          autoComplete="one-time-code"
                          maxLength={1}
                          className="w-12 h-14 rounded-lg border border-slate-200 text-center text-2xl font-bold text-slate-800 transition-all focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, i)}
                          onKeyDown={(e) => handleOtpKeyDown(e, i)}
                          onPaste={handleOtpPaste}
                          disabled={verifying}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Timer className="h-4 w-4 text-[#00517C]" />
                        <span className="text-sm">El código expira en:</span>
                      </div>
                      <span className="text-[28px] font-bold tracking-widest">
                        {formatTime(timeLeft)}
                      </span>
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending}
                        className="flex items-center gap-2 text-sm font-semibold text-[#0967A4] hover:text-[#00517C] transition-colors disabled:text-slate-400"
                      >
                        <RefreshCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
                        {resending ? "Reenviando..." : "Reenviar código"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {!verified && (
              <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0 bg-slate-50">
                <Dialog.Close asChild>
                  <button
                    className="h-10 px-5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </Dialog.Close>
                <button
                  type="button"
                  onClick={handleVerifyClick}
                  disabled={codigo.length < OTP_LENGTH || verifying || timeLeft <= 0}
                  className="h-10 px-5 rounded-lg text-sm font-bold bg-[#00517C] hover:bg-[#003959] text-white shadow-sm transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </span>
                  ) : (
                    "Verificar"
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
