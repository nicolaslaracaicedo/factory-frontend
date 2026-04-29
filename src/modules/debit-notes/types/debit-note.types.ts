export interface NotaDebitoItem {
  id: number;
  numero?: string;
  estado?: string;
  id_punto_emision?: number;
  id_factura_ref?: number;
  motivo?: string;
  id_cliente?: number;
  cliente_identificacion?: string;
  cliente_nombre?: string;
  fecha_emision?: string;
  codigo_iva?: string;
  porcentaje_iva?: number;
  motivos?: NotaDebitoMotivo[];
}

export interface NotaDebitoMotivo {
  razon: string;
  valor: number;
}

export interface NotasDebitoResponse {
  message?: string;
  data: NotaDebitoItem[];
}

export interface NotaDebitoResponse {
  message?: string;
  data: NotaDebitoItem;
}

export interface NotaDebitoMotivoDraft {
  razon: string;
  valor: number;
}

export interface NotaDebitoFormState {
  id_punto_emision: number;
  id_factura_ref: number;
  motivo: string;
  id_cliente: number;
  use_manual_cliente: boolean;
  cli_identificacion: string;
  cli_razon_social: string;
  fecha_emision: string;
  codigo_iva: string;
  porcentaje_iva: number;
  motivos: NotaDebitoMotivoDraft[];
}

export type NotaDebitoCreateInput = {
  id_punto_emision: number;
  id_factura_ref: number;
  motivo: string;
  id_cliente?: number;
  cli_identificacion?: string;
  cli_razon_social?: string;
  fecha_emision: string;
  codigo_iva: string;
  porcentaje_iva: number;
  motivos: NotaDebitoMotivo[];
};

export type NotaDebitoUpdateInput = Partial<NotaDebitoCreateInput>;
