import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

const extractToken = (request: NextRequest): string | undefined => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return request.cookies.get("factory_token")?.value;
};

export async function GET(request: NextRequest) {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ message: "No autorizado." }, { status: 401 });
  }

  const backendResponse = await fetch(`${API_URL}/api/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudo obtener el dashboard.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}
