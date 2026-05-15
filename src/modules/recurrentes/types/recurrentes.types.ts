export type FrecuenciaRecurrente = "DIARIA" | "SEMANAL" | "QUINCENAL" | "MENSUAL" | "ANUAL";

export interface RecurrenteDetalle {
  id?: number;
  id_recurrente?: number;
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

export interface RecurrenteItem {
  id: number;
  id_empresa: number;
  id_usuario: number;
  id_punto_emision: number;
  id_cliente: number;
  descripcion: string;
  frecuencia: FrecuenciaRecurrente;
  dia_emision: number;
  proxima_facturacion: string;
  forma_pago: string;
  estado: string;
  ultima_facturacion?: string;
  total_facturas_generadas?: number;
  cliente_nombre?: string;
  cliente_identificacion?: string;
  punto_emision_codigo?: string;
  total_detalles?: number;
  total_estimado?: number;
  created_at?: string;
  updated_at?: string;
  detalles?: RecurrenteDetalle[];
}

export interface RecurrenteCreateInput {
  id_cliente: number;
  id_punto_emision: number;
  descripcion: string;
  frecuencia: FrecuenciaRecurrente;
  dia_emision: number;
  proxima_facturacion: string;
  forma_pago: string;
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

export interface RecurrenteUpdateInput {
  id_cliente?: number;
  id_punto_emision?: number;
  descripcion?: string;
  frecuencia?: FrecuenciaRecurrente;
  dia_emision?: number;
  proxima_facturacion?: string;
  forma_pago?: string;
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

export interface RecurrenteGenerarInput {
  id_cliente: number;
  id_punto_emision: number;
  descripcion: string;
  frecuencia: FrecuenciaRecurrente;
  dia_emision: number;
  proxima_facturacion: string;
  forma_pago: string;
  tipo_pago?: string;
  dias_plazo?: number;
  detalles: Array<{
    id_producto: number;
    cantidad: number;
  }>;
}

export interface RecurrenteFormState {
  id_cliente: number;
  id_punto_emision: number;
  descripcion: string;
  frecuencia: FrecuenciaRecurrente;
  dia_emision: number;
  proxima_facturacion: string;
  forma_pago: string;
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

export interface RecurrentesResponse {
  success: boolean;
  data: RecurrenteItem[];
  message?: string;
}

export interface RecurrenteResponse {
  success: boolean;
  data: RecurrenteItem;
  message?: string;
}

export interface RecurrenteGenerarResponse {
  success: boolean;
  message?: string;
  factura?: unknown;
}
