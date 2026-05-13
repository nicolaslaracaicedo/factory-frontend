export interface RetencionItem {
  id: number;
  numero?: string;
  numero_comprobante?: string;
  estado?: string;
  id_punto_emision?: number;
  id_proveedor?: number;
  id_factura_ref?: number;
  proveedor_nombre?: string;
  proveedor_identificacion?: string;
  fecha_emision?: string;
  fecha_autorizacion?: string;
  clave_acceso?: string;
  numero_autorizacion?: string;
  xml_generado?: string;
  pdf_url?: string | null;
  total_retenido?: number;
  comprobante_ref_numero?: string;
  detalles?: RetencionDetalle[];
}

export interface RetencionDetalle {
  id?: number;
  tipo: string;
  codigo: string;
  descripcion: string;
  base_imponible: number;
  porcentaje: number;
  valor_retenido?: number;
}

export interface RetencionesResponse {
  message?: string;
  data: RetencionItem[];
}

export interface RetencionResponse {
  message?: string;
  data: RetencionItem;
}

export interface RetencionDetalleDraft {
  tipo: string;
  codigo: string;
  descripcion: string;
  base_imponible: number;
  porcentaje: number;
}

export interface RetencionFormState {
  id_punto_emision: number;
  id_proveedor: number;
  id_factura_ref: number;
  fecha_emision: string;
  detalles: RetencionDetalleDraft[];
}

export type RetencionCreateInput = {
  id_punto_emision: number;
  id_proveedor: number;
  id_factura_ref: number;
  fecha_emision: string;
  detalles: RetencionDetalle[];
};

export type RetencionUpdateInput = Partial<RetencionCreateInput>;
