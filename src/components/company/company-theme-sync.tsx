"use client";

import { useEffect } from "react";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";

export function CompanyThemeSync() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const syncTheme = async () => {
      if (!isAuthenticated) {
        applyCompanyTheme(null);
        return;
      }

      try {
        const company = await companyService.getCompany();
        applyCompanyTheme(company);
      } catch {
        applyCompanyTheme(null);
      }
    };

    void syncTheme();
  }, [isAuthenticated]);

  return null;
}
