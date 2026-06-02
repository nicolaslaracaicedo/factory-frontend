import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRoleSlug } from "@/src/modules/auth/utils/role.utils";

const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const validateSession = async (token: string) => {
  const response = await fetch(`${API_URL}/api/empresa`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (response.status === 401 || response.status === 403) {
    return false;
  }

  if (!response.ok) {
    throw new Error("No se pudo validar la sesion.");
  }

  return true;
};

export default async function RoleDashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("factory_token")?.value;
  const roleSlug = cookieStore.get("factory_role")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  if (!roleSlug || !isRoleSlug(roleSlug)) {
    redirect("/auth/login");
  }

  if (role && role !== roleSlug) {
    redirect(`/dashboard/${roleSlug}`);
  }

  const isValid = await validateSession(token);
  if (!isValid) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
