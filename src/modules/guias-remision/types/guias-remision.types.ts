export interface GuiaRemisionDetalle {
  id?: number;
  id_guia?: number;
  id_producto?: number | null;
  codigo?: string;
  descripcion?: string;
  cantidad?: number;
  created_at?: string;
}

export interface GuiaRemisionItem {
  id: number;
  id_empresa: number;
  id_usuario: number;
  id_punto_emision: number;
  id_cliente: number;
  numero?: string;
  secuencial?: string;
  numero_comprobante?: string;
  clave_acceso?: string;
  fecha_emision: string;
  fecha_ini_transporte: string;
  fecha_fin_transporte: string;
  ruc_transportista: string;
  razon_social_transportista: string;
  placa: string;
  motivo_traslado: string;
  ruta: string;
  direccion_destino: string;
  estado: string;
  numero_autorizacion?: string;
  fecha_autorizacion?: string;
  cod_establecimiento?: string;
  cod_punto_emision?: string;
  cliente_nombre?: string;
  cliente_identificacion?: string;
  total_productos?: number;
  created_at?: string;
  updated_at?: string;
  detalles?: GuiaRemisionDetalle[];
}

export interface GuiaCreateInput {
  id_punto_emision: number;
  fecha_emision: string;
  ruc_transportista: string;
  razon_social_transportista: string;
  placa: string;
  fecha_ini_transporte: string;
  fecha_fin_transporte: string;
  motivo_traslado: string;
  ruta: string;
  id_cliente: number;
  direccion_destino: string;
  detalles: Array<{
    id_producto?: number;
    codigo?: string;
    descripcion?: string;
    cantidad?: number;
  }>;
}

export interface GuiaUpdateInput {
  id_punto_emision?: number;
  fecha_emision?: string;
  ruc_transportista?: string;
  razon_social_transportista?: string;
  placa?: string;
  fecha_ini_transporte?: string;
  fecha_fin_transporte?: string;
  motivo_traslado?: string;
  ruta?: string;
  id_cliente?: number;
  direccion_destino?: string;
  detalles?: Array<{
    id?: number;
    id_producto?: number;
    codigo?: string;
    descripcion?: string;
    cantidad?: number;
  }>;
}

export interface GuiaFormState {
  id_punto_emision: number;
  fecha_emision: string;
  ruc_transportista: string;
  razon_social_transportista: string;
  placa: string;
  fecha_ini_transporte: string;
  fecha_fin_transporte: string;
  motivo_traslado: string;
  ruta: string;
  id_cliente: number;
  direccion_destino: string;
  detalles: Array<{
    id?: number;
    id_producto: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
  }>;
}

export interface GuiasRemisionResponse {
  success: boolean;
  data: GuiaRemisionItem[];
  message?: string;
}

export interface GuiaRemisionResponse {
  success: boolean;
  data: GuiaRemisionItem;
  message?: string;
}
