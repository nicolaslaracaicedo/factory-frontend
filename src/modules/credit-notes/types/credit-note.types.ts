export interface NotaCreditoItem {
  id: number;
  numero?: string;
  estado?: string;
  id_punto_emision?: number;
  id_factura_ref?: number;
  factura_ref_numero?: string;
  factura_ref_fecha?: string;
  factura_ref_autorizacion?: string;
  motivo?: string;
  id_cliente?: number;
  cliente_identificacion?: string;
  cliente_nombre?: string;
  fecha_emision?: string;
  detalles?: NotaCreditoDetalle[];
}

export interface NotaCreditoDetalle {
  codigo?: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
  codigo_iva?: string;
  porcentaje_iva?: number;
  codigo_ice?: string;
  porcentaje_ice?: number;
  valor_unitario_irbpnr?: number;
}

export interface NotasCreditoResponse {
  message?: string;
  data: NotaCreditoItem[];
}

export interface NotaCreditoResponse {
  message?: string;
  data: NotaCreditoItem;
}

export interface NotaCreditoDetalleDraft {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  tipo_descuento: "PORCENTAJE" | "VALOR";
  codigo_iva: string;
  porcentaje_iva: number;
  codigo_ice: string;
  porcentaje_ice: number;
  valor_unitario_irbpnr: number;
}

export interface NotaCreditoFormState {
  id_punto_emision: number;
  ref_mode: "INTERNA" | "MANUAL";
  id_factura_ref: number;
  factura_ref_numero: string;
  factura_ref_fecha: string;
  factura_ref_autorizacion: string;
  motivo: string;
  cliente_mode: "REGISTRADO" | "CONSUMIDOR_FINAL" | "MANUAL";
  id_cliente: number;
  use_manual_cliente: boolean;
  cli_identificacion: string;
  cli_razon_social: string;
  monto_recibido: number;
  fecha_emision: string;
  detalles: NotaCreditoDetalleDraft[];
}

export type NotaCreditoCreateInput = {
  id_punto_emision: number;
  id_factura_ref?: number;
  factura_ref_numero?: string;
  factura_ref_fecha?: string;
  factura_ref_autorizacion?: string;
  motivo: string;
  consumidor_final?: boolean;
  id_cliente?: number;
  cli_identificacion?: string;
  cli_razon_social?: string;
  fecha_emision: string;
  detalles: NotaCreditoDetalle[];
};

export type NotaCreditoUpdateInput = Partial<NotaCreditoCreateInput>;
