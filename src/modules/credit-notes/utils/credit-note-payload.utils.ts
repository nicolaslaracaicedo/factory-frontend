import type {
  NotaCreditoDetalle,
  NotaCreditoFormState,
  NotaCreditoItem,
  NotaCreditoResponse,
  NotasCreditoResponse,
} from "@/src/modules/credit-notes/types/credit-note.types";

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

const normalizeDetalle = (value: UnknownRecord): NotaCreditoDetalle => ({
  codigo: toText(value.codigo ?? value.cod_producto, ""),
  descripcion: toText(value.descripcion ?? value.detalle, ""),
  cantidad: toNumber(value.cantidad, 0),
  precio_unitario: toNumber(value.precio_unitario ?? value.precio, 0) || undefined,
  descuento: toNumber(value.descuento, 0) || undefined,
  codigo_iva: toText(value.codigo_iva ?? value.iva_codigo, ""),
  porcentaje_iva: toNumber(value.porcentaje_iva ?? value.iva_porcentaje, 0) || undefined,
});

const normalizeNota = (value: UnknownRecord): NotaCreditoItem => ({
  id: toNumber(value.id, 0),
  numero: toText(value.numero ?? value.numero_nota ?? value.secuencial, ""),
  estado: toText(value.estado ?? value.status, ""),
  id_punto_emision: toNumber(value.id_punto_emision ?? value.punto_emision_id, 0) || undefined,
  id_factura_ref: toNumber(value.id_factura_ref ?? value.factura_ref_id, 0) || undefined,
  factura_ref_numero: toText(value.factura_ref_numero ?? value.ref_numero, ""),
  factura_ref_fecha: toText(value.factura_ref_fecha ?? value.ref_fecha, ""),
  factura_ref_autorizacion: toText(
    value.factura_ref_autorizacion ?? value.ref_autorizacion,
    ""
  ),
  motivo: toText(value.motivo, ""),
  id_cliente: toNumber(value.id_cliente ?? value.cliente_id, 0) || undefined,
  cliente_identificacion: toText(
    value.cliente_identificacion ?? value.cli_identificacion,
    ""
  ),
  cliente_nombre: toText(value.cliente_nombre ?? value.cli_razon_social, ""),
  fecha_emision: toText(value.fecha_emision ?? value.emision_fecha, ""),
  detalles: Array.isArray(value.detalles)
    ? value.detalles.map((item) => normalizeDetalle(toRecord(item)))
    : undefined,
});

export const normalizeNotasCreditoResponse = (
  payload: unknown
): NotasCreditoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.notas ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeNota(toRecord(item))),
  };
};

export const normalizeNotaCreditoResponse = (
  payload: unknown
): NotaCreditoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.nota ?? raw;
  const nota = normalizeNota(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: nota,
  };
};

export const toNotaCreditoFormState = (nota: NotaCreditoItem): NotaCreditoFormState => ({
  id_punto_emision: nota.id_punto_emision ?? 0,
  ref_mode: nota.id_factura_ref ? "INTERNA" : "MANUAL",
  id_factura_ref: nota.id_factura_ref ?? 0,
  factura_ref_numero: nota.factura_ref_numero ?? "",
  factura_ref_fecha: nota.factura_ref_fecha ?? "",
  factura_ref_autorizacion: nota.factura_ref_autorizacion ?? "",
  motivo: nota.motivo ?? "",
  id_cliente: nota.id_cliente ?? 0,
  use_manual_cliente: Boolean(nota.cliente_identificacion || nota.cliente_nombre) && !nota.id_cliente,
  cli_identificacion: nota.cliente_identificacion ?? "",
  cli_razon_social: nota.cliente_nombre ?? "",
  fecha_emision: nota.fecha_emision ?? "",
  detalles: (nota.detalles ?? []).map((detalle) => ({
    codigo: detalle.codigo ?? "",
    descripcion: detalle.descripcion ?? "",
    cantidad: detalle.cantidad ?? 0,
    precio_unitario: detalle.precio_unitario ?? 0,
    descuento: detalle.descuento ?? 0,
    codigo_iva: detalle.codigo_iva ?? "",
    porcentaje_iva: detalle.porcentaje_iva ?? 0,
    codigo_ice: detalle.codigo_ice ?? "",
    porcentaje_ice: detalle.porcentaje_ice ?? 0,
    valor_unitario_irbpnr: detalle.valor_unitario_irbpnr ?? 0,
  })),
});
