import type {
  FacturaCreateInput,
  FacturaItem,
  FacturaUpdateInput,
} from "@/src/modules/invoices/types/invoice.types";
import {
  normalizeFacturaResponse,
  normalizeFacturasResponse,
} from "@/src/modules/invoices/utils/invoice-payload.utils";

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

export const invoiceService = {
  async listFacturas(search?: string): Promise<FacturaItem[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const response = await fetch(`/api/facturas${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFacturasResponse(payload).data;
  },

  async getFactura(id: number): Promise<FacturaItem> {
    const response = await fetch(`/api/facturas/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFacturaResponse(payload).data;
  },

  async createFactura(input: FacturaCreateInput): Promise<FacturaItem> {
    const response = await fetch("/api/facturas", {
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

    return normalizeFacturaResponse(payload).data;
  },

  async updateFactura(id: number, input: FacturaUpdateInput): Promise<FacturaItem> {
    const response = await fetch(`/api/facturas/${id}`, {
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

    return normalizeFacturaResponse(payload).data;
  },

  async deleteFactura(id: number): Promise<void> {
    const response = await fetch(`/api/facturas/${id}`, {
      method: "DELETE",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },

  async toggleEstado(id: number): Promise<FacturaItem> {
    const response = await fetch(`/api/facturas/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFacturaResponse(payload).data;
  },

  async emitirFactura(id: number): Promise<FacturaItem> {
    const response = await fetch(`/api/facturas/${id}/emitir`, {
      method: "POST",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeFacturaResponse(payload).data;
  },
};
