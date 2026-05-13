import type { ReactNode } from "react";

interface DashboardShellProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function DashboardShell({ sidebar, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
        {sidebar}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
