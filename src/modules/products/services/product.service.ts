import type {
  Producto,
  ProductoCreateInput,
  ProductoUpdateInput,
} from "@/src/modules/products/types/product.types";
import {
  normalizeProductoResponse,
  normalizeProductosResponse,
} from "@/src/modules/products/utils/product-payload.utils";

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

export const productService = {
  async listProductos(estado?: string): Promise<Producto[]> {
    const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
    const response = await fetch(`/api/productos${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProductosResponse(payload).data;
  },

  async getProducto(id: number): Promise<Producto> {
    const response = await fetch(`/api/productos/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProductoResponse(payload).data;
  },

  async createProducto(input: ProductoCreateInput): Promise<Producto> {
    const response = await fetch("/api/productos", {
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

    return normalizeProductoResponse(payload).data;
  },

  async updateProducto(id: number, input: ProductoUpdateInput): Promise<Producto> {
    const response = await fetch(`/api/productos/${id}`, {
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

    return normalizeProductoResponse(payload).data;
  },

  async toggleProductoActivo(id: number, estadoActual: string): Promise<Producto> {
    const nuevoEstado = estadoActual === "INACTIVO" ? "ACTIVO" : "INACTIVO";

    const response = await fetch(`/api/productos/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeProductoResponse(payload).data;
  },
};
