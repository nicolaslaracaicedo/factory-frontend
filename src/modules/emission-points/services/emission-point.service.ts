import type {
  PuntoEmision,
  PuntoEmisionCreateInput,
  PuntoEmisionUpdateInput,
} from "@/src/modules/emission-points/types/emission-point.types";
import {
  normalizePuntoResponse,
  normalizePuntosResponse,
} from "@/src/modules/emission-points/utils/emission-point-payload.utils";

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

export const emissionPointService = {
  async listPuntos(estado?: string): Promise<PuntoEmision[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/puntos-emision${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizePuntosResponse(payload).data;
  },

  async listByEstablecimiento(id: number): Promise<PuntoEmision[]> {
    const response = await fetch(`/api/puntos-emision/establecimiento/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizePuntosResponse(payload).data;
  },

  async getPunto(id: number): Promise<PuntoEmision> {
    const response = await fetch(`/api/puntos-emision/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizePuntoResponse(payload).data;
  },

  async createPunto(input: PuntoEmisionCreateInput): Promise<PuntoEmision> {
    const response = await fetch("/api/puntos-emision", {
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

    return normalizePuntoResponse(payload).data;
  },

  async updatePunto(id: number, input: PuntoEmisionUpdateInput): Promise<PuntoEmision> {
    const response = await fetch(`/api/puntos-emision/${id}`, {
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

    return normalizePuntoResponse(payload).data;
  },

  async toggleEstado(id: number): Promise<PuntoEmision> {
    const response = await fetch(`/api/puntos-emision/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizePuntoResponse(payload).data;
  },
};
