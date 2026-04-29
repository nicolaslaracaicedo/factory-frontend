import type { AmbienteItem } from "@/src/modules/ambiente/types/ambiente.types";
import { normalizeAmbientesResponse } from "@/src/modules/ambiente/utils/ambiente-payload.utils";

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

export const ambienteService = {
  async listAmbientes(): Promise<AmbienteItem[]> {
    const response = await fetch("/api/ambiente", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeAmbientesResponse(payload).data;
  },
};
