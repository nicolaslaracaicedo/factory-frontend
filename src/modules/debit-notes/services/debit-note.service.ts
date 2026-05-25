import type {
  NotaDebitoCreateInput,
  NotaDebitoItem,
  NotaDebitoUpdateInput,
} from "@/src/modules/debit-notes/types/debit-note.types";
import {
  normalizeNotaDebitoResponse,
  normalizeNotasDebitoResponse,
} from "@/src/modules/debit-notes/utils/debit-note-payload.utils";

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

export const debitNoteService = {
  async listNotas(): Promise<NotaDebitoItem[]> {
    const response = await fetch("/api/notas-debito", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotasDebitoResponse(payload).data;
  },

  async getNota(id: number): Promise<NotaDebitoItem> {
    const response = await fetch(`/api/notas-debito/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaDebitoResponse(payload).data;
  },

  async createNota(input: NotaDebitoCreateInput): Promise<NotaDebitoItem> {
    const response = await fetch("/api/notas-debito", {
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

    return normalizeNotaDebitoResponse(payload).data;
  },

  async updateNota(id: number, input: NotaDebitoUpdateInput): Promise<NotaDebitoItem> {
    const response = await fetch(`/api/notas-debito/${id}`, {
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

    return normalizeNotaDebitoResponse(payload).data;
  },

  async deleteNota(id: number): Promise<void> {
    const response = await fetch(`/api/notas-debito/${id}`, {
      method: "DELETE",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<NotaDebitoItem> {
    const response = await fetch(`/api/notas-debito/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeNotaDebitoResponse(payload).data;
  },

  async cambiarEstado(id: number, estado: string): Promise<NotaDebitoItem> {
    const response = await fetch(`/api/notas-debito/${id}/estado`, {
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

    return normalizeNotaDebitoResponse(payload).data;
  },

  async emitirNota(id: number, input?: NotaDebitoCreateInput): Promise<NotaDebitoItem> {
    const response = await fetch(`/api/notas-debito/${id}/emitir`, {
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

    return normalizeNotaDebitoResponse(payload).data;
  },

  async enviarCorreo(id: number, correo_destino: string): Promise<void> {
    const response = await fetch(`/api/notas-debito/${id}/enviar-correo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo_destino }),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },
};
