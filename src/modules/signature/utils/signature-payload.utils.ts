import type {
  FirmaElectronica,
  FirmaResponse,
  FirmasResponse,
  FirmaUploadInput,
} from "@/src/modules/signature/types/signature.types";

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

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
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

const normalizeCertificado = (value: UnknownRecord) => ({
  titular: toText(value.titular, ""),
  organizacion: toText(value.organizacion, ""),
  unidad: toText(value.unidad, ""),
  pais: toText(value.pais ?? value.country, ""),
  valido_desde: toText(value.validoDesde ?? value.valido_desde, ""),
  valido_hasta: toText(value.validoHasta ?? value.valido_hasta, ""),
  emisor: toText(value.emisor ?? value.issuer, ""),
  serial: toText(value.serial ?? value.numero_serie, ""),
});

const normalizeFirma = (value: UnknownRecord): FirmaElectronica => ({
  id: toNumber(value.id, 0),
  nombre: toText(value.nombre, ""),
  archivo: toText(value.archivo ?? value.firma ?? value.filename, ""),
  activo: toBoolean(value.activo ?? value.estado),
  empresa_id: toNumber(value.empresa_id ?? value.id_empresa, 0) || undefined,
  fecha_registro: toText(value.fecha_registro ?? value.created_at, ""),
  fecha_expiracion: toText(
    value.fecha_expiracion ?? value.expira_en ?? value.fecha_vencimiento,
    ""
  ),
  estado_certificado: toText(value.estado_certificado ?? value.estado_cert, ""),
  certificado:
    typeof value.certificado === "object" && value.certificado !== null
      ? normalizeCertificado(toRecord(value.certificado))
      : undefined,
});

export const normalizeFirmasResponse = (payload: unknown): FirmasResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.firmas ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeFirma(toRecord(item))),
  };
};

export const normalizeFirmaResponse = (payload: unknown): FirmaResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.firma ?? raw;
  const firma = normalizeFirma(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: firma,
  };
};

export const buildFirmaFormData = (input: FirmaUploadInput): FormData => {
  const formData = new FormData();
  formData.append("firma", input.firma);
  formData.append("password", input.password);
  formData.append("nombre", input.nombre);
  return formData;
};
