const fontVariableByName: Record<string, string> = {
  manrope: "var(--font-manrope)",
  roboto: "var(--font-roboto)",
  inter: "var(--font-inter)",
  poppins: "var(--font-poppins)",
};

export const resolveCompanyFont = (fontName?: string): string => {
  const key = fontName?.trim().toLowerCase();
  if (key && fontVariableByName[key]) {
    return fontVariableByName[key];
  }
  return "var(--font-manrope)";
};

export const applyCompanyTheme = (company?: { fuente_principal?: string, color_primario?: string, color_secundario?: string, color_acento?: string } | null) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement.style;
  
  root.setProperty(
    "--font-app-sans",
    resolveCompanyFont(company?.fuente_principal)
  );
  
  if (company?.color_primario) {
    root.setProperty("--primary", company.color_primario);
  }
  if (company?.color_secundario) {
    root.setProperty("--secondary", company.color_secundario);
  }
  if (company?.color_acento) {
    root.setProperty("--accent", company.color_acento);
  }
};
