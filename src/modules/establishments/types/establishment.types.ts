export interface Establecimiento {
  id: number;
  codigo: string;
  nombre: string;
  direccion?: string;
  es_matriz: boolean;
  estado?: string;
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
