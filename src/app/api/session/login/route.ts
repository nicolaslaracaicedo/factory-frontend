import { NextRequest, NextResponse } from "next/server";
import type { LoginRequest } from "@/src/modules/auth/types/auth.types";
import { roleToSlug } from "@/src/modules/auth/utils/role.utils";
import {
  buildLoginResponse,
  toOptionalString,
  toRecord,
} from "@/src/modules/auth/utils/auth-payload.utils";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(request: NextRequest) {
  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return NextResponse.json({ message: "Body invalido." }, { status: 400 });
  }

  const backendResponse = await fetch(`${API_URL}/api/auth/login`, {
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

  if (!backendResponse.ok) {
    const payload = toRecord(backendPayload);
    return NextResponse.json(
      {
        message:
          toOptionalString(payload.message) ??
          "No se pudo iniciar sesion. Verifica tus credenciales.",
      },
      { status: backendResponse.status }
    );
  }

  let normalized;

  try {
    normalized = buildLoginResponse(backendPayload, body.ruc, body.cedula);
  } catch (error) {
    const payload = toRecord(backendPayload);
    return NextResponse.json(
      {
        message:
          toOptionalString(payload.message) ??
          (error instanceof Error
            ? error.message
            : "Respuesta de login invalida del backend."),
      },
      { status: 422 }
    );
  }

  if (!normalized.token) {
    return NextResponse.json(
      { message: "La API no devolvio un token valido." },
      { status: 401 }
    );
  }

  const response = NextResponse.json(normalized);
  const roleSlug = roleToSlug[normalized.user.role];

  response.cookies.set("factory_token", normalized.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  response.cookies.set("factory_role", roleSlug, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
