"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Edit, Eye, PlusCircle, Power, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import type {
  NotaCreditoDetalleDraft,
  NotaCreditoFormState,
  NotaCreditoItem,
} from "@/src/modules/credit-notes/types/credit-note.types";
import { toNotaCreditoFormState } from "@/src/modules/credit-notes/utils/credit-note-payload.utils";
import { creditNoteService } from "@/src/modules/credit-notes/services/credit-note.service";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { invoiceService } from "@/src/modules/invoices/services/invoice.service";
import type { FacturaItem } from "@/src/modules/invoices/types/invoice.types";

const initialDetail = (): NotaCreditoDetalleDraft => ({
  codigo: "",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  descuento: 0,
  codigo_iva: "",
  porcentaje_iva: 0,
});

const initialForm: NotaCreditoFormState = {
  id_punto_emision: 0,
  ref_mode: "INTERNA",
  id_factura_ref: 0,
  factura_ref_numero: "",
  factura_ref_fecha: "",
  factura_ref_autorizacion: "",
  motivo: "",
  id_cliente: 0,
  use_manual_cliente: false,
  cli_identificacion: "",
  cli_razon_social: "",
  fecha_emision: "",
  detalles: [initialDetail()],
};

const estadoFilters = ["TODOS", "BORRADOR", "AUTORIZADO", "RECHAZADA", "INACTIVO"] as const;

const getEstadoColor = (estado?: string) => {
  switch (estado?.toUpperCase()) {
    case "AUTORIZADO": return "bg-emerald-100 text-emerald-700";
    case "RECHAZADA": return "bg-rose-100 text-rose-700";
    case "BORRADOR": return "bg-amber-100 text-amber-700";
    case "INACTIVO": return "bg-rose-100 text-rose-700";
    default: return "bg-sky-100 text-sky-700";
  }
};

type EstadoFiltro = (typeof estadoFilters)[number];

interface CreditNotesPanelProps {
  showPanel?: boolean;
}

