import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const getAuthHeaders = (token: string | undefined, hasJsonBody = true): HeadersInit => {
  const headers: HeadersInit = {};

  if (hasJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const readPayload = async (response: Response): Promise<unknown> => {
  return response.json().catch(() => ({}));
};

const toMessage = (payload: unknown, fallback: string): string => {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  return fallback;
};

function extractToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return request.cookies.get("factory_token")?.value;
}

export async function GET(request: NextRequest) {
  const token = extractToken(request);

  const backendResponse = await fetch(`${API_URL}/api/empresa`, {
    method: "GET",
    headers: getAuthHeaders(token, false),
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudieron obtener los datos de empresa.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}

export async function PATCH(request: NextRequest) {
  const token = extractToken(request);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Formulario inválido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/empresa`, {
    method: "PATCH",
    headers: getAuthHeaders(token, false),
    body: formData,
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudo actualizar la empresa.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}
