import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-sky-900 via-sky-700 to-sky-500 p-10 text-sky-50 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-200">
            Factory SaaS
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Gestion de facturacion lista para escalar.
          </h1>
          <p className="mt-4 text-sm leading-6 text-sky-100">{subtitle}</p>
        </div>
        <ul className="space-y-3 text-sm text-sky-100">
          <li>Administrador: controla empresas y configuraciones globales.</li>
          <li>Facturador: opera ventas, documentos y clientes.</li>
          <li>Contador: revisa impuestos, cierres y reportes.</li>
        </ul>
      </div>

      <div className="bg-slate-50/70 p-6 sm:p-10">
        <header className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Factory Auth
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{title}</h2>
        </header>

        {children}

        <footer className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-600">
          {footer}
        </footer>
      </div>
    </section>
  );
}
