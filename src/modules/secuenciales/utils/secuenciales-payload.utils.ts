import type {
  SecuencialItem,
  SecuencialesResponse,
  SecuencialResponse,
  TiposDocumentoResponse,
  TipoDocumentoItem,
} from "@/src/modules/secuenciales/types/secuenciales.types";

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

const normalizeSecuencial = (value: UnknownRecord): SecuencialItem => ({
  id: toNumber(value.id, 0),
  id_punto_emision: toNumber(
    value.id_punto_emision ?? value.punto_emision_id ?? value.id_punto,
    0
  ),
  tipo_documento: toText(
    value.tipo_documento ?? value.tipoDocumento ?? value.tipo ?? value.codigo,
    ""
  ),
  ambiente: toNumber(value.ambiente ?? value.id_ambiente ?? value.ambiente_id, 0),
  estado: toText(value.estado ?? value.status, ""),
  secuencial: toText(
    value.secuencial ?? value.numero ?? value.numero_secuencial ?? value.actual,
    ""
  ),
});

const normalizeTipoDocumento = (value: UnknownRecord): TipoDocumentoItem => ({
  codigo: toText(value.codigo ?? value.tipo_documento ?? value.tipo ?? value.id, ""),
  nombre: toText(value.nombre ?? value.descripcion ?? value.detalle ?? value.label, ""),
  descripcion: toText(value.descripcion, ""),
});

export const normalizeSecuencialesResponse = (payload: unknown): SecuencialesResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.secuenciales ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeSecuencial(toRecord(item))),
  };
};

export const normalizeSecuencialResponse = (payload: unknown): SecuencialResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.secuencial ?? raw;
  const item = normalizeSecuencial(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: item,
  };
};

export const normalizeTiposDocumentoResponse = (
  payload: unknown
): TiposDocumentoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.tipos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeTipoDocumento(toRecord(item))),
  };
};
