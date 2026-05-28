import type {
  NotaDebitoFormState,
  NotaDebitoItem,
  NotaDebitoMotivo,
  NotaDebitoResponse,
  NotasDebitoResponse,
} from "@/src/modules/debit-notes/types/debit-note.types";

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

const normalizeMotivo = (value: UnknownRecord): NotaDebitoMotivo => ({
  razon: toText(value.razon ?? value.motivo ?? value.descripcion, ""),
  valor: toNumber(value.valor ?? value.monto, 0),
});

const normalizeNota = (value: UnknownRecord): NotaDebitoItem => ({
  id: toNumber(value.id, 0),
  numero: toText(value.numero ?? value.numero_nota ?? value.secuencial, ""),
  numero_comprobante: toText(value.numero_comprobante, ""),
  estado: toText(value.estado ?? value.status, ""),
  id_punto_emision: toNumber(value.id_punto_emision ?? value.punto_emision_id, 0) || undefined,
  id_factura_ref: toNumber(value.id_factura_ref ?? value.factura_ref_id, 0) || undefined,
  motivo: toText(value.motivo, ""),
  id_cliente: toNumber(value.id_cliente ?? value.cliente_id, 0) || undefined,
  cliente_identificacion: toText(
    value.cliente_identificacion ?? value.cli_identificacion,
    ""
  ),
  cliente_nombre: toText(value.cliente_nombre ?? value.cli_razon_social, ""),
  fecha_emision: toText(value.fecha_emision ?? value.emision_fecha, ""),
  codigo_iva: toText(value.codigo_iva ?? value.iva_codigo, ""),
  porcentaje_iva: toNumber(value.porcentaje_iva ?? value.iva_porcentaje, 0) || undefined,
  motivos: Array.isArray(value.motivos)
    ? value.motivos.map((item) => normalizeMotivo(toRecord(item)))
    : undefined,
});

export const normalizeNotasDebitoResponse = (
  payload: unknown
): NotasDebitoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.notas ?? raw.items ?? raw;
  const list = Array.isArray(dataSource) ? dataSource : [];

  return {
    message: toText(raw.message, ""),
    data: list.map((item) => normalizeNota(toRecord(item))),
  };
};

export const normalizeNotaDebitoResponse = (
  payload: unknown
): NotaDebitoResponse => {
  const raw = toRecord(payload);
  const dataSource = raw.data ?? raw.nota ?? raw;
  const nota = normalizeNota(toRecord(dataSource));

  return {
    message: toText(raw.message, ""),
    data: nota,
  };
};

export const toNotaDebitoFormState = (nota: NotaDebitoItem): NotaDebitoFormState => ({
  id_punto_emision: nota.id_punto_emision ?? 0,
  id_factura_ref: nota.id_factura_ref ?? 0,
  motivo: nota.motivo ?? "",
  id_cliente: nota.id_cliente ?? 0,
  use_manual_cliente: Boolean(nota.cliente_identificacion || nota.cliente_nombre) && !nota.id_cliente,
  cli_identificacion: nota.cliente_identificacion ?? "",
  cli_razon_social: nota.cliente_nombre ?? "",
  fecha_emision: nota.fecha_emision ?? "",
  codigo_iva: nota.codigo_iva ?? "",
  porcentaje_iva: nota.porcentaje_iva ?? 0,
  motivos: (nota.motivos ?? []).map((item) => ({
    razon: item.razon ?? "",
    valor: item.valor ?? 0,
  })),
});
