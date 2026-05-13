import type {
  SriLogFilters,
  SriLogItem,
  SriLogDetalle,
  SriLogsResponse,
  SriLogResponse,
} from "@/src/modules/sri-logs/types/sri-logs.types";

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

const normalizeLog = (data: unknown): SriLogItem => {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    id: Number(record.id) || 0,
    id_empresa: Number(record.id_empresa) || 0,
    id_documento: Number(record.id_documento) || 0,
    tipo_documento: String(record.tipo_documento || "01") as SriLogItem["tipo_documento"],
    clave_acceso: record.clave_acceso ? String(record.clave_acceso) : undefined,
    accion: String(record.accion || ""),
    ambiente: record.ambiente ? String(record.ambiente) : undefined,
    estado: record.estado ? String(record.estado) : undefined,
    request_xml: record.request_xml ? String(record.request_xml) : null,
    response_xml: record.response_xml ? String(record.response_xml) : null,
    mensaje: record.mensaje ? String(record.mensaje) : null,
    created_at: record.created_at ? String(record.created_at) : undefined,
    updated_at: record.updated_at ? String(record.updated_at) : undefined,
  };
};

const normalizeLogsResponse = (data: unknown): SriLogsResponse => {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const rawData = Array.isArray(record.data) ? record.data : [];
  return {
    success: record.success === true,
    data: rawData.map(normalizeLog),
    total: record.total ? Number(record.total) : undefined,
    message: record.message ? String(record.message) : undefined,
  };
};

const normalizeLogResponse = (data: unknown): SriLogResponse => {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    success: record.success === true,
    data: normalizeLog(record.data) as SriLogDetalle,
    message: record.message ? String(record.message) : undefined,
  };
};

export const sriLogsService = {
  async listLogs(filters?: SriLogFilters): Promise<SriLogsResponse> {
    const params = new URLSearchParams();
    if (filters?.tipo_documento) params.append("tipo_documento", filters.tipo_documento);
    if (filters?.id_documento) params.append("id_documento", String(filters.id_documento));
    if (filters?.accion) params.append("accion", filters.accion);
    if (filters?.fecha_desde) params.append("fecha_desde", filters.fecha_desde);
    if (filters?.fecha_hasta) params.append("fecha_hasta", filters.fecha_hasta);
    if (filters?.limit) params.append("limit", String(filters.limit));
    if (filters?.offset) params.append("offset", String(filters.offset));

    const query = params.toString();
    const url = query ? `/api/log-sri?${query}` : "/api/log-sri";

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLogsResponse(payload);
  },

  async getLog(id: number): Promise<SriLogDetalle> {
    const response = await fetch(`/api/log-sri/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeLogResponse(payload).data;
  },
};
