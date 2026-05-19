import { NextResponse } from "next/server";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const backendResponse = await fetch(`${API_URL}/api/auth/solicitar-recuperacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await backendResponse.json().catch(() => ({}));

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: payload.message || payload.error || "No se pudo solicitar la recuperación de contraseña." 
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: payload.message || "Se ha enviado un código de recuperación al correo registrado. Válido por 15 minutos."
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error al procesar la solicitud." },
      { status: 400 }
    );
  }
}

