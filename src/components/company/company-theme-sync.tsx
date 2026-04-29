"use client";

import { useEffect } from "react";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";

export function CompanyThemeSync() {
  useEffect(() => {
    const syncTheme = async () => {
      try {
        const company = await companyService.getCompany();
        applyCompanyTheme(company);
      } catch {
        applyCompanyTheme(null);
      }
    };

    void syncTheme();
  }, []);

  return null;
}
