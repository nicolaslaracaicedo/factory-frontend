export interface Company {
  ruc?: string;
  identificacion?: string;
  logo?: string;
  razon_social: string;
  nombre_comercial: string;
  direccion_matriz: string;
  telefono?: string;
  email?: string;
  color_primario?: string;
  color_secundario?: string;
  color_acento?: string;
  fuente_principal?: string;
  contribuyente_especial: boolean;
  nro_contribuyente_esp?: string;
  obligado_contabilidad: boolean;
  agente_retencion: boolean;
  rimpe: boolean;
  regimen?: string;
  ambiente?: number;
}

export interface CompanyResponse {
  message?: string;
  data: Company;
}

export type CompanyFormInput = {
  ruc: string;
  identificacion: string;
  logo?: File | null;
  razon_social: string;
  nombre_comercial: string;
  direccion_matriz: string;
  telefono: string;
  email: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  fuente_principal: string;
  contribuyente_especial: boolean;
  nro_contribuyente_esp: string;
  obligado_contabilidad: boolean;
  agente_retencion: boolean;
  rimpe: boolean;
  regimen: string;
  ambiente: number;
};
