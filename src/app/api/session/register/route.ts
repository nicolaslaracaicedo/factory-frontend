import { NextRequest, NextResponse } from "next/server";
import type { RegisterRequest } from "@/src/modules/auth/types/auth.types";
import { toOptionalString, toRecord } from "@/src/modules/auth/utils/auth-payload.utils";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  let body: RegisterRequest;

  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return NextResponse.json({ message: "Body invalido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const backendPayload: unknown = await backendResponse
    .json()
    .catch(() => ({} as Record<string, never>));

  const payload = toRecord(backendPayload);
  const message =
    toOptionalString(payload.message) ??
    toOptionalString(payload.error) ??
    (backendResponse.ok
      ? "Registro realizado correctamente."
      : "No se pudo registrar el usuario.");

  if (!backendResponse.ok) {
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  return NextResponse.json({ message });
}
