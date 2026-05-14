export interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  id_grupo: number;
  id_iva: number;
  unidad_medida: string;
  precio: number;
  tiene_ice: boolean;
  porcentaje_ice?: number;
  codigo_ice?: string;
  tiene_irbpnr: boolean;
  valor_unitario_irbpnr?: number;
  estado?: string;
  // Campos enriquecidos del backend (detalle)
  grupo_nombre?: string;
  iva_nombre?: string;
  iva_codigo?: string;
  iva_porcentaje?: number;
  porcentaje_iva?: number;
  precio_final?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductosResponse {
  message?: string;
  data: Producto[];
}

export interface ProductoResponse {
  message?: string;
  data: Producto;
}

export type ProductoFormInput = {
  codigo: string;
  descripcion: string;
  tipo: string;
  id_grupo: number;
  id_iva: number;
  unidad_medida: string;
  precio: number;
  tiene_ice: boolean;
  porcentaje_ice: number;
  codigo_ice: string;
  tiene_irbpnr: boolean;
  valor_unitario_irbpnr: number;
};

export type ProductoCreateInput = ProductoFormInput;

// El backend no permite actualizar el campo codigo via PUT
export type ProductoUpdateInput = Omit<ProductoFormInput, "codigo">;
