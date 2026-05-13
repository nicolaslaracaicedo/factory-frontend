import type {
  NotaVentaCreateInput,
  NotaVentaItem,
  NotaVentaUpdateInput,
} from "@/src/modules/notas-venta/types/notas-venta.types";
import {
  normalizeNotaVentaResponse,
  normalizeNotasVentaResponse,
} from "@/src/modules/notas-venta/utils/notas-venta-payload.utils";

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

export const notasVentaService = {
  async listNotasVenta(): Promise<NotaVentaItem[]> {
    const response = await fetch("/api/notas-venta", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotasVentaResponse(payload).data;
  },

  async getNotaVenta(id: number): Promise<NotaVentaItem> {
    const response = await fetch(`/api/notas-venta/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaVentaResponse(payload).data;
  },

  async createNotaVenta(input: NotaVentaCreateInput): Promise<NotaVentaItem> {
    const response = await fetch("/api/notas-venta", {
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

    return normalizeNotaVentaResponse(payload).data;
  },

  async updateNotaVenta(id: number, input: NotaVentaUpdateInput): Promise<NotaVentaItem> {
    const response = await fetch(`/api/notas-venta/${id}`, {
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

    return normalizeNotaVentaResponse(payload).data;
  },

  async deleteNotaVenta(id: number): Promise<void> {
    const response = await fetch(`/api/notas-venta/${id}`, {
      method: "DELETE",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<NotaVentaItem> {
    const response = await fetch(`/api/notas-venta/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaVentaResponse(payload).data;
  },

  async emitirNotaVenta(id: number): Promise<NotaVentaItem> {
    const response = await fetch(`/api/notas-venta/${id}/emitir`, {
      method: "POST",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaVentaResponse(payload).data;
  },
};
