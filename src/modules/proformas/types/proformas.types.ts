export interface ProformaDetalle {
  id?: number;
  id_proforma?: number;
  id_producto?: number | null;
  codigo?: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
  codigo_iva?: string;
  porcentaje_iva?: number;
  subtotal?: number;
  iva?: number;
  total?: number;
  created_at?: string;
}

export interface ProformaItem {
  id: number;
  id_empresa: number;
  id_usuario: number;
  id_punto_emision: number;
  id_cliente: number;
  numero?: string;
  secuencial?: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  estado: string;
  observaciones?: string;
  subtotal_sin_impuestos?: number;
  subtotal_12?: number;
  subtotal_0?: number;
  subtotal_no_objeto_iva?: number;
  subtotal_exento_iva?: number;
  total_descuento?: number;
  iva_12?: number;
  total_iva?: number;
  importe_total?: number;
  cliente_nombre?: string;
  cliente_identificacion?: string;
  total_detalles?: number;
  created_at?: string;
  updated_at?: string;
  detalles?: ProformaDetalle[];
}

export interface ProformaCreateInput {
  id_punto_emision: number;
  id_cliente: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  observaciones?: string;
  detalles: Array<{
    id_producto?: number;
    codigo?: string;
    descripcion?: string;
    cantidad: number;
    precio_unitario?: number;
    descuento?: number;
    codigo_iva?: string;
    porcentaje_iva?: number;
  }>;
}

export interface ProformaUpdateInput {
  id_punto_emision?: number;
  id_cliente?: number;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  observaciones?: string;
  detalles?: Array<{
    id?: number;
    id_producto?: number;
    codigo?: string;
    descripcion?: string;
    cantidad: number;
    precio_unitario?: number;
    descuento?: number;
    codigo_iva?: string;
    porcentaje_iva?: number;
  }>;
}

export interface ProformaConvertirInput {
  forma_pago: string;
  tipo_pago: string;
  fecha_emision?: string;
}

export interface ProformaFormState {
  id_punto_emision: number;
  id_cliente: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  observaciones: string;
  detalles: Array<{
    id?: number;
    id_producto?: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    codigo_iva: string;
    porcentaje_iva: number;
  }>;
}

export interface ProformasResponse {
  success: boolean;
  data: ProformaItem[];
  message?: string;
}

export interface ProformaResponse {
  success: boolean;
  data: ProformaItem;
  message?: string;
}
