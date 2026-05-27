"use client";

import { motion } from "framer-motion";

interface DiscountToggleProps {
  value: "PORCENTAJE" | "VALOR";
  onChange: (value: "PORCENTAJE" | "VALOR") => void;
}

export function DiscountToggle({ value, onChange }: DiscountToggleProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span>Descuento:</span>
      <div className="relative flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
        {(["PORCENTAJE", "VALOR"] as const).map((type) => {
          const active = value === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              className={`relative flex h-7 w-8 items-center justify-center text-xs font-bold ${
                active
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title={
                type === "PORCENTAJE"
                  ? "Descuento en porcentaje"
                  : "Descuento en valor monetario"
              }
            >
              {active && (
                <motion.div
                  layoutId="discount-bg"
                  className="absolute inset-0 rounded-lg shadow-sm"
                  style={{
                    backgroundColor:
                      type === "PORCENTAJE"
                        ? "rgb(14 165 233)"
                        : "rgb(16 185 129)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">
                {type === "PORCENTAJE" ? "%" : "$"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
