import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
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
};
