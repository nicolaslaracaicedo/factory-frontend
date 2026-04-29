import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ className = "", error = false, ...props }: InputProps) {
  return (
    <input
      className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${error ? "border-rose-400" : "border-slate-300"} ${className}`}
      {...props}
    />
  );
}
