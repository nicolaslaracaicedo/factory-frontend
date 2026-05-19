import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Aquí puedes agregar la validación en base de datos si el RUC y Cédula existen.
    
    return NextResponse.json({
      success: true,
      message: "Se ha enviado un código de recuperación al correo registrado. Válido por 15 minutos."
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error al procesar la solicitud." },
      { status: 400 }
    );
  }
}
