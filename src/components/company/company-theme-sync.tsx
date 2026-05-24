"use client";

import { useEffect } from "react";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";

export function CompanyThemeSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    const syncTheme = async () => {
      if (!isAuthenticated) {
        applyCompanyTheme(null);
        return;
      }

      try {
        const company = await companyService.getCompany(token ?? undefined);
        applyCompanyTheme(company);
      } catch (error) {
        applyCompanyTheme(null);
        if (error instanceof Error && "status" in error && (error as { status: number }).status === 401) {
          clearSession();
        }
      }
    };

    void syncTheme();
  }, [isAuthenticated, clearSession]);

  return null;
}
