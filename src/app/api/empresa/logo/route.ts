import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  if (!path.startsWith("/")) {
    return NextResponse.json({ message: "Ruta inválida." }, { status: 400 });
  }

  const url = `${API_URL}${path}`;
  const backendResponse = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    return NextResponse.json({ message: "No se pudo cargar el logo." }, { status: 502 });
  }

  const buffer = await backendResponse.arrayBuffer();
  const contentType = backendResponse.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    },
  });
}
