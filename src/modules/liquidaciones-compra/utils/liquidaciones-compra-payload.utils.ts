import type {
  LiquidacionCompraFormState,
  LiquidacionCompraItem,
  LiquidacionCompraDetalle,
  LiquidacionCompraResponse,
  LiquidacionesCompraResponse,
} from "@/src/modules/liquidaciones-compra/types/liquidaciones-compra.types";

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

export const normalizeDetalle = (data: unknown): LiquidacionCompraDetalle => {
  const record = toRecord(data);
  return {
    id: toNumber(record.id, undefined),
    id_liquidacion: toNumber(record.id_liquidacion, undefined),
    id_producto: record.id_producto ? toNumber(record.id_producto) : undefined,
    codigo: toText(record.codigo),
    descripcion: toText(record.descripcion),
    cantidad: toNumber(record.cantidad),
    precio_unitario: toNumber(record.precio_unitario),
    descuento: toNumber(record.descuento),
    codigo_iva: toText(record.codigo_iva, undefined),
    porcentaje_iva: toNumber(record.porcentaje_iva, undefined),
    subtotal: toNumber(record.subtotal, undefined),
    iva: toNumber(record.valor_iva ?? record.iva, undefined),
    total: toNumber(record.total, undefined),
    created_at: toText(record.created_at, undefined),
  };
};

export const normalizeLiquidacion = (data: unknown): LiquidacionCompraItem => {
  const record = toRecord(data);
  const rawDetalles = Array.isArray(record.detalles) ? record.detalles : [];

  return {
    id: toNumber(record.id),
    id_empresa: toNumber(record.id_empresa),
    id_usuario: toNumber(record.id_usuario),
    id_punto_emision: toNumber(record.id_punto_emision),
    id_proveedor: toNumber(record.id_proveedor),
    numero: toText(record.numero, undefined),
    secuencial: toText(record.secuencial, undefined),
    numero_comprobante: toText(record.numero_comprobante, undefined),
    clave_acceso: toText(record.clave_acceso, undefined),
    fecha_emision: toText(record.fecha_emision),
    estado: toText(record.estado, "BORRADOR"),
    numero_autorizacion: toText(record.numero_autorizacion, undefined),
    fecha_autorizacion: toText(record.fecha_autorizacion, undefined),
    cod_establecimiento: toText(record.cod_establecimiento, undefined),
    cod_punto_emision: toText(record.cod_punto_emision, undefined),
    subtotal_sin_impuestos: toNumber(record.subtotal_sin_impuesto ?? record.subtotal_sin_impuestos, undefined),
    subtotal_12: toNumber(record.subtotal_iva ?? record.subtotal_12, undefined),
    subtotal_0: toNumber(record.subtotal_0, undefined),
    subtotal_no_objeto_iva: toNumber(record.subtotal_no_objeto_iva, undefined),
    subtotal_exento_iva: toNumber(record.subtotal_exento_iva, undefined),
    total_descuento: toNumber(record.descuento_total ?? record.total_descuento, undefined),
    iva_12: toNumber(record.iva_12, undefined),
    total_iva: toNumber(record.iva_total ?? record.total_iva, undefined),
    importe_total: toNumber(record.total ?? record.importe_total, undefined),
    proveedor_nombre: toText(record.razon_social_prov ?? record.proveedor_nombre, undefined),
    proveedor_identificacion: toText(record.identificacion_prov ?? record.proveedor_identificacion, undefined),
    total_detalles: toNumber(record.total_detalles, undefined),
    created_at: toText(record.created_at, undefined),
    updated_at: toText(record.updated_at, undefined),
    detalles: rawDetalles.map(normalizeDetalle),
  };
};

export const normalizeLiquidacionesCompraResponse = (data: unknown): LiquidacionesCompraResponse => {
  const record = toRecord(data);
  const rawData = Array.isArray(record.data) ? record.data : [];
  return {
    success: record.success === true,
    data: rawData.map(normalizeLiquidacion),
    message: toText(record.message, undefined),
  };
};

export const normalizeLiquidacionCompraResponse = (data: unknown): LiquidacionCompraResponse => {
  const record = toRecord(data);
  return {
    success: record.success === true,
    data: normalizeLiquidacion(record.data),
    message: toText(record.message, undefined),
  };
};

export const toLiquidacionFormState = (liquidacion: LiquidacionCompraItem): LiquidacionCompraFormState => {
  return {
    id_punto_emision: liquidacion.id_punto_emision,
    fecha_emision: liquidacion.fecha_emision,
    id_proveedor: liquidacion.id_proveedor,
    detalles: (liquidacion.detalles || []).map((d) => ({
      id: d.id,
      codigo: d.codigo || "",
      descripcion: d.descripcion || "",
      cantidad: d.cantidad || 0,
      precio_unitario: d.precio_unitario || 0,
      descuento: d.descuento || 0,
      codigo_iva: d.codigo_iva || "4",
      porcentaje_iva: d.porcentaje_iva || 15,
    })),
  };
};
