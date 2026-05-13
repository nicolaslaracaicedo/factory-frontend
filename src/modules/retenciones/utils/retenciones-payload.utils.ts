import type {
  RetencionFormState,
  RetencionItem,
  RetencionDetalle,
  RetencionResponse,
  RetencionesResponse,
} from "@/src/modules/retenciones/types/retenciones.types";

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

const normalizeDetalle = (value: UnknownRecord): RetencionDetalle => ({
  id: toNumber(value.id, 0) || undefined,
  tipo: toText(value.tipo, ""),
  codigo: toText(value.codigo, ""),
  descripcion: toText(value.descripcion, ""),
  base_imponible: toNumber(value.base_imponible ?? value.base, 0),
  porcentaje: toNumber(value.porcentaje ?? value.porc, 0),
  valor_retenido: toNumber(value.valor_retenido ?? value.valor, 0) || undefined,
});

const normalizeRetencion = (value: UnknownRecord): RetencionItem => ({
  id: toNumber(value.id, 0),
  numero: toText(value.numero ?? value.numero_comprobante ?? value.secuencial, ""),
  numero_comprobante: toText(value.numero_comprobante, ""),
  estado: toText(value.estado ?? value.status, ""),
  id_punto_emision: toNumber(value.id_punto_emision ?? value.punto_emision_id, 0) || undefined,
  id_proveedor: toNumber(value.id_proveedor ?? value.proveedor_id, 0) || undefined,
  id_factura_ref: toNumber(value.id_factura_ref ?? value.factura_ref_id, 0) || undefined,
  proveedor_nombre: toText(value.prov_razon_social ?? value.proveedor_nombre ?? value.proveedor_razon_social, ""),
  proveedor_identificacion: toText(value.prov_identificacion ?? value.proveedor_identificacion, ""),
  fecha_emision: toText(value.fecha_emision ?? value.emision_fecha, ""),
  fecha_autorizacion: toText(value.fecha_autorizacion, ""),
  clave_acceso: toText(value.clave_acceso, ""),
  numero_autorizacion: toText(value.numero_autorizacion, ""),
  xml_generado: toText(value.xml_generado, ""),
  pdf_url: toText(value.pdf_url, "") || null,
  total_retenido: toNumber(value.total_retenido, undefined),
  comprobante_ref_numero: toText(value.comprobante_ref_numero, undefined),
  detalles: Array.isArray(value.detalles)
    ? value.detalles.map((item) => normalizeDetalle(toRecord(item)))
    : undefined,
});

export const normalizeRetencionesResponse = (
  payload: unknown
): RetencionesResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.retenciones ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeRetencion(toRecord(item))),
  };
};

export const normalizeRetencionResponse = (
  payload: unknown
): RetencionResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.retencion ?? raw;
  const retencion = normalizeRetencion(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: retencion,
  };
};

export const toRetencionFormState = (retencion: RetencionItem): RetencionFormState => ({
  id_punto_emision: retencion.id_punto_emision ?? 0,
  id_proveedor: retencion.id_proveedor ?? 0,
  id_factura_ref: retencion.id_factura_ref ?? 0,
  fecha_emision: retencion.fecha_emision ?? "",
  detalles: (retencion.detalles ?? []).map((item) => ({
    tipo: item.tipo ?? "",
    codigo: item.codigo ?? "",
    descripcion: item.descripcion ?? "",
    base_imponible: item.base_imponible ?? 0,
    porcentaje: item.porcentaje ?? 0,
  })),
});
