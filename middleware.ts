import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isRoleSlug } from "@/src/modules/auth/utils/role.utils";

const AUTH_ROUTES = ["/auth", "/auth/login", "/auth/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("factory_token")?.value;
  const roleSlug = request.cookies.get("factory_role")?.value;

  const hasValidRole = Boolean(roleSlug && isRoleSlug(roleSlug));
  const roleSlugValue = hasValidRole ? roleSlug : undefined;
  const isAuthenticated = Boolean(token && hasValidRole);

  if (pathname.startsWith("/dashboard")) {
    const [, , requestedRoleSlug] = pathname.split("/");

    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (!hasValidRole) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (!requestedRoleSlug && roleSlugValue) {
      return NextResponse.redirect(new URL(`/dashboard/${roleSlugValue}`, request.url));
    }

    if (requestedRoleSlug && roleSlugValue && requestedRoleSlug !== roleSlugValue) {
      return NextResponse.redirect(new URL(`/dashboard/${roleSlugValue}`, request.url));
    }
  }

  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (isAuthenticated && roleSlug) {
      return NextResponse.redirect(new URL(`/dashboard/${roleSlug}`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/auth/:path*", "/dashboard/:path*"],
};
