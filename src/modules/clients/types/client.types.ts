export interface Cliente {
  id: number;
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  es_recurrente: boolean;
  estado?: string;
}

export interface ClientesResponse {
  message?: string;
  data: Cliente[];
}

export interface ClienteResponse {
  message?: string;
  data: Cliente;
}

export type ClienteFormInput = {
  tipo_identificacion: string;
  identificacion: string;
  razon_social: string;
  direccion: string;
  telefono: string;
  email: string;
  es_recurrente: boolean;
};

export type ClienteCreateInput = ClienteFormInput;

export type ClienteUpdateInput = Pick<
  ClienteFormInput,
  "razon_social" | "direccion" | "telefono" | "email" | "es_recurrente"
>;
