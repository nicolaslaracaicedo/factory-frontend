import type {
  FacturaDatoAdicional,
  FacturaDetalle,
  FacturaFormState,
  FacturaItem,
  FacturaResponse,
  FacturasResponse,
} from "@/src/modules/invoices/types/invoice.types";

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

const normalizeDetalle = (value: UnknownRecord): FacturaDetalle => ({
  id_producto: toNumber(value.id_producto ?? value.producto_id, 0) || undefined,
  codigo: toText(value.codigo ?? value.cod_producto, ""),
  descripcion: toText(value.descripcion ?? value.detalle, ""),
  cantidad: toNumber(value.cantidad, 0),
  precio_unitario: toNumber(value.precio_unitario ?? value.precio, 0) || undefined,
  descuento: toNumber(value.descuento, 0) || undefined,
  codigo_iva: toText(value.codigo_iva ?? value.iva_codigo, ""),
  porcentaje_iva: toNumber(value.porcentaje_iva ?? value.iva_porcentaje, 0) || undefined,
  unidad_medida: toText(value.unidad_medida ?? value.unidad, ""),
  valor_ice: toNumber(value.valor_ice, 0) || undefined,
  valor_irbpnr: toNumber(value.valor_irbpnr, 0) || undefined,
});

const normalizeAdicional = (value: UnknownRecord): FacturaDatoAdicional => ({
  nombre: toText(value.nombre, ""),
  valor: toText(value.valor, ""),
});

const normalizeFactura = (value: UnknownRecord): FacturaItem => ({
  id: toNumber(value.id, 0),
  numero: toText(value.numero ?? value.numero_factura ?? value.secuencial, ""),
  numero_comprobante: toText(value.numero_comprobante, ""),
  estado: toText(value.estado ?? value.status, ""),
  id_punto_emision: toNumber(value.id_punto_emision ?? value.punto_emision_id, 0) || undefined,
  id_cliente: toNumber(value.id_cliente ?? value.cliente_id, 0) || undefined,
  cliente_nombre: toText(value.cliente_nombre ?? value.cli_razon_social ?? value.razon_social, ""),
  cliente_identificacion: toText(value.cliente_identificacion ?? value.cli_identificacion, ""),
  fecha_emision: toText(value.fecha_emision ?? value.emision_fecha, ""),
  fecha_autorizacion: toText(value.fecha_autorizacion, ""),
  forma_pago: toText(value.forma_pago ?? value.formaPago, ""),
  tipo_pago: toText(value.tipo_pago ?? value.tipoPago, ""),
  dias_plazo: toNumber(value.dias_plazo ?? value.plazo, 0) || undefined,
  observacion: toText(value.observacion ?? value.observaciones, ""),
  subtotal: toNumber(value.subtotal ?? value.sub_total, 0) || undefined,
  total: toNumber(value.total ?? value.total_pagar, 0) || undefined,
  clave_acceso: toText(value.clave_acceso ?? value.claveAcceso, ""),
  numero_autorizacion: toText(value.numero_autorizacion ?? value.numeroAutorizacion, ""),
  xml_generado: toText(value.xml_generado ?? value.xmlGenerado, ""),
  pdf_url: typeof value.pdf_url === "string" ? value.pdf_url : typeof value.pdfUrl === "string" ? value.pdfUrl : null,
  detalles: Array.isArray(value.detalles)
    ? value.detalles.map((item) => normalizeDetalle(toRecord(item)))
    : undefined,
  datos_adicionales: Array.isArray(value.datos_adicionales)
    ? value.datos_adicionales.map((item) => normalizeAdicional(toRecord(item)))
    : undefined,
});

export const normalizeFacturasResponse = (payload: unknown): FacturasResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.facturas ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeFactura(toRecord(item))),
  };
};

export const normalizeFacturaResponse = (payload: unknown): FacturaResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.factura ?? raw;
  const factura = normalizeFactura(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: factura,
  };
};

export const toFacturaFormState = (factura: FacturaItem): FacturaFormState => ({
  id_punto_emision: factura.id_punto_emision ?? 0,
  id_cliente: factura.id_cliente ?? 0,
  use_manual_cliente: false,
  cli_identificacion: factura.cliente_identificacion ?? "",
  cli_razon_social: factura.cliente_nombre ?? "",
  cli_direccion: "",
  cli_telefono: "",
  cli_email: "",
  fecha_emision: factura.fecha_emision ?? "",
  forma_pago: factura.forma_pago ?? "",
  tipo_pago: factura.tipo_pago ?? "",
  dias_plazo: factura.dias_plazo ?? 0,
  observacion: factura.observacion ?? "",
  detalles: (factura.detalles ?? []).map((detalle) => ({
    mode: detalle.id_producto ? "CATALOGO" : "MANUAL",
    id_producto: detalle.id_producto ?? 0,
    cantidad: detalle.cantidad ?? 0,
    descuento: detalle.descuento ?? 0,
    codigo: detalle.codigo ?? "",
    descripcion: detalle.descripcion ?? "",
    precio_unitario: detalle.precio_unitario ?? 0,
    codigo_iva: detalle.codigo_iva ?? "",
    porcentaje_iva: detalle.porcentaje_iva ?? 0,
    unidad_medida: detalle.unidad_medida ?? "",
    valor_ice: detalle.valor_ice ?? 0,
    valor_irbpnr: detalle.valor_irbpnr ?? 0,
  })),
  datos_adicionales: (factura.datos_adicionales ?? []).map((item) => ({
    nombre: item.nombre ?? "",
    valor: item.valor ?? "",
  })),
});
