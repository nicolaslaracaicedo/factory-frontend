interface LoaderProps {
  label?: string;
  className?: string;
}

export function Loader({ label = "Cargando", className }: LoaderProps) {
  return (
    <div className={`flex min-h-[200px] items-center justify-center ${className ?? ""}`}>
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-app-primary"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
