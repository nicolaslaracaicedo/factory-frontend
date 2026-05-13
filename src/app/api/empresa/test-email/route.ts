import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const getAuthHeaders = (token: string | undefined): HeadersInit => {
  const headers: HeadersInit = {};
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

export async function POST(request: NextRequest) {
  const token = request.cookies.get("factory_token")?.value;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "Formulario inválido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/empresa/test-email`, {
    method: "POST",
    headers: getAuthHeaders(token),
    body: formData,
    cache: "no-store",
  });

  const payload = await readPayload(backendResponse);
  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: toMessage(payload, "No se pudo enviar el correo de prueba.") },
      { status: backendResponse.status }
    );
  }

  return NextResponse.json(payload);
}
