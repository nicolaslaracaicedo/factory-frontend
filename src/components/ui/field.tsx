import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="flex w-full flex-col gap-1.5">
      <span className="text-xs font-semibold tracking-wide text-slate-500">
        {label}
      </span>
      {children}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}
