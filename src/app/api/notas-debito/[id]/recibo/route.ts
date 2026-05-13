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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = request.cookies.get("factory_token")?.value;
  const { id } = await params;

  const backendResponse = await fetch(`${API_URL}/api/notas-debito/${id}/recibo`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: "No se pudo obtener el recibo de la nota de débito." },
      { status: backendResponse.status }
    );
  }

  const headers = new Headers(backendResponse.headers);

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}
