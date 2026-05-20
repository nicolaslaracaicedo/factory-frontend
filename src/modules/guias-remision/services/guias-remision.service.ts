import type {
  GuiaCreateInput,
  GuiaRemisionItem,
  GuiaUpdateInput,
} from "@/src/modules/guias-remision/types/guias-remision.types";
import {
  normalizeGuiaRemisionResponse,
  normalizeGuiasRemisionResponse,
} from "@/src/modules/guias-remision/utils/guias-remision-payload.utils";

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

export const guiasRemisionService = {
  async listGuias(): Promise<GuiaRemisionItem[]> {
    const response = await fetch("/api/guias-remision", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiasRemisionResponse(payload).data;
  },

  async getGuia(id: number): Promise<GuiaRemisionItem> {
    const response = await fetch(`/api/guias-remision/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },

  async createGuia(input: GuiaCreateInput): Promise<GuiaRemisionItem> {
    const response = await fetch("/api/guias-remision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },

  async updateGuia(id: number, input: GuiaUpdateInput): Promise<GuiaRemisionItem> {
    const response = await fetch(`/api/guias-remision/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },

  async deleteGuia(id: number): Promise<void> {
    const response = await fetch(`/api/guias-remision/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<GuiaRemisionItem> {
    const response = await fetch(`/api/guias-remision/${id}/estado`, {
      method: "PATCH",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },

  async cambiarEstado(id: number, estado: string): Promise<GuiaRemisionItem> {
    const response = await fetch(`/api/guias-remision/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },

  async emitirGuia(id: number): Promise<GuiaRemisionItem> {
    const response = await fetch(`/api/guias-remision/${id}/emitir`, {
      method: "POST",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeGuiaRemisionResponse(payload).data;
  },
};
