import type {
  Cliente,
  ClienteFormInput,
  ClienteResponse,
  ClientesResponse,
} from "@/src/modules/clients/types/client.types";

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

const normalizeCliente = (value: UnknownRecord): Cliente => {
  return {
    id: toNumber(value.id, 0),
    tipo_identificacion: toText(value.tipo_identificacion, ""),
    identificacion: toText(value.identificacion, ""),
    razon_social: toText(value.razon_social, ""),
    direccion: toText(value.direccion, ""),
    telefono: toText(value.telefono, ""),
    email: toText(value.email, ""),
    es_recurrente: toBoolean(value.es_recurrente),
    estado: toText(value.estado, ""),
  };
};

export const normalizeClientesResponse = (payload: unknown): ClientesResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.clientes ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeCliente(toRecord(item))),
  };
};

export const normalizeClienteResponse = (payload: unknown): ClienteResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.cliente ?? raw;
  const cliente = normalizeCliente(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: cliente,
  };
};

export const toClienteFormInput = (cliente: Cliente): ClienteFormInput => ({
  tipo_identificacion: cliente.tipo_identificacion ?? "",
  identificacion: cliente.identificacion ?? "",
  razon_social: cliente.razon_social ?? "",
  direccion: cliente.direccion ?? "",
  telefono: cliente.telefono ?? "",
  email: cliente.email ?? "",
  es_recurrente: cliente.es_recurrente ?? false,
});
