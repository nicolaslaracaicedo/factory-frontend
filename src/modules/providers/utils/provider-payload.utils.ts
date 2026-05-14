import type {
  Proveedor,
  ProveedorFormInput,
  ProveedorResponse,
  ProveedoresResponse,
  TipoIdentificacion,
  TiposIdentificacionResponse,
} from "@/src/modules/providers/types/provider.types";

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

const normalizeProveedor = (value: UnknownRecord): Proveedor => {
  return {
    id: toNumber(value.id, 0),
    tipo_identificacion: toText(value.tipo_identificacion, ""),
    identificacion: toText(value.identificacion, ""),
    razon_social: toText(value.razon_social, ""),
    direccion: toText(value.direccion, ""),
    telefono: toText(value.telefono, ""),
    email: toText(value.email, ""),
    estado: toText(value.estado, ""),
    created_at: toText(value.created_at, ""),
    updated_at: toText(value.updated_at, ""),
  };
};

const normalizeTipoIdentificacion = (value: UnknownRecord): TipoIdentificacion => {
  const codigo = toText(
    value.codigo ?? value.code ?? value.id ?? value.value ?? value.tipo,
    ""
  );
  const nombre = toText(
    value.nombre ?? value.name ?? value.label ?? value.descripcion,
    ""
  );

  if (!codigo && nombre) {
    return { codigo: nombre, nombre: "" };
  }

  return { codigo, nombre };
};

export const normalizeProveedoresResponse = (payload: unknown): ProveedoresResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.proveedores ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeProveedor(toRecord(item))),
  };
};

export const normalizeProveedorResponse = (payload: unknown): ProveedorResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.proveedor ?? raw;
  const proveedor = normalizeProveedor(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: proveedor,
  };
};

export const normalizeTiposIdentificacionResponse = (
  payload: unknown
): TiposIdentificacionResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.tipos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) =>
      normalizeTipoIdentificacion(
        typeof item === "string" || typeof item === "number"
          ? { codigo: String(item) }
          : toRecord(item)
      )
    ),
  };
};

export const toProveedorFormInput = (proveedor: Proveedor): ProveedorFormInput => ({
  tipo_identificacion: proveedor.tipo_identificacion ?? "",
  identificacion: proveedor.identificacion ?? "",
  razon_social: proveedor.razon_social ?? "",
  direccion: proveedor.direccion ?? "",
  telefono: proveedor.telefono ?? "",
  email: proveedor.email ?? "",
});
