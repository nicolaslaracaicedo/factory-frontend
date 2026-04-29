export interface CodigoIva {
  id: number;
  codigo: string;
  nombre: string;
  porcentaje: number;
  activo?: boolean;
}

export interface CodigosIvaResponse {
  message?: string;
  data: CodigoIva[];
}

export interface CodigoIvaResponse {
  message?: string;
  data: CodigoIva;
}

export type CodigoIvaFormInput = {
  codigo: string;
  nombre: string;
  porcentaje: number;
};

export type CodigoIvaCreateInput = CodigoIvaFormInput;

export type CodigoIvaUpdateInput = CodigoIvaFormInput;
