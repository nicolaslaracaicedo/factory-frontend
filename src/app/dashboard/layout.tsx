import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-slate-100">{children}</main>;
}
