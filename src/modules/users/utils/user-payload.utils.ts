import type {
  UsuarioFormInput,
  UsuarioItem,
  UsuarioResponse,
  UsuariosResponse,
} from "@/src/modules/users/types/user.types";

type UnknownRecord = Record<string, unknown>;

const toRecord = (value: unknown): UnknownRecord => {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : {};
};

const toText = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
};

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeUsuario = (value: UnknownRecord): UsuarioItem => ({
  id: toNumber(value.id, 0),
  id_rol: toNumber(value.id_rol ?? value.rol_id, 0),
  tipo_identificacion: toText(value.tipo_identificacion, ""),
  identificacion: toText(value.identificacion, ""),
  nombre: toText(value.nombre ?? value.nombres, ""),
  apellido: toText(value.apellido ?? value.apellidos, ""),
  email: toText(value.email, ""),
  telefono: toText(value.telefono, ""),
  direccion: toText(value.direccion, ""),
  estado: toText(value.estado ?? value.status, ""),
  id_punto_emision_default: toNumber(value.id_punto_emision_default, 0) || undefined,
});

export const normalizeUsuariosResponse = (payload: unknown): UsuariosResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.usuarios ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeUsuario(toRecord(item))),
  };
};

export const normalizeUsuarioResponse = (payload: unknown): UsuarioResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.usuario ?? raw;
  const usuario = normalizeUsuario(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: usuario,
  };
};

export const toUsuarioFormInput = (usuario: UsuarioItem): UsuarioFormInput => ({
  id_rol: usuario.id_rol ?? 0,
  tipo_identificacion: usuario.tipo_identificacion ?? "",
  identificacion: usuario.identificacion ?? "",
  nombre: usuario.nombre ?? "",
  apellido: usuario.apellido ?? "",
  email: usuario.email ?? "",
  password: "",
  telefono: usuario.telefono ?? "",
  direccion: usuario.direccion ?? "",
  id_punto_emision_default: usuario.id_punto_emision_default ?? 0,
});
