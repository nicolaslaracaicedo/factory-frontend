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

export async function GET(request: NextRequest) {
  const token = request.cookies.get("factory_token")?.value;
  const query = request.nextUrl.searchParams.toString();
  const url = query ? `${API_URL}/api/guias-remision?${query}` : `${API_URL}/api/guias-remision`;

  const backendResponse = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(token, false),
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudieron obtener las guías de remisión.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get("factory_token")?.value;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Body invalido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/guias-remision`, {
    method: "POST",
    headers: getAuthHeaders(token, true),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudo crear la guía de remisión.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}
