import type {
  Producto,
  ProductoFormInput,
  ProductoResponse,
  ProductosResponse,
} from "@/src/modules/products/types/product.types";

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

const normalizeProducto = (value: UnknownRecord): Producto => ({
  id: toNumber(value.id, 0),
  codigo: toText(value.codigo, ""),
  descripcion: toText(value.descripcion, ""),
  tipo: toText(value.tipo, ""),
  id_grupo: toNumber(value.id_grupo, 0),
  id_iva: toNumber(value.id_iva, 0),
  unidad_medida: toText(value.unidad_medida, ""),
  precio: toNumber(value.precio, 0),
  tiene_ice: toBoolean(value.tiene_ice),
  porcentaje_ice: toNumber(value.porcentaje_ice, 0),
  codigo_ice: toText(value.codigo_ice, ""),
  tiene_irbpnr: toBoolean(value.tiene_irbpnr),
  valor_unitario_irbpnr: toNumber(value.valor_unitario_irbpnr, 0),
  estado: toText(value.estado, ""),
  // Campos enriquecidos opcionales del backend
  grupo_nombre: toText(value.grupo_nombre, "") || undefined,
  iva_nombre: toText(value.iva_nombre, "") || undefined,
  iva_codigo: toText(value.iva_codigo, "") || undefined,
  iva_porcentaje: value.iva_porcentaje !== undefined ? toNumber(value.iva_porcentaje, 0) : undefined,
  porcentaje_iva: value.porcentaje_iva !== undefined ? toNumber(value.porcentaje_iva, 0) : undefined,
  created_at: toText(value.created_at, ""),
  updated_at: toText(value.updated_at, ""),
});

export const normalizeProductosResponse = (payload: unknown): ProductosResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.productos ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeProducto(toRecord(item))),
  };
};

export const normalizeProductoResponse = (payload: unknown): ProductoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.producto ?? raw;
  const producto = normalizeProducto(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: producto,
  };
};

export const toProductoFormInput = (producto: Producto): ProductoFormInput => ({
  codigo: producto.codigo ?? "",
  descripcion: producto.descripcion ?? "",
  tipo: producto.tipo ?? "PRODUCTO",
  id_grupo: producto.id_grupo ?? 0,
  id_iva: producto.id_iva ?? 0,
  unidad_medida: producto.unidad_medida ?? "",
  precio: producto.precio ?? 0,
  tiene_ice: producto.tiene_ice ?? false,
  porcentaje_ice: producto.porcentaje_ice ?? 0,
  codigo_ice: producto.codigo_ice ?? "",
  tiene_irbpnr: producto.tiene_irbpnr ?? false,
  valor_unitario_irbpnr: producto.valor_unitario_irbpnr ?? 0.02,
});
