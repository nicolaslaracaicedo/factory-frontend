export interface Company {
  id?: number;
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
  estado?: string;
  created_at?: string;
  updated_at?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_from_name?: string;
  smtp_secure?: boolean;
  smtp_configurado?: boolean;
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
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password?: string;
  smtp_from_name: string;
  smtp_secure: boolean;
};
