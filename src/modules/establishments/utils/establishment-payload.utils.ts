import type {
  Establecimiento,
  EstablecimientoFormInput,
  EstablecimientoResponse,
  EstablecimientosResponse,
} from "@/src/modules/establishments/types/establishment.types";

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

const normalizeEstablecimiento = (value: UnknownRecord): Establecimiento => ({
  id: toNumber(value.id, 0),
  id_empresa: toNumber(value.id_empresa, 0) || undefined,
  codigo: toText(value.codigo, ""),
  nombre: toText(value.nombre, ""),
  direccion: toText(value.direccion, ""),
  es_matriz: toBoolean(value.es_matriz),
  estado: toText(value.estado, ""),
  created_at: toText(value.created_at, ""),
  updated_at: toText(value.updated_at, ""),
});

export const normalizeEstablecimientosResponse = (
  payload: unknown
): EstablecimientosResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.establecimientos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeEstablecimiento(toRecord(item))),
  };
};

export const normalizeEstablecimientoResponse = (
  payload: unknown
): EstablecimientoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.establecimiento ?? raw;
  const establecimiento = normalizeEstablecimiento(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: establecimiento,
  };
};

export const toEstablecimientoFormInput = (
  establecimiento: Establecimiento
): EstablecimientoFormInput => ({
  codigo: establecimiento.codigo ?? "",
  nombre: establecimiento.nombre ?? "",
  direccion: establecimiento.direccion ?? "",
  es_matriz: establecimiento.es_matriz ?? false,
});
