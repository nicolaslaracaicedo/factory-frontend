"use client";

import { TriangleAlert, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";

type ConfirmVariant = "danger" | "success" | "warning" | "info";

const variantStyles = {
  danger: {
    Icon: TriangleAlert,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    button: "bg-red-500 hover:bg-red-600",
  },
  success: {
    Icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    button: "bg-emerald-500 hover:bg-emerald-600",
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    Icon: Info,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-500",
    button: "bg-blue-500 hover:bg-blue-600",
  },
};

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

export function confirmAction(opts: string | ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const config: ConfirmOptions =
      typeof opts === "string" ? { message: opts } : opts;

    const variant = variantStyles[config.variant || "danger"];
    const { Icon, iconBg, iconColor, button } = variant;

    toast.custom(
      (tId) => {
        const dismiss = () => toast.dismiss(tId);

        const handleConfirm = () => {
          dismiss();
          resolve(true);
        };

        const handleCancel = () => {
          dismiss();
          resolve(false);
        };

        return (
          <div className="w-[360px] rounded-xl bg-white p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {config.title || "Confirmar acción"}
                  </p>
                  {config.message.split("\n\n").map((part, i, arr) => (
                    <p key={i} className={`mt-0.5 text-sm ${i === arr.length - 1 && arr.length > 1 ? "font-bold text-slate-800" : "text-slate-600"}`}>
                      {part}
                    </p>
                  ))}
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="h-9 rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                {config.cancelText || "Cancelar"}
              </button>
              <button
                onClick={handleConfirm}
                className={`h-9 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${button}`}
              >
                {config.confirmText || "Confirmar"}
              </button>
            </div>
          </div>
        );
      },
      {
        duration: Infinity,
        position: "bottom-right",
        style: { border: "none", background: "transparent", boxShadow: "none", padding: 0 },
      },
    );
  });
}
