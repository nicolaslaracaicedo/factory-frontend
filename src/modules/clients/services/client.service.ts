import type {
  Cliente,
  ClienteCreateInput,
  ClienteUpdateInput,
} from "@/src/modules/clients/types/client.types";
import {
  normalizeClienteResponse,
  normalizeClientesResponse,
} from "@/src/modules/clients/utils/client-payload.utils";

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

export const clientService = {
  async listClientes(estado?: string, search?: string): Promise<Cliente[]> {
    const params = new URLSearchParams();
    if (estado && estado !== "TODOS") params.append("estado", estado);
    if (search) params.append("search", search);
    
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/clientes${query}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeClientesResponse(payload).data;
  },

  async getCliente(id: number): Promise<Cliente> {
    const response = await fetch(`/api/clientes/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeClienteResponse(payload).data;
  },

  async buscarPorIdentificacion(q: string): Promise<Cliente | null> {
    const response = await fetch(`/api/clientes/buscar?q=${encodeURIComponent(q)}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response) as any;
    if (!response.ok) {
      if (response.status === 404) return null; // Not found
      throw new Error(getErrorMessage(payload));
    }

    // El endpoint devuelve data: Cliente
    return payload.data ? normalizeClienteResponse(payload).data : null;
  },

  async createCliente(input: ClienteCreateInput): Promise<Cliente> {
    const response = await fetch("/api/clientes", {
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

    return normalizeClienteResponse(payload).data;
  },

  async updateCliente(id: number, input: ClienteUpdateInput): Promise<Cliente> {
    const response = await fetch(`/api/clientes/${id}`, {
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

    return normalizeClienteResponse(payload).data;
  },

  async toggleClienteEstado(id: number): Promise<Cliente> {
    const response = await fetch(`/api/clientes/${id}/estado`, {
      method: "PATCH",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeClienteResponse(payload).data;
  },
};
