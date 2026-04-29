import type { LoginResponse } from "@/src/modules/auth/types/auth.types";
import { getRoleFromUserLike } from "@/src/modules/auth/utils/role.utils";

export type UnknownRecord = Record<string, unknown>;

export const toRecord = (value: unknown): UnknownRecord => {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
};

export const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
};

export const toRequiredString = (value: unknown, fallback: string): string => {
  return toOptionalString(value) ?? fallback;
};

export const buildLoginResponse = (
  payload: unknown,
  fallbackRuc: string,
  fallbackCedula: string
): LoginResponse => {
  const raw = toRecord(payload);
  const data = toRecord(raw.data ?? raw.result ?? raw.payload);
  const source = Object.keys(data).length > 0 ? data : raw;
  const user = toRecord(
    source.user ?? source.usuario ?? raw.user ?? raw.usuario
  );
  const role =
    getRoleFromUserLike(user) ??
    getRoleFromUserLike(source) ??
    getRoleFromUserLike(raw) ??
    null;

  if (!role) {
    throw new Error("No fue posible determinar el rol del usuario.");
  }

  return {
    token: toRequiredString(
      source.token ??
        source.accessToken ??
        source.jwt ??
        raw.token ??
        raw.accessToken ??
        raw.jwt,
      ""
    ),
    user: {
      id: toOptionalString(user.id),
      ruc: toRequiredString(user.ruc ?? source.ruc ?? raw.ruc, fallbackRuc),
      identificacion: toRequiredString(
        user.identificacion ??
          user.cedula ??
          source.identificacion ??
          source.cedula ??
          raw.identificacion ??
          raw.cedula,
        fallbackCedula
      ),
      nombre: toOptionalString(user.nombre),
      apellido: toOptionalString(user.apellido),
      email: toOptionalString(user.email),
      role,
    },
  };
};
