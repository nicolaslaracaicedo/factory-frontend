export interface FacturaItem {
  id: number;
  numero?: string;
  numero_comprobante?: string;
  estado?: string;
  id_punto_emision?: number;
  id_cliente?: number;
  cliente_nombre?: string;
  cliente_identificacion?: string;
  fecha_emision?: string;
  fecha_autorizacion?: string;
  forma_pago?: string;
  tipo_pago?: string;
  dias_plazo?: number;
  observacion?: string;
  subtotal?: number;
  total?: number;
  clave_acceso?: string;
  numero_autorizacion?: string;
  xml_generado?: string;
  pdf_url?: string | null;
  detalles?: FacturaDetalle[];
  datos_adicionales?: FacturaDatoAdicional[];
}

export interface FacturaDetalle {
  id_producto?: number;
  codigo?: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario?: number;
  descuento?: number;
  codigo_iva?: string;
  porcentaje_iva?: number;
  unidad_medida?: string;
  valor_ice?: number;
  valor_irbpnr?: number;
}

export interface FacturaDatoAdicional {
  nombre: string;
  valor: string;
}

export interface FacturasResponse {
  message?: string;
  data: FacturaItem[];
}

export interface FacturaResponse {
  message?: string;
  data: FacturaItem;
}

export interface FacturaDetalleDraft {
  mode: "CATALOGO" | "MANUAL";
  id_producto: number;
  cantidad: number;
  descuento: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  codigo_iva: string;
  porcentaje_iva: number;
  unidad_medida: string;
  valor_ice: number;
  valor_irbpnr: number;
}

export interface FacturaDatoAdicionalDraft {
  nombre: string;
  valor: string;
}

export interface FacturaFormState {
  id_punto_emision: number;
  id_cliente: number;
  use_manual_cliente: boolean;
  cli_identificacion: string;
  cli_razon_social: string;
  cli_direccion: string;
  cli_telefono: string;
  cli_email: string;
  fecha_emision: string;
  forma_pago: string;
  tipo_pago: string;
  dias_plazo: number;
  observacion: string;
  detalles: FacturaDetalleDraft[];
  datos_adicionales: FacturaDatoAdicionalDraft[];
}

export type FacturaCreateInput = {
  id_punto_emision: number;
  id_cliente?: number;
  cli_identificacion?: string;
  cli_razon_social?: string;
  cli_direccion?: string;
  cli_telefono?: string;
  cli_email?: string;
  fecha_emision: string;
  forma_pago: string;
  tipo_pago: string;
  dias_plazo: number;
  observacion: string;
  detalles: FacturaDetalle[];
  datos_adicionales: FacturaDatoAdicional[];
};

export type FacturaUpdateInput = Partial<FacturaCreateInput>;
