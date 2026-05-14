export interface Establecimiento {
  id: number;
  id_empresa?: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  es_matriz: boolean;
  estado?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EstablecimientosResponse {
  message?: string;
  data: Establecimiento[];
}

export interface EstablecimientoResponse {
  message?: string;
  data: Establecimiento;
}

export type EstablecimientoFormInput = {
  codigo: string;
  nombre: string;
  direccion: string;
  es_matriz: boolean;
};

export type EstablecimientoCreateInput = EstablecimientoFormInput;

export type EstablecimientoUpdateInput = Pick<
  EstablecimientoFormInput,
  "nombre" | "direccion" | "es_matriz"
>;
