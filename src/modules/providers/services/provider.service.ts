import type {
  Proveedor,
  ProveedorCreateInput,
  ProveedorUpdateInput,
  TipoIdentificacion,
} from "@/src/modules/providers/types/provider.types";
import {
  normalizeProveedorResponse,
  normalizeProveedoresResponse,
  normalizeTiposIdentificacionResponse,
} from "@/src/modules/providers/utils/provider-payload.utils";

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

export const providerService = {
  async listTiposIdentificacion(): Promise<TipoIdentificacion[]> {
    const response = await fetch("/api/proveedores/tipos-identificacion", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeTiposIdentificacionResponse(payload).data;
  },

  async listProveedores(estado?: string): Promise<Proveedor[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/proveedores${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProveedoresResponse(payload).data;
  },

  async getProveedor(id: number): Promise<Proveedor> {
    const response = await fetch(`/api/proveedores/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProveedorResponse(payload).data;
  },

  async createProveedor(input: ProveedorCreateInput): Promise<Proveedor> {
    const response = await fetch("/api/proveedores", {
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

    return normalizeProveedorResponse(payload).data;
  },

  async updateProveedor(id: number, input: ProveedorUpdateInput): Promise<Proveedor> {
    const response = await fetch(`/api/proveedores/${id}`, {
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

    return normalizeProveedorResponse(payload).data;
  },

  async toggleProveedorEstado(id: number): Promise<Proveedor> {
    const response = await fetch(`/api/proveedores/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProveedorResponse(payload).data;
  },
};
