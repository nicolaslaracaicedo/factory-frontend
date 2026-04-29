import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ className = "", error = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={`min-h-[88px] w-full resize-y rounded-xl border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 ${error ? "border-rose-400" : "border-slate-300"} ${className}`}
      {...props}
    />
  );
}
