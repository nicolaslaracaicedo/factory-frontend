import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_20%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_90%_0%,rgba(2,132,199,0.22),transparent_40%),linear-gradient(160deg,#f8fcff_0%,#edf5fb_48%,#f3f8fc_100%)]" />
      {children}
    </main>
  );
}
