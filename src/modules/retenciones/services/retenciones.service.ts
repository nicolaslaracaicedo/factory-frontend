import type {
  RetencionCreateInput,
  RetencionItem,
  RetencionUpdateInput,
} from "@/src/modules/retenciones/types/retenciones.types";
import {
  normalizeRetencionResponse,
  normalizeRetencionesResponse,
} from "@/src/modules/retenciones/utils/retenciones-payload.utils";

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

export const retencionesService = {
  async listRetenciones(): Promise<RetencionItem[]> {
    const response = await fetch("/api/retenciones", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRetencionesResponse(payload).data;
  },

  async getRetencion(id: number): Promise<RetencionItem> {
    const response = await fetch(`/api/retenciones/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRetencionResponse(payload).data;
  },

  async createRetencion(input: RetencionCreateInput): Promise<RetencionItem> {
    const response = await fetch("/api/retenciones", {
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

    return normalizeRetencionResponse(payload).data;
  },

  async updateRetencion(id: number, input: RetencionUpdateInput): Promise<RetencionItem> {
    const response = await fetch(`/api/retenciones/${id}`, {
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

    return normalizeRetencionResponse(payload).data;
  },

  async deleteRetencion(id: number): Promise<void> {
    const response = await fetch(`/api/retenciones/${id}`, {
      method: "DELETE",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<RetencionItem> {
    const response = await fetch(`/api/retenciones/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRetencionResponse(payload).data;
  },

  async emitirRetencion(id: number): Promise<RetencionItem> {
    const response = await fetch(`/api/retenciones/${id}/emitir`, {
      method: "POST",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRetencionResponse(payload).data;
  },
};
