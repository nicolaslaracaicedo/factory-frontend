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

  const backendResponse = await fetch(`${API_URL}/api/notas-venta/${id}/pdf`, {
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
          "No se pudo generar el PDF."
        : "No se pudo generar el PDF.";
    return NextResponse.json({ message }, { status: backendResponse.status });
  }

  // Stream the PDF buffer back to the client
  const pdfBuffer = await backendResponse.arrayBuffer();
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `inline; filename="nota-venta-${id}.pdf"`
  );

  return new NextResponse(pdfBuffer, { headers });
}
