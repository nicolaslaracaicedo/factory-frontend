import type {
  Company,
  CompanyFormInput,
} from "@/src/modules/company/types/company.types";
import {
  buildCompanyFormData,
  normalizeCompanyResponse,
} from "@/src/modules/company/utils/company-payload.utils";

class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

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

export const companyService = {
  async getCompany(): Promise<Company> {
    const response = await fetch("/api/empresa", {
      method: "GET",
      cache: "no-store",
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new ServiceError(getErrorMessage(payload), response.status);
    }

    return normalizeCompanyResponse(payload).data;
  },

  async updateCompany(input: CompanyFormInput): Promise<Company> {
    const response = await fetch("/api/empresa", {
      method: "PATCH",
      body: buildCompanyFormData(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }

    return normalizeCompanyResponse(payload).data;
  },

  async sendTestEmail(input: CompanyFormInput): Promise<void> {
    const response = await fetch("/api/empresa/test-email", {
      method: "POST",
      body: buildCompanyFormData(input),
    });

    const payload = await readJson(response);
    if (!response.ok) {
      throw new Error(getErrorMessage(payload));
    }
  },
};
