import type {
  RecurrenteFormState,
  RecurrenteItem,
  RecurrenteDetalle,
  RecurrenteResponse,
  RecurrentesResponse,
  FrecuenciaRecurrente,
} from "@/src/modules/recurrentes/types/recurrentes.types";

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

const frecuenciasValidas: FrecuenciaRecurrente[] = ["DIARIA", "SEMANAL", "QUINCENAL", "MENSUAL", "ANUAL"];

const toFrecuencia = (value: unknown): FrecuenciaRecurrente => {
  if (typeof value === "string" && frecuenciasValidas.includes(value as FrecuenciaRecurrente)) {
    return value as FrecuenciaRecurrente;
  }
  return "MENSUAL";
};

export const normalizeDetalle = (data: unknown): RecurrenteDetalle => {
  const record = toRecord(data);
  return {
    id: toNumber(record.id, undefined),
    id_recurrente: toNumber(record.id_recurrente, undefined),
    id_producto: record.id_producto ? toNumber(record.id_producto) : undefined,
    codigo: toText(record.codigo, undefined),
    descripcion: toText(record.descripcion, undefined),
    cantidad: toNumber(record.cantidad),
    precio_unitario: toNumber(record.precio_unitario, undefined),
    descuento: toNumber(record.descuento, undefined),
    codigo_iva: toText(record.codigo_iva, undefined),
    porcentaje_iva: toNumber(record.porcentaje_iva, undefined),
    subtotal: toNumber(record.subtotal, undefined),
    iva: toNumber(record.valor_iva ?? record.iva, undefined),
    total: toNumber(record.total, undefined),
    created_at: toText(record.created_at, undefined),
  };
};

export const normalizeRecurrente = (data: unknown): RecurrenteItem => {
  const record = toRecord(data);
  const rawDetalles = Array.isArray(record.detalles) ? record.detalles : [];

  return {
    id: toNumber(record.id),
    id_empresa: toNumber(record.id_empresa),
    id_usuario: toNumber(record.id_usuario),
    id_punto_emision: toNumber(record.id_punto_emision),
    id_cliente: toNumber(record.id_cliente),
    descripcion: toText(record.descripcion),
    frecuencia: toFrecuencia(record.frecuencia),
    dia_emision: toNumber(record.dia_emision),
    proxima_facturacion: toText(record.proxima_facturacion),
    forma_pago: toText(record.forma_pago),
    estado: toText(record.estado, "ACTIVO"),
    ultima_facturacion: toText(record.ultima_facturacion, undefined),
    total_facturas_generadas: toNumber(record.total_facturas_generadas, undefined),
    cliente_nombre: toText(record.cliente_razon_social ?? record.cliente_nombre, undefined),
    cliente_identificacion: toText(record.cliente_identificacion, undefined),
    punto_emision_codigo: toText(record.punto_emision_codigo, undefined),
    total_detalles: toNumber(record.total_detalles, undefined),
    total_estimado: toNumber(record.total_estimado, undefined),
    created_at: toText(record.created_at, undefined),
    updated_at: toText(record.updated_at, undefined),
    detalles: rawDetalles.map(normalizeDetalle),
  };
};

export const normalizeRecurrentesResponse = (data: unknown): RecurrentesResponse => {
  const record = toRecord(data);
  const rawData = Array.isArray(record.data) ? record.data : [];
  return {
    success: record.success === true,
    data: rawData.map(normalizeRecurrente),
    message: toText(record.message, undefined),
  };
};

export const normalizeRecurrenteResponse = (data: unknown): RecurrenteResponse => {
  const record = toRecord(data);
  return {
    success: record.success === true,
    data: normalizeRecurrente(record.data),
    message: toText(record.message, undefined),
  };
};

export const toRecurrenteFormState = (recurrente: RecurrenteItem): RecurrenteFormState => {
  return {
    id_cliente: recurrente.id_cliente,
    id_punto_emision: recurrente.id_punto_emision,
    descripcion: recurrente.descripcion,
    frecuencia: recurrente.frecuencia,
    dia_emision: recurrente.dia_emision,
    proxima_facturacion: recurrente.proxima_facturacion,
    forma_pago: recurrente.forma_pago,
    detalles: (recurrente.detalles || []).map((d) => ({
      id: d.id,
      id_producto: d.id_producto ?? undefined,
      codigo: d.codigo || "",
      descripcion: d.descripcion || "",
      cantidad: d.cantidad || 0,
      precio_unitario: d.precio_unitario || 0,
      descuento: d.descuento || 0,
      codigo_iva: d.codigo_iva || "2",
      porcentaje_iva: d.porcentaje_iva || 12,
    })),
  };
};
