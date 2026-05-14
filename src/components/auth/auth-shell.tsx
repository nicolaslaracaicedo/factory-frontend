import type { ReactNode } from "react";
import { FileText, Users, Boxes, BarChart3 } from "lucide-react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-[3fr_2fr]">
      <div className="hidden bg-gradient-to-br from-sky-900 via-sky-700 to-sky-500 p-10 text-sky-50 lg:flex lg:flex-col lg:justify-center lg:gap-10">
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Gestión de facturación lista para escalar.
          </h1>
          <p className="mt-4 text-sm leading-6 text-sky-100">
            Centraliza la operación y mantén todo bajo control en un solo entorno.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-[560px] gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/20 bg-white/10 p-4 text-sm text-sky-100 shadow-sm backdrop-blur">
            <FileText className="h-7 w-7 text-sky-200" />
            <span>Emite facturas electrónicas, notas de crédito y débito en minutos.</span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/20 bg-white/10 p-4 text-sm text-sky-100 shadow-sm backdrop-blur">
            <Boxes className="h-7 w-7 text-sky-200" />
            <span>Controla productos, clientes, proveedores y puntos de emisión desde un solo lugar.</span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/20 bg-white/10 p-4 text-sm text-sky-100 shadow-sm backdrop-blur">
            <Users className="h-7 w-7 text-sky-200" />
            <span>Administra equipos, permisos y usuarios con trazabilidad completa.</span>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/20 bg-white/10 p-4 text-sm text-sky-100 shadow-sm backdrop-blur">
            <BarChart3 className="h-7 w-7 text-sky-200" />
            <span>Consulta reportes e impuestos con paneles listos para auditoría.</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/70 p-6 sm:p-10">
        <header className="mb-6 flex flex-col items-center text-center">
          <img
            src="/Factory.png"
            alt="Logo de Factory"
            className="h-24 w-auto object-contain"
          />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </header>

        {children}

        <footer className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
          {footer}
        </footer>
      </div>
    </section>
  );
}
