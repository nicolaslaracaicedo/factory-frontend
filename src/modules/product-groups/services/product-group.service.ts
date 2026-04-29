import type {
  GrupoProducto,
  GrupoProductoCreateInput,
  GrupoProductoUpdateInput,
} from "@/src/modules/product-groups/types/product-group.types";
import {
  normalizeGrupoResponse,
  normalizeGruposResponse,
} from "@/src/modules/product-groups/utils/product-group-payload.utils";

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

export const productGroupService = {
  async listGrupos(estado?: string): Promise<GrupoProducto[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/grupos-productos${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGruposResponse(payload).data;
  },

  async getGrupo(id: number): Promise<GrupoProducto> {
    const response = await fetch(`/api/grupos-productos/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGrupoResponse(payload).data;
  },

  async createGrupo(input: GrupoProductoCreateInput): Promise<GrupoProducto> {
    const response = await fetch("/api/grupos-productos", {
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

    return normalizeGrupoResponse(payload).data;
  },

  async updateGrupo(id: number, input: GrupoProductoUpdateInput): Promise<GrupoProducto> {
    const response = await fetch(`/api/grupos-productos/${id}`, {
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

    return normalizeGrupoResponse(payload).data;
  },

  async toggleGrupoEstado(id: number): Promise<GrupoProducto> {
    const response = await fetch(`/api/grupos-productos/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGrupoResponse(payload).data;
  },
};
