import type {
  ProformaFormState,
  ProformaItem,
  ProformaDetalle,
  ProformaResponse,
  ProformasResponse,
} from "@/src/modules/proformas/types/proformas.types";

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

export const normalizeDetalle = (data: unknown): ProformaDetalle => {
  const record = toRecord(data);
  return {
    id: toNumber(record.id, undefined),
    id_proforma: toNumber(record.id_proforma, undefined),
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

export const normalizeProforma = (data: unknown): ProformaItem => {
  const record = toRecord(data);
  const rawDetalles = Array.isArray(record.detalles) ? record.detalles : [];

  return {
    id: toNumber(record.id),
    id_empresa: toNumber(record.id_empresa),
    id_usuario: toNumber(record.id_usuario),
    id_punto_emision: toNumber(record.id_punto_emision),
    id_cliente: toNumber(record.id_cliente),
    numero: toText(record.numero, undefined),
    secuencial: toText(record.secuencial, undefined),
    fecha_emision: toText(record.fecha_emision),
    fecha_vencimiento: toText(record.fecha_vencimiento, undefined),
    estado: toText(record.estado, "PENDIENTE"),
    observaciones: toText(record.observaciones, undefined),
    subtotal_sin_impuestos: toNumber(record.subtotal_sin_impuesto ?? record.subtotal_sin_impuestos, undefined),
    subtotal_12: toNumber(record.subtotal_iva ?? record.subtotal_12, undefined),
    subtotal_0: toNumber(record.subtotal_0, undefined),
    subtotal_no_objeto_iva: toNumber(record.subtotal_no_objeto_iva, undefined),
    subtotal_exento_iva: toNumber(record.subtotal_exento_iva, undefined),
    total_descuento: toNumber(record.descuento_total ?? record.total_descuento, undefined),
    iva_12: toNumber(record.iva_12, undefined),
    total_iva: toNumber(record.iva_total ?? record.total_iva, undefined),
    importe_total: toNumber(record.total ?? record.importe_total, undefined),
    cliente_nombre: toText(record.cli_razon_social ?? record.cliente_nombre, undefined),
    cliente_identificacion: toText(record.cli_identificacion ?? record.cliente_identificacion, undefined),
    total_detalles: toNumber(record.total_detalles, undefined),
    created_at: toText(record.created_at, undefined),
    updated_at: toText(record.updated_at, undefined),
    detalles: rawDetalles.map(normalizeDetalle),
  };
};

export const normalizeProformasResponse = (data: unknown): ProformasResponse => {
  const record = toRecord(data);
  const rawData = Array.isArray(record.data) ? record.data : [];
  return {
    success: record.success === true,
    data: rawData.map(normalizeProforma),
    message: toText(record.message, undefined),
  };
};

export const normalizeProformaResponse = (data: unknown): ProformaResponse => {
  const record = toRecord(data);
  return {
    success: record.success === true,
    data: normalizeProforma(record.data),
    message: toText(record.message, undefined),
  };
};

export const toProformaFormState = (proforma: ProformaItem): ProformaFormState => {
  return {
    id_punto_emision: proforma.id_punto_emision,
    id_cliente: proforma.id_cliente,
    fecha_emision: proforma.fecha_emision,
    fecha_vencimiento: proforma.fecha_vencimiento || "",
    observaciones: proforma.observaciones || "",
    detalles: (proforma.detalles || []).map((d) => ({
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
