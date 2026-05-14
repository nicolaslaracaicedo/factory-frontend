import type { UserRole } from "@/src/modules/auth/types/auth.types";

export const roleIdToName: Record<number, UserRole> = {
  1: "Administrador",
  2: "Facturador",
  3: "Contador",
};

export const roleToSlug: Record<UserRole, string> = {
  Administrador: "administrador",
  Facturador: "facturador",
  Contador: "contador",
};

export const slugToRole: Record<string, UserRole> = {
  administrador: "Administrador",
  facturador: "Facturador",
  contador: "Contador",
};

const roleAliases: Record<string, UserRole> = {
  administrador: "Administrador",
  admin: "Administrador",
  superadmin: "Administrador",
  facturador: "Facturador",
  facturacion: "Facturador",
  billing: "Facturador",
  contador: "Contador",
  contabilidad: "Contador",
  accountant: "Contador",
};

const normalizeText = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
};

const normalizeFromUnknown = (value: unknown): UserRole | null => {
  if (typeof value === "string") {
    return roleAliases[normalizeText(value)] ?? null;
  }

  if (typeof value === "number") {
    if (value === 1) return "Administrador";
    if (value === 2) return "Facturador";
    if (value === 3) return "Contador";
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return (
      normalizeFromUnknown(record.nombre) ??
      normalizeFromUnknown(record.name) ??
      normalizeFromUnknown(record.role) ??
      normalizeFromUnknown(record.rol) ??
      null
    );
  }

  return null;
};

export const getRoleFromUserLike = (value: unknown): UserRole | null => {
  if (typeof value !== "object" || value === null) {
    return normalizeFromUnknown(value);
  }

  const record = value as Record<string, unknown>;

  return (
    normalizeFromUnknown(record.role) ??
    normalizeFromUnknown(record.rol) ??
    normalizeFromUnknown(record.roleName) ??
    normalizeFromUnknown(record.role_name) ??
    normalizeFromUnknown(record.perfil) ??
    normalizeFromUnknown(record.profile) ??
    normalizeFromUnknown(record.tipoUsuario) ??
    normalizeFromUnknown(record.tipo_usuario) ??
    normalizeFromUnknown(record.idRol) ??
    normalizeFromUnknown(record.roleId) ??
    null
  );
};

export const isRoleSlug = (value: string): value is keyof typeof slugToRole => {
  return value in slugToRole;
};
