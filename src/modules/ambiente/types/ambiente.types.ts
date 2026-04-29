export interface AmbienteItem {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

export interface AmbientesResponse {
  message?: string;
  data: AmbienteItem[];
}
