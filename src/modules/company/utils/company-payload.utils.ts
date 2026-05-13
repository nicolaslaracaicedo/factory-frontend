import type {
  Company,
  CompanyFormInput,
  CompanyResponse,
} from "@/src/modules/company/types/company.types";

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord => {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
};

const toText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "si";
  }
  return false;
};

const toNumber = (value: unknown, fallback = 1): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const toProxyLogoUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  const apiBase = API_BASE.replace(/\/$/, "");
  const isAbsolute = trimmed.startsWith("http://") || trimmed.startsWith("https://");
  const isApiAsset = apiBase && isAbsolute && trimmed.startsWith(apiBase);
  const relativePath = isApiAsset
    ? trimmed.slice(apiBase.length)
    : trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;

  if (isApiAsset || !isAbsolute) {
    return `/api/empresa/logo?path=${encodeURIComponent(relativePath)}`;
  }

  return trimmed;
};

export const normalizeCompanyResponse = (payload: unknown): CompanyResponse => {
  const raw = toRecord(payload);
  const source = toRecord(raw.data ?? raw.empresa ?? raw.company ?? raw);

  const company: Company = {
    id: toNumber(source.id, 0) || undefined,
    ruc: toText(source.ruc, ""),
    identificacion: toText(source.identificacion ?? source.cedula ?? source.ruc, ""),
    logo: toProxyLogoUrl(
      toText(
        source.logo ??
          source.logo_url ??
          source.logoUrl ??
          source.logo_path ??
          source.logoPath ??
          source.url_logo ??
          source.path_logo,
        ""
      )
    ),
    razon_social: toText(source.razon_social, ""),
    nombre_comercial: toText(source.nombre_comercial, ""),
    direccion_matriz: toText(source.direccion_matriz, ""),
    telefono: toText(source.telefono, ""),
    email: toText(source.email, ""),
    color_primario: toText(source.color_primario, ""),
    color_secundario: toText(source.color_secundario, ""),
    color_acento: toText(source.color_acento, ""),
    fuente_principal: toText(source.fuente_principal, ""),
    contribuyente_especial: toBoolean(source.contribuyente_especial),
    nro_contribuyente_esp: toText(source.nro_contribuyente_esp, ""),
    obligado_contabilidad: toBoolean(source.obligado_contabilidad),
    agente_retencion: toBoolean(source.agente_retencion),
    rimpe: toBoolean(source.rimpe),
    regimen: toText(source.regimen, ""),
    ambiente: toNumber(source.ambiente, 1),
    estado: toText(source.estado, ""),
    created_at: toText(source.created_at, ""),
    updated_at: toText(source.updated_at, ""),
    smtp_host: toText(source.smtp_host, ""),
    smtp_port: toNumber(source.smtp_port, 587),
    smtp_user: toText(source.smtp_user, ""),
    smtp_from_name: toText(source.smtp_from_name, ""),
    smtp_secure: toBoolean(source.smtp_secure),
    smtp_configurado: toBoolean(source.smtp_configurado),
  };

  return {
    message: toText(raw.message, ""),
    data: company,
  };
};

export const toCompanyFormInput = (company: Company): CompanyFormInput => ({
  ruc: company.ruc ?? "",
  identificacion: company.identificacion ?? "",
  logo: null,
  razon_social: company.razon_social ?? "",
  nombre_comercial: company.nombre_comercial ?? "",
  direccion_matriz: company.direccion_matriz ?? "",
  telefono: company.telefono ?? "",
  email: company.email ?? "",
  color_primario: company.color_primario ?? "",
  color_secundario: company.color_secundario ?? "",
  color_acento: company.color_acento ?? "",
  fuente_principal: company.fuente_principal ?? "",
  contribuyente_especial: company.contribuyente_especial ?? false,
  nro_contribuyente_esp: company.nro_contribuyente_esp ?? "",
  obligado_contabilidad: company.obligado_contabilidad ?? false,
  agente_retencion: company.agente_retencion ?? false,
  rimpe: company.rimpe ?? false,
  regimen: company.regimen ?? "",
  ambiente: company.ambiente ?? 1,
  smtp_host: company.smtp_host ?? "",
  smtp_port: company.smtp_port ?? 587,
  smtp_user: company.smtp_user ?? "",
  smtp_password: "",
  smtp_from_name: company.smtp_from_name ?? "",
  smtp_secure: company.smtp_secure ?? false,
});

export const buildCompanyFormData = (input: CompanyFormInput): FormData => {
  const formData = new FormData();

  if (input.logo) {
    formData.append("logo", input.logo);
  }

  formData.append("ruc", input.ruc);
  formData.append("identificacion", input.identificacion);
  formData.append("razon_social", input.razon_social);
  formData.append("nombre_comercial", input.nombre_comercial);
  formData.append("direccion_matriz", input.direccion_matriz);
  formData.append("telefono", input.telefono);
  formData.append("email", input.email);
  formData.append("color_primario", input.color_primario);
  formData.append("color_secundario", input.color_secundario);
  formData.append("color_acento", input.color_acento);
  formData.append("fuente_principal", input.fuente_principal);
  formData.append("contribuyente_especial", String(input.contribuyente_especial));
  formData.append("nro_contribuyente_esp", input.nro_contribuyente_esp);
  formData.append("obligado_contabilidad", String(input.obligado_contabilidad));
  formData.append("agente_retencion", String(input.agente_retencion));
  formData.append("rimpe", String(input.rimpe));
  formData.append("regimen", input.regimen);
  formData.append("ambiente", String(input.ambiente));
  formData.append("smtp_host", input.smtp_host);
  formData.append("smtp_port", String(input.smtp_port));
  formData.append("smtp_user", input.smtp_user);
  if (input.smtp_password) {
    formData.append("smtp_password", input.smtp_password);
  }
  formData.append("smtp_from_name", input.smtp_from_name);
  formData.append("smtp_secure", String(input.smtp_secure));

  return formData;
};
