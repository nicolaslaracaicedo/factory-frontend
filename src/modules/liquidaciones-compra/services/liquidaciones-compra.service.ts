import type {
  LiquidacionCompraCreateInput,
  LiquidacionCompraItem,
  LiquidacionCompraUpdateInput,
} from "@/src/modules/liquidaciones-compra/types/liquidaciones-compra.types";
import {
  normalizeLiquidacionCompraResponse,
  normalizeLiquidacionesCompraResponse,
} from "@/src/modules/liquidaciones-compra/utils/liquidaciones-compra-payload.utils";

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

export const liquidacionesCompraService = {
  async listLiquidaciones(): Promise<LiquidacionCompraItem[]> {
    const response = await fetch("/api/liquidaciones-compra", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionesCompraResponse(payload).data;
  },

  async getLiquidacion(id: number): Promise<LiquidacionCompraItem> {
    const response = await fetch(`/api/liquidaciones-compra/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },

  async createLiquidacion(input: LiquidacionCompraCreateInput): Promise<LiquidacionCompraItem> {
    const response = await fetch("/api/liquidaciones-compra", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },

  async updateLiquidacion(id: number, input: LiquidacionCompraUpdateInput): Promise<LiquidacionCompraItem> {
    const response = await fetch(`/api/liquidaciones-compra/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },

  async deleteLiquidacion(id: number): Promise<void> {
    const response = await fetch(`/api/liquidaciones-compra/${id}`, {
      method: "DELETE",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<LiquidacionCompraItem> {
    const response = await fetch(`/api/liquidaciones-compra/${id}/estado`, {
      method: "PATCH",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },

  async cambiarEstado(id: number, estado: string): Promise<LiquidacionCompraItem> {
    const response = await fetch(`/api/liquidaciones-compra/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },

  async emitirLiquidacion(id: number): Promise<LiquidacionCompraItem> {
    const response = await fetch(`/api/liquidaciones-compra/${id}/emitir`, {
      method: "POST",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLiquidacionCompraResponse(payload).data;
  },
};
