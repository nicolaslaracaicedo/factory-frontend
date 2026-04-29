export interface PuntoEmision {
  id: number;
  id_establecimiento: number;
  codigo: string;
  descripcion: string;
  estado?: string;
}

export interface PuntosEmisionResponse {
  message?: string;
  data: PuntoEmision[];
}

export interface PuntoEmisionResponse {
  message?: string;
  data: PuntoEmision;
}

export type PuntoEmisionFormInput = {
  id_establecimiento: number;
  codigo: string;
  descripcion: string;
};

export type PuntoEmisionCreateInput = PuntoEmisionFormInput;

export type PuntoEmisionUpdateInput = Pick<PuntoEmisionFormInput, "descripcion">;
