import type { Company } from "@/src/modules/company/types/company.types";

export const COMPANY_CACHE_KEY = "factory_company_cache";
export const COMPANY_THEME_CACHE_KEY = "factory_company_theme_cache";

export const readCompanyCache = (): Company | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COMPANY_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Company;
  } catch {
    return null;
  }
};

export const writeCompanyCache = (company: Company): void => {
  if (typeof window === "undefined") return;
  try {
    const previous = readCompanyCache();
    const merged = { ...(previous ?? {}), ...company };
    localStorage.setItem(COMPANY_CACHE_KEY, JSON.stringify(merged));
  } catch {}
};

export const writeCompanyThemeCache = (company?: Company | null): void => {
  if (typeof window === "undefined" || !company) return;
  try {
    const theme = {
      color_primario: company.color_primario,
      color_secundario: company.color_secundario,
      color_acento: company.color_acento,
    };
    localStorage.setItem(COMPANY_THEME_CACHE_KEY, JSON.stringify(theme));
  } catch {}
};
