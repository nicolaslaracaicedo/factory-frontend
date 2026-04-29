import type {
  SecuencialItem,
  SecuencialCreateInput,
  TipoDocumentoItem,
} from "@/src/modules/secuenciales/types/secuenciales.types";
import {
  normalizeSecuencialResponse,
  normalizeSecuencialesResponse,
  normalizeTiposDocumentoResponse,
} from "@/src/modules/secuenciales/utils/secuenciales-payload.utils";

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

export const secuencialesService = {
  async listSecuenciales(estado?: string): Promise<SecuencialItem[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/secuenciales${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeSecuencialesResponse(payload).data;
  },

  async listByPunto(id: number): Promise<SecuencialItem[]> {
    const response = await fetch(`/api/secuenciales/punto/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeSecuencialesResponse(payload).data;
  },

  async listTiposDocumento(): Promise<TipoDocumentoItem[]> {
    const response = await fetch("/api/secuenciales/tipos-documento", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeTiposDocumentoResponse(payload).data;
  },

  async getSecuencial(id: number): Promise<SecuencialItem> {
    const response = await fetch(`/api/secuenciales/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeSecuencialResponse(payload).data;
  },

  async createSecuencial(input: SecuencialCreateInput): Promise<SecuencialItem> {
    const response = await fetch("/api/secuenciales", {
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

    return normalizeSecuencialResponse(payload).data;
  },

  async toggleEstado(id: number): Promise<SecuencialItem> {
    const response = await fetch(`/api/secuenciales/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeSecuencialResponse(payload).data;
  },
};
