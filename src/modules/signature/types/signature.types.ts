export interface FirmaElectronica {
  id: number;
  nombre: string;
  archivo?: string;
  activo?: boolean;
  empresa_id?: number;
  fecha_registro?: string;
  fecha_expiracion?: string;
  estado_certificado?: string;
  certificado?: CertificadoFirma;
}

export interface CertificadoFirma {
  titular?: string;
  organizacion?: string;
  unidad?: string;
  pais?: string;
  valido_desde?: string;
  valido_hasta?: string;
  emisor?: string;
  serial?: string;
}

export interface FirmasResponse {
  message?: string;
  data: FirmaElectronica[];
}

export interface FirmaResponse {
  message?: string;
  data: FirmaElectronica;
}

export interface FirmaUploadInput {
  firma: File;
  password: string;
  nombre: string;
}
