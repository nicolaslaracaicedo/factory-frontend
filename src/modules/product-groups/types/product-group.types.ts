export interface GrupoProducto {
  id: number;
  nombre: string;
  descripcion?: string;
  estado?: string;
}

export interface GruposProductoResponse {
  message?: string;
  data: GrupoProducto[];
}

export interface GrupoProductoResponse {
  message?: string;
  data: GrupoProducto;
}

export type GrupoProductoFormInput = {
  nombre: string;
  descripcion: string;
};

export type GrupoProductoCreateInput = GrupoProductoFormInput;

export type GrupoProductoUpdateInput = GrupoProductoFormInput;
