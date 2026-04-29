import type {
  CodigoIva,
  CodigoIvaCreateInput,
  CodigoIvaUpdateInput,
} from "@/src/modules/iva/types/iva.types";
import {
  normalizeCodigoIvaResponse,
  normalizeCodigosIvaResponse,
} from "@/src/modules/iva/utils/iva-payload.utils";

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

export const ivaService = {
  async listCodigos(activo?: boolean): Promise<CodigoIva[]> {
    const query = typeof activo === "boolean" ? `?activo=${activo}` : "";
    const response = await fetch(`/api/codigos-iva${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeCodigosIvaResponse(payload).data;
  },

  async getCodigo(id: number): Promise<CodigoIva> {
    const response = await fetch(`/api/codigos-iva/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeCodigoIvaResponse(payload).data;
  },

  async createCodigo(input: CodigoIvaCreateInput): Promise<CodigoIva> {
    const response = await fetch("/api/codigos-iva", {
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

    return normalizeCodigoIvaResponse(payload).data;
  },

  async updateCodigo(id: number, input: CodigoIvaUpdateInput): Promise<CodigoIva> {
    const response = await fetch(`/api/codigos-iva/${id}`, {
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

    return normalizeCodigoIvaResponse(payload).data;
  },

  async toggleActivo(id: number): Promise<CodigoIva> {
    const response = await fetch(`/api/codigos-iva/${id}/activo`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeCodigoIvaResponse(payload).data;
  },
};
