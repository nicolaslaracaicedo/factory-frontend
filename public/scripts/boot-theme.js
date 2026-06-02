(function () {
  try {
    var themeRaw = localStorage.getItem("factory_company_theme_cache");
    var companyRaw = localStorage.getItem("factory_company_cache");
    var theme = themeRaw ? JSON.parse(themeRaw) : null;
    var company = companyRaw ? JSON.parse(companyRaw) : null;
    var root = document.documentElement.style;
    var primary = theme && theme.color_primario ? theme.color_primario : company && company.color_primario;
    var secondary = theme && theme.color_secundario ? theme.color_secundario : company && company.color_secundario;
    var accent = theme && theme.color_acento ? theme.color_acento : company && company.color_acento;

    if (primary) root.setProperty("--primary", primary);
    if (secondary) root.setProperty("--secondary", secondary);
    if (accent) root.setProperty("--accent", accent);

    if (company && company.logo) {
      var link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = company.logo;
      document.head.appendChild(link);
    }
  } catch (e) {}
})();
