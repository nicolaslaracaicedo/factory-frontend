import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRoleSlug } from "@/src/modules/auth/utils/role.utils";

export default async function DashboardIndexPage() {
  const cookieStore = await cookies();
  const roleSlug = cookieStore.get("factory_role")?.value;

  if (roleSlug && isRoleSlug(roleSlug)) {
    redirect(`/dashboard/${roleSlug}`);
  }

  redirect("/auth/login");
}
