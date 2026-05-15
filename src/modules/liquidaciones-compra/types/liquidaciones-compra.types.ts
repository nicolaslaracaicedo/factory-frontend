export interface LiquidacionCompraDetalle {
  id?: number;
  id_liquidacion?: number;
  id_producto?: number | null;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  codigo_iva?: string;
  porcentaje_iva?: number;
  codigo_ice?: string;
  porcentaje_ice?: number;
  valor_unitario_irbpnr?: number;
  subtotal?: number;
  iva?: number;
  ice?: number;
  irbpnr?: number;
  total?: number;
  created_at?: string;
}

export interface LiquidacionCompraItem {
  id: number;
  id_empresa: number;
  id_usuario: number;
  id_punto_emision: number;
  id_proveedor: number;
  numero?: string;
  secuencial?: string;
  numero_comprobante?: string;
  clave_acceso?: string;
  fecha_emision: string;
  estado: string;
  numero_autorizacion?: string;
  fecha_autorizacion?: string;
  cod_establecimiento?: string;
  cod_punto_emision?: string;
  subtotal_sin_impuestos?: number;
  subtotal_12?: number;
  subtotal_0?: number;
  subtotal_no_objeto_iva?: number;
  subtotal_exento_iva?: number;
  total_descuento?: number;
  iva_12?: number;
  total_iva?: number;
  importe_total?: number;
  proveedor_nombre?: string;
  proveedor_identificacion?: string;
  total_detalles?: number;
  created_at?: string;
  updated_at?: string;
  detalles?: LiquidacionCompraDetalle[];
}

export interface LiquidacionCompraCreateInput {
  id_punto_emision: number;
  fecha_emision: string;
  id_proveedor: number;
  detalles: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    codigo_iva?: string;
    porcentaje_iva?: number;
    codigo_ice?: string;
    porcentaje_ice?: number;
    valor_unitario_irbpnr?: number;
  }>;
}

export interface LiquidacionCompraUpdateInput {
  id_punto_emision?: number;
  fecha_emision?: string;
  id_proveedor?: number;
  detalles?: Array<{
    id?: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento?: number;
    codigo_iva?: string;
    porcentaje_iva?: number;
    codigo_ice?: string;
    porcentaje_ice?: number;
    valor_unitario_irbpnr?: number;
  }>;
}

export interface LiquidacionCompraFormState {
  id_punto_emision: number;
  fecha_emision: string;
  id_proveedor: number;
  detalles: Array<{
    id?: number;
    id_producto: number;
    codigo: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    descuento: string;
    tipo_descuento: "PORCENTAJE" | "VALOR";
    codigo_iva: string;
    porcentaje_iva: number;
  }>;
}

export interface LiquidacionesCompraResponse {
  success: boolean;
  data: LiquidacionCompraItem[];
  message?: string;
}

export interface LiquidacionCompraResponse {
  success: boolean;
  data: LiquidacionCompraItem;
  message?: string;
}
