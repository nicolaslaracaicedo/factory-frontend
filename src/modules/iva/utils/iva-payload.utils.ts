import type {
  CodigoIva,
  CodigoIvaFormInput,
  CodigoIvaResponse,
  CodigosIvaResponse,
} from "@/src/modules/iva/types/iva.types";

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

const normalizeCodigo = (value: UnknownRecord): CodigoIva => ({
  id: toNumber(value.id, 0),
  codigo: toText(value.codigo, ""),
  nombre: toText(value.nombre, ""),
  porcentaje: toNumber(value.porcentaje, 0),
  activo: toBoolean(value.activo),
});

export const normalizeCodigosIvaResponse = (payload: unknown): CodigosIvaResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.codigos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeCodigo(toRecord(item))),
  };
};

export const normalizeCodigoIvaResponse = (payload: unknown): CodigoIvaResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.codigo ?? raw;
  const codigo = normalizeCodigo(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: codigo,
  };
};

export const toCodigoIvaFormInput = (codigo: CodigoIva): CodigoIvaFormInput => ({
  codigo: codigo.codigo ?? "",
  nombre: codigo.nombre ?? "",
  porcentaje: codigo.porcentaje ?? 0,
});
