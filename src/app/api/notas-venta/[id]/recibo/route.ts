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

  const backendResponse = await fetch(`${API_URL}/api/notas-venta/${id}/recibo`, {
    method: "GET",
    headers: getAuthHeaders(token),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const payload = await backendResponse.json().catch(() => ({}));
    const message =
      typeof payload === "object" && payload !== null
        ? (payload as Record<string, unknown>).message ||
          (payload as Record<string, unknown>).error ||
          "No se pudo generar el recibo."
        : "No se pudo generar el recibo.";
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  // Stream the receipt (PDF or HTML) back to the client
  const contentType = backendResponse.headers.get("content-type") || "application/pdf";
  const receiptBuffer = await backendResponse.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set(
    "Content-Disposition",
    `inline; filename="recibo-nota-venta-${id}.pdf"`
  );

  return new NextResponse(receiptBuffer, { headers });
}
