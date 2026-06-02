import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ReenviarVerificacionRequest,
  ReenviarVerificacionResponse,
} from "@/src/modules/auth/types/auth.types";
import { buildLoginResponse, toOptionalString, toRecord } from "@/src/modules/auth/utils/auth-payload.utils";

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const payload: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const record = toRecord(payload);
      throw new Error(
        toOptionalString(record.message) ?? "No se pudo iniciar sesion."
      );
    }

    const normalized = buildLoginResponse(payload, data.ruc, data.cedula);

    return normalized;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await fetch("/api/session/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const payload: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      const record = toRecord(payload);
      throw new Error(
        toOptionalString(record.message) ?? "No se pudo registrar el usuario."
      );
    }

    const message =
      toOptionalString(toRecord(payload).message) ??
      "Registro realizado correctamente.";

    return {
      message,
    };
  },

  async logout(): Promise<void> {
    await fetch("/api/session/logout", {
      method: "POST",
    });
  },

  async solicitarRecuperacion(data: { ruc: string; cedula: string }): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/auth/solicitar-recuperacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "No se pudo solicitar la recuperación.");
    }
    return payload;
  },

  async restablecerContrasena(data: { ruc: string; cedula: string; codigo: string; nuevaContrasena: string; confirmarContrasena: string }): Promise<{ success: boolean; message: string }> {
    const response = await fetch("/api/auth/restablecer-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "No se pudo restablecer la contraseña.");
    }
    return payload;
  },

  async verificarEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await fetch("/api/auth/verificar-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "No se pudo verificar el correo.");
    }
    return payload;
  },

  async reenviarVerificacion(data: ReenviarVerificacionRequest): Promise<ReenviarVerificacionResponse> {
    const response = await fetch("/api/auth/reenviar-verificacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || "No se pudo reenviar el código.");
    }
    return payload;
  },
};
