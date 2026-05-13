import type {
  ProformaCreateInput,
  ProformaItem,
  ProformaUpdateInput,
  ProformaConvertirInput,
} from "@/src/modules/proformas/types/proformas.types";
import {
  normalizeProformaResponse,
  normalizeProformasResponse,
} from "@/src/modules/proformas/utils/proformas-payload.utils";

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

export const proformasService = {
  async listProformas(): Promise<ProformaItem[]> {
    const response = await fetch("/api/proformas", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformasResponse(payload).data;
  },

  async getProforma(id: number): Promise<ProformaItem> {
    const response = await fetch(`/api/proformas/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformaResponse(payload).data;
  },

  async createProforma(input: ProformaCreateInput): Promise<ProformaItem> {
    const response = await fetch("/api/proformas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformaResponse(payload).data;
  },

  async updateProforma(id: number, input: ProformaUpdateInput): Promise<ProformaItem> {
    const response = await fetch(`/api/proformas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformaResponse(payload).data;
  },

  async deleteProforma(id: number): Promise<void> {
    const response = await fetch(`/api/proformas/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<ProformaItem> {
    const response = await fetch(`/api/proformas/${id}/estado`, {
      method: "PATCH",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformaResponse(payload).data;
  },

  async convertirAFactura(id: number, input: ProformaConvertirInput): Promise<ProformaItem> {
    const response = await fetch(`/api/proformas/${id}/convertir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProformaResponse(payload).data;
  },
};
