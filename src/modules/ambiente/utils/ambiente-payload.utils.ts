import type {
  AmbienteItem,
  AmbientesResponse,
} from "@/src/modules/ambiente/types/ambiente.types";

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

const normalizeAmbiente = (value: UnknownRecord): AmbienteItem => ({
  id: toNumber(value.id, 0),
  codigo: toText(value.codigo ?? value.code ?? value.valor, ""),
  nombre: toText(value.nombre ?? value.name, ""),
  descripcion: toText(value.descripcion ?? value.descripcion_larga, ""),
});

export const normalizeAmbientesResponse = (payload: unknown): AmbientesResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.ambientes ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeAmbiente(toRecord(item))),
  };
};
