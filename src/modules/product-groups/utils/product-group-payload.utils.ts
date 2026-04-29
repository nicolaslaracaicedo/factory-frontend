import type {
  GrupoProducto,
  GrupoProductoFormInput,
  GrupoProductoResponse,
  GruposProductoResponse,
} from "@/src/modules/product-groups/types/product-group.types";

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

const normalizeGrupo = (value: UnknownRecord): GrupoProducto => ({
  id: toNumber(value.id, 0),
  nombre: toText(value.nombre, ""),
  descripcion: toText(value.descripcion, ""),
  estado: toText(value.estado, ""),
});

export const normalizeGruposResponse = (payload: unknown): GruposProductoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.grupos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeGrupo(toRecord(item))),
  };
};

export const normalizeGrupoResponse = (payload: unknown): GrupoProductoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.grupo ?? raw;
  const grupo = normalizeGrupo(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: grupo,
  };
};

export const toGrupoFormInput = (grupo: GrupoProducto): GrupoProductoFormInput => ({
  nombre: grupo.nombre ?? "",
  descripcion: grupo.descripcion ?? "",
});