export function CreditNotesPanel({ showPanel = true }: CreditNotesPanelProps) {
  const [notas, setNotas] = useState<NotaCreditoItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<NotaCreditoItem | null>(null);
  const [detail, setDetail] = useState<NotaCreditoItem | null>(null);
  const [form, setForm] = useState<NotaCreditoFormState>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todas";
    return filter.charAt(0) + filter.slice(1).toLowerCase();
  }, [filter]);

  const filteredNotas = useMemo(() => {
    let result = notas;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(n => 
        n.numero?.toLowerCase().includes(lower) || 
        n.cliente_nombre?.toLowerCase().includes(lower) ||
        n.cliente_identificacion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [notas, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredNotas.length / itemsPerPage) || 1;
  const paginatedNotas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotas.slice(start, start + itemsPerPage);
  }, [filteredNotas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [clientesData, puntosData, facturasData] = await Promise.all([
          clientService.listClientes("ACTIVO"),
          emissionPointService.listPuntos("ACTIVO"),
          invoiceService.listFacturas(),
        ]);
        setClientes(clientesData);
        setPuntos(puntosData);
        setFacturas(facturasData);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los catálogos.";
        toast.error(message);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    void loadCatalogs();
  }, []);

  useEffect(() => {
    const loadNotas = async () => {
      setLoading(true);
      try {
        const data = await creditNoteService.listNotas();
        const filtered =
          filter === "TODOS"
            ? data
            : data.filter((item) => item.estado?.toUpperCase() === filter);
        setNotas(filtered);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar las notas.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadNotas();
  }, [filter]);

  const refresh = async () => {
    try {
      const data = await creditNoteService.listNotas();
      const filtered =
        filter === "TODOS"
          ? data
          : data.filter((item) => item.estado?.toUpperCase() === filter);
      setNotas(filtered);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las notas.";
      toast.error(message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_punto_emision: puntos[0]?.id ?? 0,
      id_cliente: clientes[0]?.id ?? 0,
      id_factura_ref: facturas[0]?.id ?? 0,
      fecha_emision: new Date().toISOString().slice(0, 10),
      detalles: [initialDetail()],
    });
    setModalOpen(true);
  };

  const openEdit = async (nota: NotaCreditoItem) => {
    try {
      const data = await creditNoteService.getNota(nota.id);
      setEditing(data);
      setForm(toNotaCreditoFormState(data));
      setModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar la nota.";
      toast.error(message);
    }
  };

  const openDetail = async (nota: NotaCreditoItem) => {
    try {
      const data = await creditNoteService.getNota(nota.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle.";
      toast.error(message);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Clave de acceso copiada al portapapeles.");
    } catch {
      toast.error("No se pudo copiar la clave de acceso.");
    }
  };

  const updateField = (name: keyof NotaCreditoFormState, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateDetail = (
    index: number,
    field: keyof NotaCreditoDetalleDraft,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addDetail = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [...prev.detalles, initialDetail()],
    }));
  };

  const removeDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = () => {
    const detalles = form.detalles.map((item) => ({
      codigo: item.codigo,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
      descuento: item.descuento,
      codigo_iva: item.codigo_iva,
      porcentaje_iva: item.porcentaje_iva,
    }));

    return {
      id_punto_emision: form.id_punto_emision,
      id_factura_ref: form.ref_mode === "INTERNA" ? form.id_factura_ref : undefined,
      factura_ref_numero: form.ref_mode === "MANUAL" ? form.factura_ref_numero : undefined,
      factura_ref_fecha: form.ref_mode === "MANUAL" ? form.factura_ref_fecha : undefined,
      factura_ref_autorizacion:
        form.ref_mode === "MANUAL" ? form.factura_ref_autorizacion : undefined,
      motivo: form.motivo,
      id_cliente: form.use_manual_cliente ? undefined : form.id_cliente,
      cli_identificacion: form.use_manual_cliente ? form.cli_identificacion : undefined,
      cli_razon_social: form.use_manual_cliente ? form.cli_razon_social : undefined,
      fecha_emision: form.fecha_emision,
      detalles,
    };
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.id_punto_emision) {
      toast.warning("Selecciona un punto de emisión.");
      return;
    }
    if (!form.motivo.trim()) {
      toast.warning("Ingresa el motivo de la nota.");
      return;
    }
    if (form.ref_mode === "INTERNA" && !form.id_factura_ref) {
      toast.warning("Selecciona la factura de referencia.");
      return;
    }
    if (form.ref_mode === "MANUAL" && !form.factura_ref_numero.trim()) {
      toast.warning("Ingresa el número de factura referenciada.");
      return;
    }
    if (form.detalles.length === 0) {
      toast.warning("Agrega al menos un detalle.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await creditNoteService.updateNota(editing.id, payload);
        toast.success("Nota de crédito actualizada.");
      } else {
        await creditNoteService.createNota(payload);
        toast.success("Nota de crédito creada.");
      }
      await refresh();
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la nota.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (nota: NotaCreditoItem) => {
    try {
      await creditNoteService.toggleEstado(nota.id);
      await refresh();
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const emitirNota = async (nota: NotaCreditoItem) => {
    try {
      await creditNoteService.emitirNota(nota.id);
      await refresh();
      toast.success("Nota emitida.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo emitir la nota.";
      toast.error(message);
    }
  };

  const deleteNota = async (nota: NotaCreditoItem) => {
    try {
      await creditNoteService.deleteNota(nota.id);
      await refresh();
      toast.success("Nota eliminada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la nota.";
      toast.error(message);
    }
  };

  const getClienteLabel = (clienteId?: number, fallback?: string) => {
    if (!clienteId) return fallback || "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || fallback || "-";
  };

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  const getFacturaLabel = (facturaId?: number, fallback?: string) => {
    if (!facturaId) return fallback || "-";
    const factura = facturas.find((item) => item.id === facturaId);
    return factura?.numero || `Factura #${facturaId}`;
  };

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar nota de crédito..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <Select value={filter} onChange={(event) => setFilter(event.target.value as EstadoFiltro)}>
              {estadoFilters.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "TODOS" ? "Todos" : estado}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate} disabled={loadingCatalogs}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva nota
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando notas...</p>
      ) : filteredNotas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay notas para este filtro.</p>
          <Button className="mt-3" onClick={openCreate} disabled={loadingCatalogs}>
            Crear nota
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nota</th>
                <th className="px-4 py-3">Factura ref.</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedNotas.map((nota) => (
                <tr key={nota.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {nota.numero || `Nota #${nota.id}`}
                    </p>
                    <p className="text-xs text-slate-500">{getPuntoLabel(nota.id_punto_emision)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">
                      {getFacturaLabel(nota.id_factura_ref, nota.factura_ref_numero)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {nota.factura_ref_fecha || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">
                      {getClienteLabel(nota.id_cliente, nota.cliente_nombre)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {nota.cliente_identificacion || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoColor(nota.estado)}`}
                    >
                      {nota.estado || "BORRADOR"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openDetail(nota)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Button>
                      <Button variant="secondary" onClick={() => openEdit(nota)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="secondary" onClick={() => emitirNota(nota)}>
                        <Send className="mr-1 h-4 w-4" />
                        Emitir
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(nota)}>
                        <Power className="mr-1 h-4 w-4" />
                        Cambiar estado
                      </Button>
                      <Button variant="ghost" onClick={() => deleteNota(nota)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredNotas.length)} de {filteredNotas.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,900px)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar nota de crédito" : "Nueva nota de crédito"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Completa la información de la nota de crédito.
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 md:grid-cols-3">
                <Field label="Punto de emisión" htmlFor="id_punto_emision">
                  <Select
                    id="id_punto_emision"
                    value={String(form.id_punto_emision)}
                    onChange={(event) =>
                      updateField("id_punto_emision", Number(event.target.value))
                    }
                    disabled={loadingCatalogs}
                  >
                    {puntos.map((punto) => (
                      <option key={punto.id} value={punto.id}>
                        {punto.codigo} - {punto.descripcion}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Fecha de emisión" htmlFor="fecha_emision">
                  <Input
                    id="fecha_emision"
                    type="date"
                    value={form.fecha_emision}
                    onChange={(event) => updateField("fecha_emision", event.target.value)}
                  />
                </Field>

                <Field label="Motivo" htmlFor="motivo">
                  <Input
                    id="motivo"
                    value={form.motivo}
                    onChange={(event) => updateField("motivo", event.target.value)}
                  />
                </Field>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Factura referenciada</h4>
                  <Select
                    value={form.ref_mode}
                    onChange={(event) =>
                      updateField("ref_mode", event.target.value as "INTERNA" | "MANUAL")
                    }
                  >
                    <option value="INTERNA">Interna</option>
                    <option value="MANUAL">Manual</option>
                  </Select>
                </div>

                {form.ref_mode === "INTERNA" ? (
                  <div className="mt-3">
                    <Field label="Factura" htmlFor="id_factura_ref">
                      <Select
                        id="id_factura_ref"
                        value={String(form.id_factura_ref)}
                        onChange={(event) =>
                          updateField("id_factura_ref", Number(event.target.value))
                        }
                        disabled={loadingCatalogs}
                      >
                        {facturas.map((factura) => (
                          <option key={factura.id} value={factura.id}>
                            {factura.numero || `Factura #${factura.id}`}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    <Field label="Número" htmlFor="factura_ref_numero">
                      <Input
                        id="factura_ref_numero"
                        value={form.factura_ref_numero}
                        onChange={(event) =>
                          updateField("factura_ref_numero", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Fecha" htmlFor="factura_ref_fecha">
                      <Input
                        id="factura_ref_fecha"
                        type="date"
                        value={form.factura_ref_fecha}
                        onChange={(event) =>
                          updateField("factura_ref_fecha", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Autorización" htmlFor="factura_ref_autorizacion">
                      <Input
                        id="factura_ref_autorizacion"
                        value={form.factura_ref_autorizacion}
                        onChange={(event) =>
                          updateField("factura_ref_autorizacion", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Cliente</h4>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-sky-700"
                      checked={form.use_manual_cliente}
                      onChange={(event) => updateField("use_manual_cliente", event.target.checked)}
                    />
                    Ingresar cliente manual
                  </label>
                </div>

                {!form.use_manual_cliente ? (
                  <div className="mt-3">
                    <Field label="Cliente" htmlFor="id_cliente">
                      <Select
                        id="id_cliente"
                        value={String(form.id_cliente)}
                        onChange={(event) => updateField("id_cliente", Number(event.target.value))}
                        disabled={loadingCatalogs}
                      >
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.razon_social}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Identificación" htmlFor="cli_identificacion">
                      <Input
                        id="cli_identificacion"
                        value={form.cli_identificacion}
                        onChange={(event) =>
                          updateField("cli_identificacion", event.target.value)
                        }
                      />
                    </Field>
                    <Field label="Razón social" htmlFor="cli_razon_social">
                      <Input
                        id="cli_razon_social"
                        value={form.cli_razon_social}
                        onChange={(event) => updateField("cli_razon_social", event.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Detalles</h4>
                  <Button type="button" variant="secondary" onClick={addDetail}>
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Agregar detalle
                  </Button>
                </div>

                <div className="mt-3 space-y-4">
                  {form.detalles.map((detalle, index) => (
                    <div key={`detalle-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Detalle #{index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDetail(index)}
                          disabled={form.detalles.length === 1}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Quitar
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <Field label="Código" htmlFor={`detalle-${index}-codigo`}>
                          <Input
                            id={`detalle-${index}-codigo`}
                            value={detalle.codigo}
                            onChange={(event) => updateDetail(index, "codigo", event.target.value)}
                          />
                        </Field>
                        <Field label="Descripción" htmlFor={`detalle-${index}-descripcion`}>
                          <Input
                            id={`detalle-${index}-descripcion`}
                            value={detalle.descripcion}
                            onChange={(event) =>
                              updateDetail(index, "descripcion", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Cantidad" htmlFor={`detalle-${index}-cantidad`}>
                          <Input
                            id={`detalle-${index}-cantidad`}
                            type="number"
                            min={1}
                            value={detalle.cantidad}
                            onChange={(event) =>
                              updateDetail(index, "cantidad", Number(event.target.value))
                            }
                          />
                        </Field>
                        <Field label="Precio unitario" htmlFor={`detalle-${index}-precio`}>
                          <Input
                            id={`detalle-${index}-precio`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.precio_unitario}
                            onChange={(event) =>
                              updateDetail(index, "precio_unitario", Number(event.target.value))
                            }
                          />
                        </Field>
                        <Field label="Descuento" htmlFor={`detalle-${index}-descuento`}>
                          <Input
                            id={`detalle-${index}-descuento`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.descuento}
                            onChange={(event) =>
                              updateDetail(index, "descuento", Number(event.target.value))
                            }
                          />
                        </Field>
                        <Field label="Código IVA" htmlFor={`detalle-${index}-codigoiva`}>
                          <Input
                            id={`detalle-${index}-codigoiva`}
                            value={detalle.codigo_iva}
                            onChange={(event) =>
                              updateDetail(index, "codigo_iva", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Porcentaje IVA" htmlFor={`detalle-${index}-porcentajeiva`}>
                          <Input
                            id={`detalle-${index}-porcentajeiva`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.porcentaje_iva}
                            onChange={(event) =>
                              updateDetail(index, "porcentaje_iva", Number(event.target.value))
                            }
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Detalle de nota de crédito
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Información completa de la nota seleccionada.
            </Dialog.Description>

            {detail ? (
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold">Nota:</span> {detail.numero || detail.id}
                  </div>
                  <div>
                    <span className="font-semibold">Fecha:</span> {detail.fecha_emision || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Cliente:</span>{" "}
                    {getClienteLabel(detail.id_cliente, detail.cliente_nombre)}
                  </div>
                  <div>
                    <span className="font-semibold">Motivo:</span> {detail.motivo || "-"}
                  </div>
                </div>

                {detail.factura_ref_autorizacion && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800">Clave de acceso:</span>
                      <Button
                        variant="secondary"
                        onClick={() => copyToClipboard(detail.factura_ref_autorizacion!)}
                      >
                        <Copy className="mr-1 h-4 w-4" />
                        Copiar
                      </Button>
                    </div>
                    <p className="mt-1 break-all font-mono text-xs text-slate-600">
                      {detail.factura_ref_autorizacion}
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-slate-800">Detalles</p>
                  {detail.detalles?.length ? (
                    <ul className="mt-2 space-y-1">
                      {detail.detalles.map((item, idx) => (
                        <li key={`detalle-${idx}`}>
                          {item.descripcion || item.codigo} - Cant: {item.cantidad}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">Sin detalles.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Cargando detalle...</p>
            )}

            <div className="mt-5 flex justify-end">
              <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
