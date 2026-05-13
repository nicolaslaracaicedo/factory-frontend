import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ className = "", error = false, ...props }: SelectProps) {
  return (
    <select
      className={`h-9 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${error ? "border-rose-400" : "border-slate-300"} ${className}`}
      {...props}
    />
  );
}
