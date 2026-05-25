"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoleDashboardTemplate } from "@/src/components/dashboard/role-dashboard-template";
import { authService } from "@/src/modules/auth/services/auth.service";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { slugToRole } from "@/src/modules/auth/utils/role.utils";

export default function RoleDashboardPage() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const currentRole = useMemo(() => {
    return slugToRole[params.role] ?? null;
  }, [params.role]);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!currentRole) {
      router.replace("/auth/login");
    }
  }, [currentRole, hydrated, router]);

  if (!hydrated || !currentRole || !user) {
    return (
      <section className="m-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:m-6">
        <div className="h-5 w-40 animate-pulse rounded-md bg-slate-100" />
      </section>
    );
  }

  return (
    <RoleDashboardTemplate
      role={currentRole}
      user={user}
      onLogout={async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error("Logout failed", error);
        } finally {
          clearSession();
          window.location.href = "/auth/login";
        }
      }}
    />
  );
}
