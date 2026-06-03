"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Edit, Eye, PlusCircle, Power, Send, Trash2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, Printer, Trash, Package, User, Calendar, FileCheck, Tag, Receipt, FileX, RefreshCw, Calculator, CheckCircle, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import type {
  NotaDebitoFormState,
  NotaDebitoItem,
  NotaDebitoMotivoDraft,
} from "@/src/modules/debit-notes/types/debit-note.types";
import { toNotaDebitoFormState } from "@/src/modules/debit-notes/utils/debit-note-payload.utils";
import { debitNoteService } from "@/src/modules/debit-notes/services/debit-note.service";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { invoiceService } from "@/src/modules/invoices/services/invoice.service";
import type { FacturaItem } from "@/src/modules/invoices/types/invoice.types";
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";
import { Loader } from "@/src/components/ui/loader";

import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { confirmAction } from "@/src/lib/confirm";

const initialMotivo = (): NotaDebitoMotivoDraft => ({
  razon: "",
  valor: 0,
});

const initialForm: NotaDebitoFormState = {
  id_punto_emision: 0,
  id_factura_ref: 0,
  motivo: "",
  id_cliente: 0,
  use_manual_cliente: false,
  cli_identificacion: "",
  cli_razon_social: "",
  fecha_emision: "",
  codigo_iva: "",
  porcentaje_iva: 0,
  motivos: [initialMotivo()],
};

const estadoFilters = ["TODOS", "BORRADOR", "ENVIADO", "AUTORIZADO", "RECHAZADA", "ANULADA"] as const;

const getEstadoColor = (estado?: string) => {
  switch (estado?.toUpperCase()) {
    case "AUTORIZADO": return "bg-emerald-100 text-emerald-700";
    case "RECHAZADA": return "bg-rose-100 text-rose-700";
    case "BORRADOR": return "bg-amber-100 text-amber-700";
    case "ENVIADO": return "bg-blue-100 text-blue-700";
    case "ANULADA": return "bg-slate-100 text-slate-600";
    default: return "bg-sky-100 text-sky-700";
  }
};

type EstadoFiltro = (typeof estadoFilters)[number];

interface DebitNotesPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

