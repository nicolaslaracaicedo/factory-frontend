import type {
  Establecimiento,
  EstablecimientoCreateInput,
  EstablecimientoUpdateInput,
} from "@/src/modules/establishments/types/establishment.types";
import {
  normalizeEstablecimientoResponse,
  normalizeEstablecimientosResponse,
} from "@/src/modules/establishments/utils/establishment-payload.utils";

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

export const establishmentService = {
  async listEstablecimientos(estado?: string): Promise<Establecimiento[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/establecimientos${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeEstablecimientosResponse(payload).data;
  },

  async getEstablecimiento(id: number): Promise<Establecimiento> {
    const response = await fetch(`/api/establecimientos/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeEstablecimientoResponse(payload).data;
  },

  async createEstablecimiento(
    input: EstablecimientoCreateInput
  ): Promise<Establecimiento> {
    const response = await fetch("/api/establecimientos", {
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

    return normalizeEstablecimientoResponse(payload).data;
  },

  async updateEstablecimiento(
    id: number,
    input: EstablecimientoUpdateInput
  ): Promise<Establecimiento> {
    const response = await fetch(`/api/establecimientos/${id}`, {
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

    return normalizeEstablecimientoResponse(payload).data;
  },

  async toggleEstado(id: number): Promise<Establecimiento> {
    const response = await fetch(`/api/establecimientos/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeEstablecimientoResponse(payload).data;
  },
};
