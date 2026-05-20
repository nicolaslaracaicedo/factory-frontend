import type {
  NotaCreditoCreateInput,
  NotaCreditoItem,
  NotaCreditoUpdateInput,
} from "@/src/modules/credit-notes/types/credit-note.types";
import {
  normalizeNotaCreditoResponse,
  normalizeNotasCreditoResponse,
} from "@/src/modules/credit-notes/utils/credit-note-payload.utils";

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

export const creditNoteService = {
  async listNotas(): Promise<NotaCreditoItem[]> {
    const response = await fetch("/api/notas-credito", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotasCreditoResponse(payload).data;
  },

  async getNota(id: number): Promise<NotaCreditoItem> {
    const response = await fetch(`/api/notas-credito/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaCreditoResponse(payload).data;
  },

  async createNota(input: NotaCreditoCreateInput): Promise<NotaCreditoItem> {
    const response = await fetch("/api/notas-credito", {
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

    return normalizeNotaCreditoResponse(payload).data;
  },

  async updateNota(id: number, input: NotaCreditoUpdateInput): Promise<NotaCreditoItem> {
    const response = await fetch(`/api/notas-credito/${id}`, {
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

    return normalizeNotaCreditoResponse(payload).data;
  },

  async deleteNota(id: number): Promise<void> {
    const response = await fetch(`/api/notas-credito/${id}`, {
      method: "DELETE",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<NotaCreditoItem> {
    const response = await fetch(`/api/notas-credito/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaCreditoResponse(payload).data;
  },

  async cambiarEstado(id: number, estado: string): Promise<NotaCreditoItem> {
    const response = await fetch(`/api/notas-credito/${id}/estado`, {
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

    return normalizeNotaCreditoResponse(payload).data;
  },

  async emitirNota(id: number, input?: NotaCreditoCreateInput): Promise<NotaCreditoItem> {
    const response = await fetch(`/api/notas-credito/${id}/emitir`, {
      method: "POST",
      headers: input
        ? {
            "Content-Type": "application/json",
          }
        : undefined,
      body: input ? JSON.stringify(input) : undefined,
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaCreditoResponse(payload).data;
  },
};
