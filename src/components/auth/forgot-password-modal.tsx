"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, KeyRound, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { authService } from "@/src/modules/auth/services/auth.service";

export function ForgotPasswordModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [ruc, setRuc] = useState("");
  const [cedula, setCedula] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const resetState = () => {
    setStep(1);
    setRuc("");
    setCedula("");
    setCodigo("");
    setNuevaContrasena("");
    setConfirmarContrasena("");
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(resetState, 300); // Reset after closing animation
    }
  };

  const numOnly = (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "");
  };

  const handleRequestCode = async () => {
    if (!ruc || ruc.length !== 13) {
      toast.error("Por favor ingresa un RUC válido de 13 dígitos.");
      return;
    }
    if (!cedula || cedula.length !== 10) {
      toast.error("Por favor ingresa una Cédula válida de 10 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.solicitarRecuperacion({ ruc, cedula });
      toast.success(res.message);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || "Error al solicitar el código.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!codigo) {
      toast.error("Por favor ingresa el código de recuperación.");
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
      setTimeout(resetState, 300);
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer la contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <span className="cursor-pointer font-bold text-[#00517C] transition-colors hover:underline">
          Recupérala
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <AnimatePresence>
          {open ? (
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              />
            </Dialog.Overlay>
          ) : null}
        </AnimatePresence>
        <Dialog.Content asChild forceMount onPointerDownOutside={(e) => e.preventDefault()}>
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 flex w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
          <div className="shrink-0 border-b border-slate-200 bg-slate-100 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                <KeyRound className="h-6 w-6 text-[#00517C]" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  Recuperar contraseña
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {step === 1 ? "Ingresa tus datos para recibir un código." : "Crea tu nueva contraseña segura."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`step-${step}`}
              className="space-y-4 px-6 py-6"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {step === 1 ? (
              <>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rec-ruc" className="text-xs font-semibold tracking-wide text-[#00517C]">RUC</label>
                  <input
                    id="rec-ruc"
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm outline-none transition-all duration-200 focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                    placeholder="1790000000001"
                    inputMode="numeric" pattern="[0-9]*" maxLength={13}
                    onInput={numOnly}
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rec-id" className="text-xs font-semibold tracking-wide text-[#00517C]">Cédula</label>
                  <input
                    id="rec-id"
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm outline-none transition-all duration-200 focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                    placeholder="1710204155"
                    inputMode="numeric" pattern="[0-9]*" maxLength={10}
                    onInput={numOnly}
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
              </>
              ) : (
              <>
                <div className="flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-xs font-medium text-emerald-800">
                    Se ha enviado un código de recuperación a tu correo. Válido por 15 minutos.
                  </p>
                </div>
                <div className="flex flex-col gap-1 mt-4">
                  <label htmlFor="rec-cod" className="text-xs font-semibold tracking-wide text-[#00517C]">Código de recuperación</label>
                  <input
                    id="rec-cod"
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm outline-none transition-all duration-200 focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                    placeholder="123456"
                    inputMode="numeric" pattern="[0-9]*" maxLength={6}
                    onInput={numOnly}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rec-npw" className="text-xs font-semibold tracking-wide text-[#00517C]">Nueva contraseña</label>
                  <input
                    id="rec-npw"
                    type="password"
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm outline-none transition-all duration-200 focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                    placeholder="••••••••"
                    value={nuevaContrasena}
                    onChange={(e) => setNuevaContrasena(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="rec-cpw" className="text-xs font-semibold tracking-wide text-[#00517C]">Confirmar contraseña</label>
                  <input
                    id="rec-cpw"
                    type="password"
                    className="w-full rounded-lg border border-slate-400 p-3 text-sm outline-none transition-all duration-200 focus:border-[#00517C] focus:ring-4 focus:ring-[#00517C]/10"
                    placeholder="••••••••"
                    value={confirmarContrasena}
                    onChange={(e) => setConfirmarContrasena(e.target.value)}
                  />
                </div>
              </>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
            <Dialog.Close asChild>
              <button className="h-10 px-5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            {step === 1 ? (
              <button
                onClick={handleRequestCode}
                disabled={loading}
                className="h-10 px-5 rounded-lg text-sm font-bold bg-[#00517C] hover:bg-[#003959] text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Solicitar código"}
              </button>
            ) : (
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="h-10 px-5 rounded-lg text-sm font-bold bg-[#00517c] hover:bg-[#003959] text-white shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>
            )}
          </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
