export type TipoDocumentoSRI = "01" | "03" | "04" | "05" | "06" | "07";

export interface SriLogItem {
  id: number;
  id_empresa: number;
  id_documento: number;
  tipo_documento: TipoDocumentoSRI;
  clave_acceso?: string;
  accion: string;
  ambiente?: string;
  estado?: string;
  request_xml?: string | null;
  response_xml?: string | null;
  mensaje?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SriLogDetalle extends SriLogItem {
  detalles?: Array<{
    id?: number;
    id_log_sri?: number;
    clave?: string;
    valor?: string;
    created_at?: string;
  }>;
}

export interface SriLogFilters {
  tipo_documento?: TipoDocumentoSRI;
  id_documento?: number;
  accion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

export interface SriLogsResponse {
  success: boolean;
  data: SriLogItem[];
  total?: number;
  message?: string;
}

export interface SriLogResponse {
  success: boolean;
  data: SriLogDetalle;
  message?: string;
}

export const tipoDocumentoLabels: Record<TipoDocumentoSRI, string> = {
  "01": "Factura",
  "03": "Liquidación de Compra",
  "04": "Nota de Crédito",
  "05": "Nota de Débito",
  "06": "Guía de Remisión",
  "07": "Retención",
};

export const accionesSRI = [
  "RECEPCION",
  "AUTORIZACION",
] as const;

export type AccionSRI = (typeof accionesSRI)[number];
