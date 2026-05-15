import type {
  RecurrenteCreateInput,
  RecurrenteGenerarInput,
  RecurrenteItem,
  RecurrenteUpdateInput,
} from "@/src/modules/recurrentes/types/recurrentes.types";
import {
  normalizeRecurrenteResponse,
  normalizeRecurrentesResponse,
} from "@/src/modules/recurrentes/utils/recurrentes-payload.utils";

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

export const recurrentesService = {
  async listRecurrentes(estado?: string): Promise<RecurrenteItem[]> {
    const query = estado ? `?estado=${estado}` : "";
    const response = await fetch(`/api/recurrentes${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrentesResponse(payload).data;
  },

  async getRecurrente(id: number): Promise<RecurrenteItem> {
    const response = await fetch(`/api/recurrentes/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrenteResponse(payload).data;
  },

  async createRecurrente(input: RecurrenteCreateInput): Promise<RecurrenteItem> {
    const response = await fetch("/api/recurrentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrenteResponse(payload).data;
  },

  async updateRecurrente(id: number, input: RecurrenteUpdateInput): Promise<RecurrenteItem> {
    const response = await fetch(`/api/recurrentes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrenteResponse(payload).data;
  },

  async deleteRecurrente(id: number): Promise<void> {
    const response = await fetch(`/api/recurrentes/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<RecurrenteItem> {
    const response = await fetch(`/api/recurrentes/${id}/estado`, {
      method: "PATCH",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrenteResponse(payload).data;
  },

  async cambiarEstado(id: number, estado: string): Promise<RecurrenteItem> {
    const response = await fetch(`/api/recurrentes/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeRecurrenteResponse(payload).data;
  },

  async generarFactura(id: number, input: RecurrenteGenerarInput): Promise<unknown> {
    const response = await fetch(`/api/recurrentes/${id}/generar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return payload;
  },
};
