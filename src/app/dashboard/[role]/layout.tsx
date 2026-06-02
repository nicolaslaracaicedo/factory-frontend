import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRoleSlug } from "@/src/modules/auth/utils/role.utils";

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

  // Defense-in-depth: el middleware ya valida cookies,
  // pero si por alguna razón llegamos aquí sin ellas, redirigimos
  if (!token || !roleSlug || !isRoleSlug(roleSlug)) {
    redirect("/auth/login");
  }

  // Si el role de la URL no coincide con la cookie, redirigir al correcto
  if (role && role !== roleSlug) {
    redirect(`/dashboard/${roleSlug}`);
  }

  return <>{children}</>;
}
