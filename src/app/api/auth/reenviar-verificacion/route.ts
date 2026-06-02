import { NextRequest, NextResponse } from "next/server";
import { toOptionalString, toRecord } from "@/src/modules/auth/utils/auth-payload.utils";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  let body: { ruc: string; cedula: string };

  try {
    body = (await request.json()) as { ruc: string; cedula: string };
  } catch {
    return NextResponse.json({ message: "Body invalido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/auth/reenviar-verificacion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const backendPayload: unknown = await backendResponse
    .json()
    .catch(() => ({} as Record<string, never>));

  const payload = toRecord(backendPayload);
  const message =
    toOptionalString(payload.message) ??
    (backendResponse.ok
      ? "Se ha reenviado un nuevo código de verificación al correo registrado."
      : "No se pudo reenviar el código.");

  const success = payload.success === true;

  if (!backendResponse.ok) {
    return NextResponse.json({ success: false, message }, { status: backendResponse.status });
  }

  return NextResponse.json({ success, message });
}
