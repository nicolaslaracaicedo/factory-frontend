export const USER_ROLES = ["Administrador", "Facturador", "Contador"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface LoginRequest {
  ruc: string;
  cedula: string;
  clave: string;
}

export interface RegisterRequest {
  ruc: string;
  identificacion: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  direccion: string;
  telefono: string;
}

export interface AuthUser {
  id?: string;
  ruc: string;
  identificacion: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  role: UserRole;
  email_verificado?: boolean;
  puntoEmisionDefault?: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyEmailRequest {
  ruc: string;
  cedula: string;
  codigo: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ReenviarVerificacionRequest {
  ruc: string;
  cedula: string;
}

export interface ReenviarVerificacionResponse {
  success: boolean;
  message: string;
}
