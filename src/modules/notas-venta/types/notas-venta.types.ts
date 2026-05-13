export interface NotaVentaDetalle {
  id: number;
  id_nota_venta: number;
  id_empresa: number;
  id_producto: number | null;
  codigo: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: string;
  precio_unitario: string;
  descuento: string;
  subtotal: string;
  total: string;
  orden: number;
}

export interface NotaVentaItem {
  id: number;
  id_empresa: number;
  id_usuario: number;
  id_cliente: number | null;
  id_punto_emision: number;
  id_ambiente: number;
  cod_establecimiento: string;
  cod_punto_emision: string;
  secuencial: string;
  numero_comprobante: string;
  clave_acceso: string;
  numero_autorizacion: string | null;
  estado: "BORRADOR" | "AUTORIZADO" | "RECHAZADA" | "INACTIVO";
  fecha_emision: string;
  fecha_autorizacion: string | null;
  cli_identificacion: string;
  cli_razon_social: string;
  cli_direccion: string | null;
  cli_telefono: string | null;
  cli_email: string | null;
  forma_pago: string;
  subtotal_sin_impuesto: string;
  descuento_total: string;
  total: string;
  observacion: string;
  xml_generado: string | null;
  xml_autorizado: string | null;
  pdf_url: string | null;
  respuesta_sri: string | null;
  motivo_rechazo: string | null;
  created_at: string;
  updated_at: string;
  ambiente_nombre: string;
  detalles?: NotaVentaDetalle[];
}

export interface NotaVentaCreateInput {
  id_punto_emision: number;
  fecha_emision: string;
  forma_pago: string;
  observacion?: string;
  consumidor_final?: boolean;
  id_cliente?: number | null;
  cli_identificacion?: string;
  cli_razon_social?: string;
  cli_direccion?: string;
  cli_telefono?: string;
  cli_email?: string;
  detalles: {
    id_producto?: number | null;
    codigo: string;
    descripcion: string;
    unidad_medida: string;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
  }[];
}

export interface NotaVentaUpdateInput {
  id_punto_emision?: number;
  fecha_emision?: string;
  forma_pago?: string;
  observacion?: string;
  consumidor_final?: boolean;
  id_cliente?: number | null;
  cli_identificacion?: string;
  cli_razon_social?: string;
  cli_direccion?: string;
  cli_telefono?: string;
  cli_email?: string;
  detalles?: {
    id?: number | null;
    id_producto?: number | null;
    codigo: string;
    descripcion: string;
    unidad_medida: string;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
  }[];
}

export interface NotaVentaListResponse {
  success: boolean;
  data: NotaVentaItem[];
}

export interface NotaVentaDetailResponse {
  success: boolean;
  data: NotaVentaItem;
}
