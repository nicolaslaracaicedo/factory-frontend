import type {
  FirmaElectronica,
  FirmaUploadInput,
} from "@/src/modules/signature/types/signature.types";
import {
  buildFirmaFormData,
  normalizeFirmaResponse,
  normalizeFirmasResponse,
} from "@/src/modules/signature/utils/signature-payload.utils";

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

export const signatureService = {
  async listFirmas(): Promise<FirmaElectronica[]> {
    const response = await fetch("/api/firma", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmasResponse(payload).data;
  },

  async getFirma(id: number): Promise<FirmaElectronica> {
    const response = await fetch(`/api/firma/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmaResponse(payload).data;
  },

  async getFirmaActiva(empresaId: number): Promise<FirmaElectronica> {
    const response = await fetch(`/api/firma/empresa/${empresaId}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmaResponse(payload).data;
  },

  async uploadFirma(input: FirmaUploadInput): Promise<FirmaElectronica> {
    const response = await fetch("/api/firma", {
      method: "POST",
      body: buildFirmaFormData(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmaResponse(payload).data;
  },

  async replaceFirma(id: number, input: FirmaUploadInput): Promise<FirmaElectronica> {
    const response = await fetch(`/api/firma/${id}`, {
      method: "PUT",
      body: buildFirmaFormData(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmaResponse(payload).data;
  },

  async activateFirma(id: number): Promise<FirmaElectronica> {
    const response = await fetch(`/api/firma/${id}/activar`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFirmaResponse(payload).data;
  },
};
