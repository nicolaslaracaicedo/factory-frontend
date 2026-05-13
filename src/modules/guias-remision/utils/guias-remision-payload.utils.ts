import type {
  GuiaFormState,
  GuiaRemisionItem,
  GuiaRemisionDetalle,
  GuiaRemisionResponse,
  GuiasRemisionResponse,
} from "@/src/modules/guias-remision/types/guias-remision.types";

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

export const normalizeDetalle = (data: unknown): GuiaRemisionDetalle => {
  const record = toRecord(data);
  return {
    id: toNumber(record.id, undefined),
    id_guia: toNumber(record.id_guia, undefined),
    id_producto: record.id_producto ? toNumber(record.id_producto) : undefined,
    codigo: toText(record.codigo, undefined),
    descripcion: toText(record.descripcion, undefined),
    cantidad: toNumber(record.cantidad, undefined),
    created_at: toText(record.created_at, undefined),
  };
};

export const normalizeGuia = (data: unknown): GuiaRemisionItem => {
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
    numero_comprobante: toText(record.numero_comprobante, undefined),
    clave_acceso: toText(record.clave_acceso, undefined),
    fecha_emision: toText(record.fecha_emision),
    fecha_ini_transporte: toText(record.fecha_ini_transporte),
    fecha_fin_transporte: toText(record.fecha_fin_transporte),
    ruc_transportista: toText(record.ruc_transportista),
    razon_social_transportista: toText(record.razon_social_transportista),
    placa: toText(record.placa),
    motivo_traslado: toText(record.motivo_traslado),
    ruta: toText(record.ruta),
    direccion_destino: toText(record.direccion_destino),
    estado: toText(record.estado, "BORRADOR"),
    numero_autorizacion: toText(record.numero_autorizacion, undefined),
    fecha_autorizacion: toText(record.fecha_autorizacion, undefined),
    cod_establecimiento: toText(record.cod_establecimiento, undefined),
    cod_punto_emision: toText(record.cod_punto_emision, undefined),
    cliente_nombre: toText(record.dest_razon_social ?? record.cliente_nombre, undefined),
    cliente_identificacion: toText(record.dest_identificacion ?? record.cliente_identificacion, undefined),
    total_productos: toNumber(record.total_productos, undefined),
    created_at: toText(record.created_at, undefined),
    updated_at: toText(record.updated_at, undefined),
    detalles: rawDetalles.map(normalizeDetalle),
  };
};

export const normalizeGuiasRemisionResponse = (data: unknown): GuiasRemisionResponse => {
  const record = toRecord(data);
  const rawData = Array.isArray(record.data) ? record.data : [];
  return {
    success: record.success === true,
    data: rawData.map(normalizeGuia),
    message: toText(record.message, undefined),
  };
};

export const normalizeGuiaRemisionResponse = (data: unknown): GuiaRemisionResponse => {
  const record = toRecord(data);
  return {
    success: record.success === true,
    data: normalizeGuia(record.data),
    message: toText(record.message, undefined),
  };
};

export const toGuiaFormState = (guia: GuiaRemisionItem): GuiaFormState => {
  return {
    id_punto_emision: guia.id_punto_emision,
    fecha_emision: guia.fecha_emision,
    ruc_transportista: guia.ruc_transportista,
    razon_social_transportista: guia.razon_social_transportista,
    placa: guia.placa,
    fecha_ini_transporte: guia.fecha_ini_transporte,
    fecha_fin_transporte: guia.fecha_fin_transporte,
    motivo_traslado: guia.motivo_traslado,
    ruta: guia.ruta,
    id_cliente: guia.id_cliente,
    direccion_destino: guia.direccion_destino,
    detalles: (guia.detalles || []).map((d) => ({
      id: d.id,
      id_producto: d.id_producto || 0,
      codigo: d.codigo || "",
      descripcion: d.descripcion || "",
      cantidad: d.cantidad || 0,
    })),
  };
};
