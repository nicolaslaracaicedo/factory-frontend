import type {
  PuntoEmision,
  PuntoEmisionFormInput,
  PuntoEmisionResponse,
  PuntosEmisionResponse,
} from "@/src/modules/emission-points/types/emission-point.types";

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

const normalizePunto = (value: UnknownRecord): PuntoEmision => ({
  id: toNumber(value.id, 0),
  id_establecimiento: toNumber(value.id_establecimiento, 0),
  codigo: toText(value.codigo, ""),
  descripcion: toText(value.descripcion, ""),
  estado: toText(value.estado, ""),
  created_at: toText(value.created_at, ""),
  updated_at: toText(value.updated_at, ""),
});

export const normalizePuntosResponse = (payload: unknown): PuntosEmisionResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.puntos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizePunto(toRecord(item))),
  };
};

export const normalizePuntoResponse = (payload: unknown): PuntoEmisionResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.punto ?? raw;
  const punto = normalizePunto(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: punto,
  };
};

export const toPuntoFormInput = (punto: PuntoEmision): PuntoEmisionFormInput => ({
  id_establecimiento: punto.id_establecimiento ?? 0,
  codigo: punto.codigo ?? "",
  descripcion: punto.descripcion ?? "",
});