export function DebitNotesPanel({ showPanel = true, readOnly = false }: DebitNotesPanelProps) {
  const [notas, setNotas] = useState<NotaDebitoItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<NotaDebitoItem | null>(null);
  const [detail, setDetail] = useState<NotaDebitoItem | null>(null);
  const [form, setForm] = useState<NotaDebitoFormState>(initialForm);
  const [facturaQuery, setFacturaQuery] = useState("");
  const [facturaSearchResults, setFacturaSearchResults] = useState<FacturaItem[]>([]);
  const [montoStr, setMontoStr] = useState("");
  const [motivoValorStrs, setMotivoValorStrs] = useState<string[]>([""]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [facturaEsConsumidorFinal, setFacturaEsConsumidorFinal] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailNota, setEmailNota] = useState<NotaDebitoItem | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [puntoSearch, setPuntoSearch] = useState("");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [savedNota, setSavedNota] = useState<NotaDebitoItem | null>(null);

  function SortIcon({ column }: { column: any }) {
    const sorted = column.getIsSorted();
    if (sorted === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (sorted === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const columns = useMemo<ColumnDef<NotaDebitoItem>[]>(() => [
    {
      accessorKey: "numero",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nota
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.numero_comprobante || row.original.numero || `Nota #${row.original.id}`}</div>
          <div className="text-slate-500 text-xs">{getPuntoLabel(row.original.id_punto_emision)}</div>
        </div>
      ),
    },
    {
      accessorKey: "cliente_nombre",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cliente
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-slate-800">{getClienteLabel(row.original.id_cliente, row.original.cliente_nombre)}</div>
          <div className="text-slate-500 text-xs">{row.original.cliente_identificacion || "-"}</div>
        </div>
      ),
    },
    {
      accessorKey: "factura_ref_numero",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Factura ref.
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-slate-700">{getFacturaLabel(row.original.id_factura_ref)}</div>
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Estado
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getEstadoColor(row.original.estado)}`}>
          {row.original.estado || "BORRADOR"}
        </span>
      ),
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                <MoreVertical size={16} strokeWidth={2.5} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openDetail(row.original)}>
                <Eye size={14} className="mr-2" />
                Ver
              </DropdownMenuItem>
              {!readOnly && row.original.estado?.toUpperCase() === "BORRADOR" && (
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Edit size={14} className="mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {row.original.estado?.toUpperCase() === "AUTORIZADO" && (
                <>
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-debito/${row.original.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-debito/${row.original.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
                    <Printer size={14} className="mr-2" />
                    Imprimir Recibo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEmailDialog(row.original)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                    <Mail size={14} className="mr-2" />
                    Enviar por correo
                  </DropdownMenuItem>
                  {!readOnly && (
                    <DropdownMenuItem onClick={() => handleAnular(row.original)} className="text-orange-600 focus:bg-orange-50 focus:text-orange-700 font-medium">
                      <X size={14} className="mr-2" />
                      Anular
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {!readOnly && row.original.estado?.toUpperCase() !== "AUTORIZADO" && row.original.estado?.toUpperCase() !== "ANULADA" && (
                <DropdownMenuItem onClick={() => emitirNota(row.original)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                  <Send size={14} className="mr-2" />
                  Emitir al SRI
                </DropdownMenuItem>
              )}
              {!readOnly && row.original.estado?.toUpperCase() === "BORRADOR" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteNota(row.original)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                    <Trash2 size={14} className="mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [clientes, puntos, facturas]);

  const table = useReactTable({
    data: notas,
    columns,
    state: { globalFilter, columnFilters, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  useEffect(() => {
    if (filter === "TODOS") setColumnFilters([]);
    else setColumnFilters([{ id: "estado", value: filter }]);
  }, [filter]);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [clientesData, puntosData, facturasData, ivaData] = await Promise.all([
          clientService.listClientes("ACTIVO"),
          emissionPointService.listPuntos("ACTIVO"),
          invoiceService.listFacturas(),
          ivaService.listCodigos(true),
        ]);
        setClientes(clientesData);
        setPuntos(puntosData);
        setFacturas(facturasData);
        setCodigosIva(ivaData);
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
        const data = await debitNoteService.listNotas();
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
      const data = await debitNoteService.listNotas();
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
    setFacturaQuery("");
    setFacturaSearchResults([]);
    setFacturaEsConsumidorFinal(false);
    setForm({
      ...initialForm,
      id_punto_emision: (() => { const d = useAuthStore.getState().user?.puntoEmisionDefault; const n = Number(d); return (n > 0 && puntos.some(p => p.id === n)) ? n : (puntos[0]?.id ?? 0); })(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      motivos: [initialMotivo()],
    });
    setEditorOpen(true);
  };

  const openEdit = async (nota: NotaDebitoItem) => {
    try {
      const data = await debitNoteService.getNota(nota.id);
      setEditing(data);
      setForm(toNotaDebitoFormState(data));
      setFacturaQuery("");
      setFacturaSearchResults([]);
      setFacturaEsConsumidorFinal(false);
      setEditorOpen(true);
    } catch { /* ignore */ }
  };

  const openDetail = async (nota: NotaDebitoItem) => {
    try {
      const data = await debitNoteService.getNota(nota.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof NotaDebitoFormState, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateMotivo = (
    index: number,
    field: keyof NotaDebitoMotivoDraft,
    value: string | number
  ) => {
    setForm((prev) => ({
      ...prev,
      motivos: prev.motivos.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addMotivo = () => {
    setForm((prev) => ({
      ...prev,
      motivos: [...prev.motivos, initialMotivo()],
    }));
    setMotivoValorStrs((prev) => [...prev, ""]);
  };

  const removeMotivo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      motivos: prev.motivos.filter((_, idx) => idx !== index),
    }));
    setMotivoValorStrs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const buildPayload = () => {
    return {
      id_punto_emision: form.id_punto_emision,
      id_factura_ref: form.id_factura_ref,
      motivo: form.motivo,
      id_cliente: form.id_cliente > 0 ? form.id_cliente : undefined,
      fecha_emision: form.fecha_emision,
      codigo_iva: form.codigo_iva,
      porcentaje_iva: form.porcentaje_iva,
      motivos: form.motivos.map((item) => ({
        razon: item.razon,
        valor: item.valor,
      })),
    };
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.id_punto_emision) {
      toast.warning("Selecciona un punto de emisión.");
      return;
    }
    if (!form.id_factura_ref) {
      toast.warning("Selecciona la factura de referencia.");
      return;
    }
    if (!form.motivo.trim()) {
      toast.warning("Ingresa el motivo de la nota.");
      return;
    }
    if (form.motivos.length === 0) {
      toast.warning("Agrega al menos un motivo detallado.");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await debitNoteService.updateNota(editing.id, payload);
        toast.success("Nota de débito actualizada.");
        await refresh();
        setEditorOpen(false);
      } else {
        const result = await debitNoteService.createNota(payload);
        toast.success("Nota de débito creada correctamente.");
        setSavedNota(result);
        setSuccessDialogOpen(true);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la nota.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (nota: NotaDebitoItem) => {
    if (!await confirmAction({ message: "¿Estás seguro de que deseas cambiar el estado de esta nota de débito?", variant: "warning" })) return;
    try {
      await debitNoteService.toggleEstado(nota.id);
      await refresh();
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const emitirNota = async (nota: NotaDebitoItem) => {
    if (!await confirmAction({ title: "Emitir al SRI", message: "¿Estás seguro de que deseas emitir esta nota de débito al SRI?", confirmText: "Emitir", variant: "info" })) return;
    try {
      await debitNoteService.emitirNota(nota.id);
      await refresh();
      toast.success("Nota emitida.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo emitir la nota.";
      toast.error(message);
    }
  };

  const deleteNota = async (nota: NotaDebitoItem) => {
    if (!await confirmAction({ title: "Eliminar nota de débito", message: "¿Estás seguro de que deseas eliminar esta nota de débito? Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "danger" })) return;
    try {
      await debitNoteService.deleteNota(nota.id);
      await refresh();
      toast.success("Nota eliminada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la nota.";
      toast.error(message);
    }
  };

  const handleAnular = async (nota: NotaDebitoItem) => {
    if (!await confirmAction({ title: "Anular nota de débito", message: "Esta acción cambiará el estado a Anulado en el sistema. Asegúrate de haber realizado la anulación también en el portal del SRI en Línea.\n\nEsta acción es irreversible.", confirmText: "Anular", variant: "danger" })) return;
    try {
      await debitNoteService.cambiarEstado(nota.id, "ANULADA");
      await refresh();
      toast.success("Nota anulada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al anular la nota.";
      toast.error(message);
    }
  };

  const openEmailDialog = (nota: NotaDebitoItem) => {
    setEmailNota(nota);
    const cliente = clientes.find((c) => c.id === nota.id_cliente);
    setEmailAddress(cliente?.email || "");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailNota || emailSending) return;

    const email = emailAddress.trim();
    if (!email) return toast.error("Ingresa un correo de destino.");

    setEmailSending(true);
    try {
      await debitNoteService.enviarCorreo(emailNota.id, email);
      toast.success("Correo enviado correctamente.");
      setEmailDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo enviar el correo.";
      toast.error(message);
    } finally {
      setEmailSending(false);
    }
  };

  const getClienteLabel = (clienteId?: number, fallback?: string) => {
    if (!clienteId) return fallback || "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || fallback || "-";
  };

  const filteredPuntos = useMemo(() => puntos.filter((p) => !puntoSearch || p.codigo.toLowerCase().includes(puntoSearch.toLowerCase()) || p.descripcion.toLowerCase().includes(puntoSearch.toLowerCase())), [puntos, puntoSearch]);

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  const getFacturaLabel = (facturaId?: number) => {
    if (!facturaId) return "-";
    const factura = facturas.find((item) => item.id === facturaId);
    return factura?.numero_comprobante || factura?.numero || `Factura #${facturaId}`;
  };

  const { setBreadcrumbs, setHeaderVisible } = useBreadcrumbs();
  const { setActiveSection } = useDashboardSection();

  const navigateTo = (section: string) => { setActiveSection(section); };

  const closeEditor = () => { setEditorOpen(false); setEditing(null); setForm(initialForm); setMontoStr(""); setMotivoValorStrs([""]); setFacturaEsConsumidorFinal(false); };

  const getDefaultPuntoId = () => {
    const d = useAuthStore.getState().user?.puntoEmisionDefault;
    const n = Number(d);
    return (n > 0 && puntos.some(p => p.id === n)) ? n : (puntos[0]?.id ?? 0);
  };

  const goToList = async () => {
    setSuccessDialogOpen(false);
    setSavedNota(null);
    await refresh();
    setEditorOpen(false);
  };

  const openCreateFromSuccess = () => {
    setSuccessDialogOpen(false);
    setSavedNota(null);
    setMontoStr("");
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    });
    setFacturaQuery("");
    setFacturaSearchResults([]);
    setMotivoValorStrs([""]);
  };

  const resetForm = () => { setForm({ ...initialForm, id_punto_emision: (() => { const d = useAuthStore.getState().user?.puntoEmisionDefault; const n = Number(d); return (n > 0 && puntos.some(p => p.id === n)) ? n : (puntos[0]?.id ?? 0); })(), fecha_emision: new Date().toISOString().slice(0, 10), motivos: [initialMotivo()] }); setMontoStr(""); setMotivoValorStrs([""]); setFacturaEsConsumidorFinal(false); };

  useEffect(() => {
    if (editorOpen) {
      setHeaderVisible(false);
      const titulo = editing
        ? `Nota de débito #${editing.numero_comprobante || editing.numero || editing.id}`
        : "Nueva nota";
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Notas de débito", onClick: () => navigateTo("notas-debito") },
        { label: titulo },
      ]);
    } else { setHeaderVisible(true); setBreadcrumbs(null); }
    return () => { setHeaderVisible(true); setBreadcrumbs(null); };
  }, [editorOpen, editing, setBreadcrumbs, setHeaderVisible, setActiveSection]);

  const formatMoney = (value: number) => value.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totales = useMemo(() => {
    const subtotal = form.motivos.reduce((s, m) => s + m.valor, 0);
    const iva = subtotal * (form.porcentaje_iva / 100);
    return { subtotal, iva, total: subtotal + iva };
  }, [form.motivos, form.porcentaje_iva]);

  const handleFacturaSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFacturaQuery(value);
    if (!value.trim()) { setFacturaSearchResults([]); return; }
    const normalizeNum = (s: string) => s.replace(/-0+/g, "-").replace(/^0+/, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    const q = value.trim().toLowerCase();
    const qNorm = normalizeNum(q);
    const results = facturas.filter((f) => {
      const fullNum = (f.numero_comprobante || f.numero || "").toLowerCase();
      return fullNum.includes(q) || normalizeNum(fullNum).includes(qNorm) || (f.cliente_nombre || "").toLowerCase().includes(q);
    });
    setFacturaSearchResults(results);
  };

  const selectFactura = async (factura: FacturaItem) => {
    updateField("id_factura_ref", factura.id);
    try {
      const fullFactura = await invoiceService.getFactura(factura.id);
      const esConsumidor = fullFactura.consumidor_final === true || (!fullFactura.id_cliente && !fullFactura.cliente_nombre);
      setFacturaEsConsumidorFinal(esConsumidor);
      const totalFactura = fullFactura.total ?? 0;
      setMontoStr(totalFactura > 0 ? totalFactura.toFixed(2) : "");
      if (!esConsumidor && fullFactura.id_cliente) {
        updateField("id_cliente", fullFactura.id_cliente);
      }
    } catch { /* ignore */ }
    setFacturaQuery("");
    setFacturaSearchResults([]);
  };

  if (!showPanel) return null;

  return (
    <>
      {editorOpen ? (
        <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="space-y-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={closeEditor} className="h-10 w-10 p-0 text-slate-600 bg-slate-100 hover:bg-slate-200">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-900">{editing ? "Editar nota de débito" : "Nueva nota de débito"}</p>
              <p className="text-xs text-slate-500">Completa los datos y agrega los motivos antes de guardar.</p>
            </div>
          </div>
          <Button variant="secondary" onClick={resetForm} className="h-9 px-3 text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Limpiar
          </Button>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-6"
          onSubmit={submitForm}
        >
          <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-6">
              {/* Información general */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Punto de emisión *" htmlFor="id_punto_emision">
                    <SelectPrimitive.Root value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} onValueChange={(val) => updateField("id_punto_emision", Number(val))} disabled={loadingCatalogs}>
                      <SelectPrimitive.Trigger id="id_punto_emision" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50">
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un punto de emisión..."} />
                        <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content className="z-50 min-w-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                          <div className="border-b border-slate-100 p-2">
                            <Input value={puntoSearch} onChange={(e) => setPuntoSearch(e.target.value)} placeholder="Buscar punto..." className="h-8 bg-white shadow-none w-full" onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />
                          </div>
                          <SelectPrimitive.Viewport className="p-1">
                            {filteredPuntos.map((punto) => (
                              <SelectPrimitive.Item key={punto.id} value={punto.id.toString()} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>{punto.codigo} - {punto.descripcion}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>
                  <Field label="Fecha de emisión *" htmlFor="fecha_emision">
                    <Input id="fecha_emision" type="date" value={form.fecha_emision} onChange={(event) => updateField("fecha_emision", event.target.value)} className="bg-white shadow-none" />
                  </Field>
                  <Field label="Motivo *" htmlFor="motivo">
                    <div className="relative">
                      <Input 
                        id="motivo" 
                        value={form.motivo} 
                        onChange={(event) => updateField("motivo", event.target.value.slice(0, 300))} 
                        placeholder="Ej: Intereses por mora" 
                        className="bg-white shadow-none placeholder:text-slate-300 pr-14" 
                      />
                      <span className="absolute right-2 bottom-1/2 translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
                        {form.motivo.length}/300
                      </span>
                    </div>
                  </Field>
                </div>
              </div>

              {/* Factura referenciada */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Factura referenciada</h3>
                </div>
                {form.id_factura_ref > 0 && facturaSearchResults.length === 0 && !facturaQuery.trim() ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                        <span className="text-sm font-medium text-slate-800 truncate">{getFacturaLabel(form.id_factura_ref)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => { updateField("id_factura_ref", 0); setFacturaQuery(""); setFacturaSearchResults([]); setFacturaEsConsumidorFinal(false); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Cambiar factura">
                          <Search size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Field label="Buscar factura *" htmlFor="factura_search">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input id="factura_search" type="text" value={facturaQuery} onChange={handleFacturaSearchChange} placeholder="Buscar por número de factura..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
                      </div>
                    </Field>
                    {facturaSearchResults.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                        {facturaSearchResults.map((factura) => (
                          <button key={factura.id} type="button" onClick={() => selectFactura(factura)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0">
                            <div className="font-medium text-slate-800">{factura.numero_comprobante || factura.numero || `Factura #${factura.id}`}</div>
                            <div className="text-xs text-slate-500">{factura.cliente_nombre || ""}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cliente */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                </div>
                {form.id_factura_ref === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">
                    El cliente se cargará automáticamente al seleccionar una factura referenciada
                  </div>
                ) : form.id_cliente > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                    <span className="font-medium text-slate-700">{getClienteLabel(form.id_cliente)}</span>
                    <span className="text-xs text-slate-400">· {clientes.find((c) => c.id === form.id_cliente)?.identificacion || ""}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                    <span className="font-medium text-slate-700">Consumidor final</span>
                  </div>
                )}
              </div>

              {/* Motivos e Impuesto */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Motivos</h3>
                  </div>
                  {form.id_factura_ref > 0 && (
                    <Button type="button" variant="secondary" onClick={addMotivo} className="h-9 px-3">
                      <PlusCircle className="mr-1.5 h-4 w-4" /> Agregar
                    </Button>
                  )}
                </div>
                {form.id_factura_ref > 0 ? (
                  <div className="space-y-3">
                    {form.motivos.map((item, index) => (
                      <div key={`motivo-${index}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start">
                        <div className="flex-1 min-w-0">
                          <Field label="Razón" htmlFor={`razon-${index}`}>
                            <div className="relative">
                              <Input 
                                id={`razon-${index}`} 
                                value={item.razon} 
                                onChange={(event) => updateMotivo(index, "razon", event.target.value.slice(0, 300))} 
                                className="bg-white shadow-none pr-14" 
                              />
                              <span className="absolute right-2 bottom-1/2 translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
                                {item.razon.length}/300
                              </span>
                            </div>
                          </Field>
                        </div>
                        <div className="w-32 shrink-0">
                          <Field label="Valor" htmlFor={`valor-${index}`}>
                            <Input id={`valor-${index}`} type="text" inputMode="decimal" value={motivoValorStrs[index] ?? (item.valor || "")} onChange={(event) => {
                              const raw = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                              const finalVal = raw.includes(".") ? raw.slice(0, raw.indexOf(".") + 3) : raw;
                              const num = parseFloat(finalVal);
                              setMotivoValorStrs((prev) => { const n = [...prev]; n[index] = finalVal; return n; });
                              updateMotivo(index, "valor", !isNaN(num) && num >= 0 ? Math.round(num * 100) / 100 : 0);
                            }} className="bg-white shadow-none h-8 text-xs text-right" placeholder="0.00" />
                          </Field>
                        </div>
                        {index === 0 && (
                          <div className="w-48 shrink-0">
                            <Field label="IVA" htmlFor="id_iva_debit">
                              <SelectPrimitive.Root value={form.codigo_iva || undefined} onValueChange={(val) => {
                                const ivaSel = codigosIva.find((i) => i.codigo === val);
                                updateField("codigo_iva", val);
                                updateField("porcentaje_iva", ivaSel?.porcentaje ?? 0);
                              }}>
                                <SelectPrimitive.Trigger className="inline-flex h-9 w-full items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition-all hover:bg-slate-50 focus:border-sky-400 focus:ring-2 focus:ring-sky-200">
                                  <SelectPrimitive.Value placeholder="IVA..." />
                                  <SelectPrimitive.Icon><ChevronDown size={12} className="text-slate-400" /></SelectPrimitive.Icon>
                                </SelectPrimitive.Trigger>
                                <SelectPrimitive.Portal>
                                  <SelectPrimitive.Content className="z-50 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                                    <SelectPrimitive.Viewport className="p-1">
                                      {codigosIva.map((ivaSel) => (
                                        <SelectPrimitive.Item key={ivaSel.id} value={ivaSel.codigo} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                          <SelectPrimitive.ItemText>{ivaSel.nombre} ({ivaSel.porcentaje}%)</SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                      ))}
                                    </SelectPrimitive.Viewport>
                                  </SelectPrimitive.Content>
                                </SelectPrimitive.Portal>
                              </SelectPrimitive.Root>
                            </Field>
                          </div>
                        )}
                        <div className="pt-6">
                            <button type="button" onClick={() => removeMotivo(index)} disabled={form.motivos.length === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50" title="Eliminar">
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-400">
                    Selecciona una factura referenciada para agregar motivos.
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 desktop:sticky desktop:top-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Totales</h4>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Subtotal débito:</span>
                  <span className="font-medium text-slate-800">{formatMoney(totales.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{form.porcentaje_iva > 0 ? `IVA (${form.porcentaje_iva}%):` : "IVA:"}</span>
                  <span className="font-medium text-slate-800">{formatMoney(totales.iva)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total débito:</span>
                  <span className="text-xl font-extrabold text-sky-700">{formatMoney(totales.total)}</span>
                </div>
                {parseFloat(montoStr || "0") > 0 && (
                  <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-dashed border-slate-200">
                    <span>Nuevo total a pagar (factura + débito):</span>
                    <span className="font-semibold text-slate-700">{formatMoney((parseFloat(montoStr || "0") || 0) + totales.total)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">!</span>
                <p className="text-xs text-amber-800">
                  <span className="font-semibold">Normativa SRI:</span> El Servicio de Rentas Internas (SRI) de Ecuador no permite emitir notas de débito para facturas emitidas a Consumidor Final. Selecciona una factura con cliente registrado.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" disabled={saving} className="h-10 w-full">
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear nota de débito"}
                </Button>
              </div>
            </aside>
          </div>
        </motion.form>

      </motion.section>
      ) : (
        <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-4"
    >
      {/* Toolbar Principal */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda global y Filtros */}
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar nota..."
              className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white shadow-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all hover:bg-slate-50/50"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
          
          {/* Botón Filtros */}
          <Button 
            variant="secondary" 
            className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100 hover:bg-slate-200" : "bg-white hover:bg-slate-50"}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <ListFilter size={15} className="mr-1.5" />
            {showFilters ? "Ocultar filtros" : "Filtros"}
          </Button>
        </div>

        {!readOnly && (
          <div className="ml-auto">
            <Button onClick={openCreate} disabled={loadingCatalogs} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" />
              Nueva nota
            </Button>
          </div>
        )}
      </div>

      {/* Panel de Filtros Expandible */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
          >
          <div className="text-xs font-medium text-slate-500 mr-1">Filtrar por:</div>
          
          {/* Filtro estado */}
          <SelectPrimitive.Root value={filter} onValueChange={(val) => setFilter(val as EstadoFiltro)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none transition-all hover:bg-slate-50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 data-[state=open]:border-sky-400 data-[state=open]:ring-2 data-[state=open]:ring-sky-200">
              <SelectPrimitive.Value placeholder="Todos los estados" />
              <SelectPrimitive.Icon>
                <ChevronDown size={14} className="text-slate-400" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="relative z-50 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  {estadoFilters.map((estado) => (
                    <SelectPrimitive.Item key={estado} value={estado} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                      <SelectPrimitive.ItemText>{estado === "TODOS" ? "Todos los estados" : estado.charAt(0) + estado.slice(1).toLowerCase()}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>

          {/* Ordenar por */}
          <SelectPrimitive.Root value={sorting[0]?.id || "none"} onValueChange={(val) => {
            setSorting(val !== "none" ? [{ id: val, desc: false }] : []);
          }}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none transition-all hover:bg-slate-50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 data-[state=open]:border-sky-400 data-[state=open]:ring-2 data-[state=open]:ring-sky-200">
              <div className="flex items-center gap-2 text-slate-600">
                <SelectPrimitive.Value placeholder="Ordenar por..." />
              </div>
              <SelectPrimitive.Icon>
                <ChevronDown size={14} className="text-slate-400" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="relative z-50 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="none" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Ordenar por...</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="numero" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Nota</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="cliente_nombre" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Cliente</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando notas de débito" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay notas para este filtro.</p>
          {!readOnly && (
            <Button onClick={openCreate} disabled={loadingCatalogs} className="mt-3 h-9 shadow-none">
              <Plus size={15} className="mr-1.5" /> Crear nota
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 whitespace-nowrap text-xs text-slate-500"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-50/60 transition-colors${row.original.estado?.toUpperCase() === "ANULADA" ? " bg-slate-50" : ""}`}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 align-top">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Filas:</span>
              <SelectPrimitive.Root value={table.getState().pagination.pageSize.toString()} onValueChange={(val) => table.setPageSize(Number(val))}>
                <SelectPrimitive.Trigger className="inline-flex h-7 min-w-[60px] items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-none transition-all hover:bg-slate-50 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200">
                  <SelectPrimitive.Value />
                  <SelectPrimitive.Icon>
                    <ChevronDown size={12} className="text-slate-400" />
                  </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                  <SelectPrimitive.Content className="relative z-50 min-w-[60px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2" position="popper" sideOffset={4}>
                    <SelectPrimitive.Viewport className="p-1">
                      {[10, 20, 50].map((pageSize) => (
                        <SelectPrimitive.Item key={pageSize} value={pageSize.toString()} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                          <SelectPrimitive.ItemText>{pageSize}</SelectPrimitive.ItemText>
                        </SelectPrimitive.Item>
                      ))}
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              </SelectPrimitive.Root>
              <span className="text-slate-300 ml-1">·</span>
              <span className="tabular-nums font-medium text-slate-600">
                Total: {table.getFilteredRowModel().rows.length} registros
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2 text-xs text-slate-500 font-medium tabular-nums">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
            />
          </Dialog.Overlay>
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
            >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Eye className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Detalle de nota de débito
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la nota seleccionada.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 outline-none"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {detail ? (
                <>
                  {detail.estado?.toUpperCase() === "ANULADA" && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <X className="h-4 w-4 text-amber-600 shrink-0" />
                      <p className="text-xs font-semibold text-amber-800">
                        Este documento fue marcado como <strong>Anulado</strong> y no puede ser modificado.
                      </p>
                    </div>
                  )}
                  {/* SECCIÓN: Información general */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-4">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Nota</div>
                        <div className="font-semibold text-slate-800">{detail.numero || detail.id || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Fecha</div>
                        <div className="text-slate-800">{detail.fecha_emision || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Estado</div>
                        <div className="text-slate-800">{detail.estado || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Motivo</div>
                        <div className="text-slate-800">{detail.motivo || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Cliente */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <div className="text-sm font-medium text-slate-800">
                        {getClienteLabel(detail.id_cliente, detail.cliente_nombre)}
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Motivos */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Motivos</h3>
                    </div>
                    {detail.motivos?.length ? (
                      <div className="space-y-2">
                        {detail.motivos.map((item, idx) => (
                          <div key={`motivo-${idx}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Razón</div>
                              <div className="text-sm font-medium text-slate-800">{item.razon || "-"}</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Valor</div>
                              <div className="text-sm font-medium text-slate-800">${item.valor?.toFixed(2) || "0.00"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Sin motivos.</p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end pt-2 gap-2">
                    {detail?.estado?.toUpperCase() === "AUTORIZADO" && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setDetailOpen(false);
                          openEmailDialog(detail);
                        }}
                        className="h-10 px-4 gap-2"
                      >
                        <Mail size={14} />
                        Enviar por correo
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      type="button" 
                      onClick={() => setDetailOpen(false)}
                      className="h-10 px-4"
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
              ) : (
                <Loader label="Cargando detalle" className="mt-4 min-h-[100px]" />
              )}
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
            />
          </Dialog.Overlay>
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
            >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Mail className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Enviar nota de débito por correo
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Ingresa el correo electrónico del destinatario.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 outline-none"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Destinatario</h3>
                </div>
                <div className="rounded-lg bg-white/80 px-3 py-2">
                  <dt className="text-xs font-semibold text-slate-500">Cliente</dt>
                  <dd className="mt-1 text-sm font-semibold text-slate-800">
                    {emailNota ? (clientes.find((c) => c.id === emailNota.id_cliente)?.razon_social || emailNota.cliente_nombre || "Cliente") : "-"}
                  </dd>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email-destino" className="text-xs font-semibold text-slate-500">
                    Correo de destino
                  </label>
                  <input
                    id="email-destino"
                    type="email"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    placeholder="correo@ejemplo.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendEmail(); }}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <Button variant="ghost" type="button" onClick={() => setEmailDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSendEmail} disabled={emailSending}>
                {emailSending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-1.5" />
                ) : (
                  <Send size={14} className="mr-1.5" />
                )}
                {emailSending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
      )}

      <Dialog.Root open={successDialogOpen} onOpenChange={(open) => { if (!open) { setSuccessDialogOpen(false); } }}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
            />
          </Dialog.Overlay>
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.24, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-7 w-7 text-emerald-600" />
                </div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  ¡Nota de débito guardada con éxito!
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-slate-500 leading-relaxed">
                  La nota de débito se ha guardado como borrador. ¿Qué deseas hacer ahora?
                </Dialog.Description>
              </div>

              <div className="px-6 pb-6 space-y-2">
                <Button
                  type="button"
                  className="h-10 w-full"
                  onClick={() => {
                    setSuccessDialogOpen(false);
                    if (savedNota) emitirNota(savedNota);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Emitir al SRI ahora
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 w-full"
                  onClick={() => {
                    if (savedNota) window.open(`/api/notas-debito/${savedNota.id}/recibo`, '_blank');
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Recibo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 w-full"
                  onClick={() => {
                    if (savedNota) window.open(`/api/notas-debito/${savedNota.id}/pdf`, '_blank');
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Descargar PDF
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 w-full"
                  onClick={() => {
                    setSuccessDialogOpen(false);
                    if (savedNota) {
                      setSavedNota(null);
                      openEmailDialog(savedNota);
                    }
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Enviar por correo
                </Button>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 flex-1 text-slate-500 hover:text-slate-700"
                    onClick={goToList}
                  >
                    Ir al listado
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 flex-1 text-slate-500 hover:text-slate-700"
                    onClick={openCreateFromSuccess}
                  >
                    Crear otra nota de débito
                  </Button>
                </div>
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
