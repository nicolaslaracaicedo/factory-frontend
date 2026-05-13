export interface SecuencialItem {
  id: number;
  id_punto_emision: number;
  tipo_documento: string;
  ambiente: number;
  estado?: string;
  secuencial?: string;
  secuencial_actual?: string;
  ambiente_nombre?: string;
  punto_codigo?: string;
  est_codigo?: string;
  est_nombre?: string;
  updated_at?: string;
}

export interface SecuencialesResponse {
  message?: string;
  data: SecuencialItem[];
}

export interface SecuencialResponse {
  message?: string;
  data: SecuencialItem;
}

export interface TipoDocumentoItem {
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface TiposDocumentoResponse {
  message?: string;
  data: TipoDocumentoItem[];
}

export type SecuencialFormInput = {
  id_punto_emision: number;
  tipo_documento: string;
  ambiente: number;
};

export type SecuencialCreateInput = SecuencialFormInput;
