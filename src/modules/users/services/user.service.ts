import type {
  UsuarioCreateInput,
  UsuarioItem,
  UsuarioUpdateInput,
} from "@/src/modules/users/types/user.types";
import {
  normalizeUsuarioResponse,
  normalizeUsuariosResponse,
} from "@/src/modules/users/utils/user-payload.utils";

const readJson = async (response: Response): Promise<unknown> => {
  return response.json().catch(() => ({}));
};

const getErrorMessage = (payload: unknown): string => {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }
  return "No se pudo completar la operacion.";
};

export const userService = {
  async listUsuarios(): Promise<UsuarioItem[]> {
    const response = await fetch("/api/usuarios", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeUsuariosResponse(payload).data;
  },

  async getUsuario(id: number): Promise<UsuarioItem> {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeUsuarioResponse(payload).data;
  },

  async createUsuario(input: UsuarioCreateInput): Promise<UsuarioItem> {
    const response = await fetch("/api/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeUsuarioResponse(payload).data;
  },

  async updateUsuario(id: number, input: UsuarioUpdateInput): Promise<UsuarioItem> {
    const response = await fetch(`/api/usuarios/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeUsuarioResponse(payload).data;
  },

  async toggleEstado(id: number, estado: string): Promise<UsuarioItem> {
    const response = await fetch(`/api/usuarios/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado }),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeUsuarioResponse(payload).data;
  },
};
