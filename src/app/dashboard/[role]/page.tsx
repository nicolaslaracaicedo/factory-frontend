"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RoleDashboardTemplate } from "@/src/components/dashboard/role-dashboard-template";
import { authService } from "@/src/modules/auth/services/auth.service";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { roleToSlug, slugToRole } from "@/src/modules/auth/utils/role.utils";

export default function RoleDashboardPage() {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());
  const params = useParams<{ role: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  // "loading" = aún no sabemos si hay sesión; "ready" = ya resolvimos
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  const currentRole = useMemo(() => {
    return slugToRole[params.role] ?? null;
  }, [params.role]);

  const userRoleSlug = useMemo(() => {
    return user ? roleToSlug[user.role] : null;
  }, [user]);

  // 1. Esperar a que Zustand termine de hidratar desde localStorage
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }

    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return unsubscribe;
  }, []);

  // 2. Una vez hidratado, decidir si necesitamos recuperar sesión o si ya estamos listos
  useEffect(() => {
    if (!hydrated) return;

    // Si Zustand ya tiene el user (lo normal en un reload), estamos listos
    if (useAuthStore.getState().user) {
      setStatus("ready");
      return;
    }

    // Si no hay user en Zustand, intentamos recuperar desde la cookie httpOnly
    let cancelled = false;

    fetch("/api/session/me")
      .then((res) => {
        if (!res.ok) throw new Error("No session");
        return res.json();
      })
      .then((data: { user?: Record<string, unknown> | null }) => {
        if (cancelled) return;
        if (data.user) {
          setSession({
            user: {
              id: data.user.id != null ? String(data.user.id) : undefined,
              ruc: String(data.user.ruc ?? ""),
              identificacion: String(data.user.identificacion ?? ""),
              role: (data.user.role as "Administrador" | "Facturador" | "Contador") ?? "Administrador",
              nombre: data.user.nombre != null ? String(data.user.nombre) : undefined,
              apellido: data.user.apellido != null ? String(data.user.apellido) : undefined,
              email: data.user.email != null ? String(data.user.email) : undefined,
            },
          });
          setStatus("ready");
        } else {
          clearSession();
          router.replace("/auth/login");
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          router.replace("/auth/login");
        }
      });

    return () => {
      cancelled = true;
    };
  // Solo ejecutar cuando hydrated cambia a true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // 3. Verificar que el role de la URL coincida con el del usuario
  useEffect(() => {
    if (status !== "ready" || !user) return;

    if (!currentRole) {
      router.replace("/auth/login");
      return;
    }

    if (userRoleSlug && params.role !== userRoleSlug) {
      router.replace(`/dashboard/${userRoleSlug}`);
    }
  }, [currentRole, status, params.role, router, user, userRoleSlug]);

  // Mostrar skeleton solo mientras cargamos
  if (status !== "ready" || !currentRole || !user || (userRoleSlug && params.role !== userRoleSlug)) {
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
