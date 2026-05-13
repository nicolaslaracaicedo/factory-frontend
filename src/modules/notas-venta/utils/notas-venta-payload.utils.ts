import type {
  NotaVentaItem,
  NotaVentaListResponse,
  NotaVentaDetailResponse,
} from "@/src/modules/notas-venta/types/notas-venta.types";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toNotaVentaItem = (raw: unknown): NotaVentaItem => {
  const item = isPlainObject(raw) ? raw : {};

  return {
    id: typeof item.id === "number" ? item.id : 0,
    id_empresa: typeof item.id_empresa === "number" ? item.id_empresa : 0,
    id_usuario: typeof item.id_usuario === "number" ? item.id_usuario : 0,
    id_cliente: typeof item.id_cliente === "number" ? item.id_cliente : null,
    id_punto_emision: typeof item.id_punto_emision === "number" ? item.id_punto_emision : 0,
    id_ambiente: typeof item.id_ambiente === "number" ? item.id_ambiente : 0,
    cod_establecimiento: String(item.cod_establecimiento ?? ""),
    cod_punto_emision: String(item.cod_punto_emision ?? ""),
    secuencial: String(item.secuencial ?? ""),
    numero_comprobante: String(item.numero_comprobante ?? ""),
    clave_acceso: String(item.clave_acceso ?? ""),
    numero_autorizacion: item.numero_autorizacion ? String(item.numero_autorizacion) : null,
    estado: (item.estado as NotaVentaItem["estado"]) ?? "BORRADOR",
    fecha_emision: String(item.fecha_emision ?? ""),
    fecha_autorizacion: item.fecha_autorizacion ? String(item.fecha_autorizacion) : null,
    cli_identificacion: String(item.cli_identificacion ?? ""),
    cli_razon_social: String(item.cli_razon_social ?? ""),
    cli_direccion: item.cli_direccion ? String(item.cli_direccion) : null,
    cli_telefono: item.cli_telefono ? String(item.cli_telefono) : null,
    cli_email: item.cli_email ? String(item.cli_email) : null,
    forma_pago: String(item.forma_pago ?? ""),
    subtotal_sin_impuesto: String(item.subtotal_sin_impuesto ?? "0"),
    descuento_total: String(item.descuento_total ?? "0"),
    total: String(item.total ?? "0"),
    observacion: String(item.observacion ?? ""),
    xml_generado: item.xml_generado ? String(item.xml_generado) : null,
    xml_autorizado: item.xml_autorizado ? String(item.xml_autorizado) : null,
    pdf_url: item.pdf_url ? String(item.pdf_url) : null,
    respuesta_sri: item.respuesta_sri ? String(item.respuesta_sri) : null,
    motivo_rechazo: item.motivo_rechazo ? String(item.motivo_rechazo) : null,
    created_at: String(item.created_at ?? ""),
    updated_at: String(item.updated_at ?? ""),
    ambiente_nombre: String(item.ambiente_nombre ?? ""),
    detalles: Array.isArray(item.detalles) ? item.detalles.map(toNotaVentaDetalle) : undefined,
  };
};

const toNotaVentaDetalle = (raw: unknown) => {
  const item = isPlainObject(raw) ? raw : {};

  return {
    id: typeof item.id === "number" ? item.id : 0,
    id_nota_venta: typeof item.id_nota_venta === "number" ? item.id_nota_venta : 0,
    id_empresa: typeof item.id_empresa === "number" ? item.id_empresa : 0,
    id_producto: typeof item.id_producto === "number" ? item.id_producto : null,
    codigo: String(item.codigo ?? ""),
    descripcion: String(item.descripcion ?? ""),
    unidad_medida: String(item.unidad_medida ?? ""),
    cantidad: String(item.cantidad ?? "0"),
    precio_unitario: String(item.precio_unitario ?? "0"),
    descuento: String(item.descuento ?? "0"),
    subtotal: String(item.subtotal ?? "0"),
    total: String(item.total ?? "0"),
    orden: typeof item.orden === "number" ? item.orden : 0,
  };
};

export const normalizeNotasVentaResponse = (payload: unknown): NotaVentaListResponse => {
  const obj = isPlainObject(payload) ? payload : {};
  const data = Array.isArray(obj.data) ? obj.data : [];

  return {
    success: Boolean(obj.success),
    data: data.map(toNotaVentaItem),
  };
};

export const normalizeNotaVentaResponse = (payload: unknown): NotaVentaDetailResponse => {
  const obj = isPlainObject(payload) ? payload : {};

  return {
    success: Boolean(obj.success),
    data: toNotaVentaItem(obj.data),
  };
};
