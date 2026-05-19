"use client";

import { TriangleAlert } from "lucide-react";
import { toast } from "sonner";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

export function confirmAction(opts: string | ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const config: ConfirmOptions =
      typeof opts === "string" ? { message: opts } : opts;

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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                <TriangleAlert className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {config.title || "Confirmar acción"}
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {config.message}
                </p>
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
                className={`h-9 rounded-lg px-4 text-sm font-semibold text-white transition-colors ${
                  config.destructive !== false
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
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
