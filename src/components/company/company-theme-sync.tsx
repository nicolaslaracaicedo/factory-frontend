"use client";

import { useEffect } from "react";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";
import { readCompanyCache, writeCompanyCache, writeCompanyThemeCache } from "@/src/modules/company/utils/company-cache.utils";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";

export function CompanyThemeSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const cached = readCompanyCache();
    if (cached) {
      applyCompanyTheme(cached);
      writeCompanyThemeCache(cached);
    }

    const hasPersistedAuthSession = () => {
      if (typeof window === "undefined") return false;
      try {
        const raw = localStorage.getItem("factory_auth");
        if (!raw) return false;
        const parsed = JSON.parse(raw) as { state?: { isAuthenticated?: boolean } };
        return Boolean(parsed?.state?.isAuthenticated);
      } catch {
        return false;
      }
    };

    const syncTheme = async () => {
      if (!isAuthenticated) {
        // Evita parpadeo de colores por hidratación inicial de Zustand.
        if (hasPersistedAuthSession()) return;
        applyCompanyTheme(null);
        return;
      }

      try {
        const company = await companyService.getCompany(token ?? undefined);
        applyCompanyTheme(company);
        writeCompanyCache(company);
        writeCompanyThemeCache(company);
      } catch (error) {
        if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
          clearSession();
        }
      }
    };

    void syncTheme();
  }, [isAuthenticated, token, clearSession]);

  return null;
}
