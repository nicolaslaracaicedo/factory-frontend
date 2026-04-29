export interface Proveedor {
  id: number;
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado?: string;
}

export interface ProveedoresResponse {
  message?: string;
  data: Proveedor[];
}

export interface ProveedorResponse {
  message?: string;
  data: Proveedor;
}

export interface TipoIdentificacion {
  codigo: string;
  nombre: string;
}

export interface TiposIdentificacionResponse {
  message?: string;
  data: TipoIdentificacion[];
}

export type ProveedorFormInput = {
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
};

export type ProveedorCreateInput = ProveedorFormInput;

export type ProveedorUpdateInput = Pick<
  ProveedorFormInput,
  "razon_social" | "direccion" | "telefono" | "email"
>;
