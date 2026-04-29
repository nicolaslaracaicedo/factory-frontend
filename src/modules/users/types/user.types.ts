export interface UsuarioItem {
  id: number;
  id_rol: number;
  tipo_identificacion: string;
  identificacion?: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  estado?: string;
}

export interface UsuariosResponse {
  message?: string;
  data: UsuarioItem[];
}

export interface UsuarioResponse {
  message?: string;
  data: UsuarioItem;
}

export interface UsuarioFormInput {
  id_rol: number;
  tipo_identificacion: string;
  identificacion: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono: string;
  direccion: string;
}

export type UsuarioCreateInput = UsuarioFormInput;

export type UsuarioUpdateInput = Partial<
  Omit<UsuarioFormInput, "identificacion"> & { identificacion?: string }
>;
