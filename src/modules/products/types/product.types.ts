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
  estado?: string;
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
};

export type ProductoCreateInput = Omit<ProductoFormInput, "porcentaje_ice">;

export type ProductoUpdateInput = ProductoFormInput;
