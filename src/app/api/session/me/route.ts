import { NextRequest, NextResponse } from "next/server";
import { roleIdToName } from "@/src/modules/auth/utils/role.utils";

/**
 * GET /api/session/me
 *
 * Devuelve la info del usuario a partir de la cookie httpOnly `factory_token`.
 * Decodifica el payload del JWT (sin verificar firma — eso lo hace el backend
 * cuando se usa el token en peticiones reales). Esto permite que el cliente
 * recupere su sesión después de un reload sin necesitar un endpoint en el
 * backend.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get("factory_token")?.value;
  const roleSlug = request.cookies.get("factory_role")?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    // Decodificar el payload del JWT (parte central: header.PAYLOAD.signature)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Base64url → base64 → decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    const payload = JSON.parse(jsonPayload) as Record<string, unknown>;

    // Verificar que el token no haya expirado
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Reconstruir el usuario a partir del payload del JWT
    const rolId = typeof payload.rol === "number" ? payload.rol : null;
    const roleName = rolId !== null ? roleIdToName[rolId] ?? null : null;

    const user = {
      id: payload.usuarioId != null ? String(payload.usuarioId) : undefined,
      ruc: typeof payload.ruc === "string" ? payload.ruc : "",
      identificacion: typeof payload.cedula === "string" ? payload.cedula : "",
      role: roleName ?? "Administrador",
      // Estos campos no están en el JWT, pero el store los persiste en localStorage.
      // Si localStorage se borró, quedarán vacíos hasta el próximo login.
      nombre: undefined,
      apellido: undefined,
      email: undefined,
    };

    return NextResponse.json({ user, roleSlug });
  } catch {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
