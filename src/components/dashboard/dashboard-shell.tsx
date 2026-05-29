"use client";

import type { ReactNode } from "react";

interface DashboardShellProps {
  sidebar: ReactNode;
  sidebarCollapsed: boolean;
  children: ReactNode;
}

export function DashboardShell({ sidebar, sidebarCollapsed, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div
        className={`dashboard-shell grid min-h-screen transition-[grid-template-columns] duration-300 ease-out ${
          sidebarCollapsed ? "grid-cols-[70px_minmax(0,1fr)]" : "grid-cols-[240px_minmax(0,1fr)]"
        }`}
      >
        {sidebar}
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
