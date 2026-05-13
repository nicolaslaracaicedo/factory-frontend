"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
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
import { CheckCircle2, ChevronLeft, ChevronRight, Copy, Edit, Eye, PlusCircle, Power, RefreshCw, Search, Send, Trash2, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, Printer, Trash, Package, User, Calendar, FileCheck, Tag, Receipt, FileX } from "lucide-react";
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
import { Loader } from "@/src/components/ui/loader";

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
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);

  function SortIcon({ column }: { column: any }) {
    const sorted = column.getIsSorted();
    if (sorted === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (sorted === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const columns = useMemo<ColumnDef<NotaCreditoItem>[]>(() => [
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
          <div className="font-semibold text-slate-900">{row.original.numero || `Nota #${row.original.id}`}</div>
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
          <div className="text-slate-700">{getFacturaLabel(row.original.id_factura_ref, row.original.factura_ref_numero)}</div>
          <div className="text-slate-500 text-xs">{row.original.factura_ref_fecha || "-"}</div>
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getEstadoColor(row.original.estado)}`}>
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
              {row.original.estado?.toUpperCase() === "BORRADOR" && (
                <>
                  <DropdownMenuItem onClick={() => openEdit(row.original)}>
                    <Edit size={14} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteNota(row.original)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                    <Trash2 size={14} className="mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
              {row.original.estado?.toUpperCase() !== "AUTORIZADO" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => emitirNota(row.original)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                    <Send size={14} className="mr-2" />
                    Emitir
                  </DropdownMenuItem>
                </>
              )}
              {row.original.estado?.toUpperCase() === "AUTORIZADO" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-credito/${row.original.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-credito/${row.original.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
                    <Printer size={14} className="mr-2" />
                    Imprimir Recibo
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

        {/* Botón nuevo — empujado al extremo derecho */}
        <div className="ml-auto">
          <Button onClick={openCreate} disabled={loadingCatalogs} className="h-9 shadow-none whitespace-nowrap">
            <Plus size={15} className="mr-1.5" />
            Nueva nota
          </Button>
        </div>
      </div>

      {/* Panel de Filtros Expandible */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg animate-in slide-in-from-top-2 fade-in duration-200">
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
                      <SelectPrimitive.ItemText>{estado === "TODOS" ? "Todos los estados" : estado}</SelectPrimitive.ItemText>
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
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando notas de crédito" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay notas para este filtro.</p>
          <Button onClick={openCreate} disabled={loadingCatalogs} className="mt-3 h-9 shadow-none">
            <Plus size={15} className="mr-1.5" /> Crear nota
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden">
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
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
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
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <FileX className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar nota de crédito" : "Crear nueva nota de crédito"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza la información de la nota de crédito."
                      : "Registra una nueva nota de crédito con los datos de la factura referenciada."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
              {/* SECCIÓN: Información general */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Punto de emisión *" htmlFor="id_punto_emision">
                    <SelectPrimitive.Root
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()}
                      onValueChange={(val) => updateField("id_punto_emision", Number(val))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger
                        id="id_punto_emision"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un punto de emisión..."} />
                        <SelectPrimitive.Icon>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content
                          className="z-50 min-w-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <SelectPrimitive.Viewport className="p-1">
                            {puntos.map((punto) => (
                              <SelectPrimitive.Item
                                key={punto.id}
                                value={punto.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{punto.codigo} - {punto.descripcion}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Fecha de emisión *" htmlFor="fecha_emision">
                    <Input
                      id="fecha_emision"
                      type="date"
                      value={form.fecha_emision}
                      onChange={(event) => updateField("fecha_emision", event.target.value)}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Motivo *" htmlFor="motivo">
                    <Input
                      id="motivo"
                      value={form.motivo}
                      onChange={(event) => updateField("motivo", event.target.value)}
                      placeholder="Ej: Anulación de factura"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Factura referenciada */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Factura referenciada</h3>
                  </div>
                  <SelectPrimitive.Root
                    value={form.ref_mode}
                    onValueChange={(val) => updateField("ref_mode", val as "INTERNA" | "MANUAL")}
                  >
                    <SelectPrimitive.Trigger className="inline-flex h-9 w-36 items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                      <SelectPrimitive.Value />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="z-50 min-w-[140px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectPrimitive.Viewport className="p-1">
                          <SelectPrimitive.Item value="INTERNA" className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                            <SelectPrimitive.ItemText>Interna</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                          <SelectPrimitive.Item value="MANUAL" className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                            <SelectPrimitive.ItemText>Manual</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </div>

                {form.ref_mode === "INTERNA" ? (
                  <div>
                    <Field label="Factura *" htmlFor="id_factura_ref">
                      <SelectPrimitive.Root
                        value={form.id_factura_ref === 0 ? undefined : form.id_factura_ref.toString()}
                        onValueChange={(val) => updateField("id_factura_ref", Number(val))}
                        disabled={loadingCatalogs}
                      >
                        <SelectPrimitive.Trigger
                          id="id_factura_ref"
                          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                        >
                          <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona una factura..."} />
                          <SelectPrimitive.Icon>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content
                            className="z-50 min-w-[320px] max-h-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                              {facturas.map((factura) => (
                                <SelectPrimitive.Item
                                  key={factura.id}
                                  value={factura.id.toString()}
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                >
                                  <SelectPrimitive.ItemText>{factura.numero || `Factura #${factura.id}`}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Número *" htmlFor="factura_ref_numero">
                      <Input
                        id="factura_ref_numero"
                        value={form.factura_ref_numero}
                        onChange={(event) => updateField("factura_ref_numero", event.target.value)}
                        className="bg-white shadow-none"
                      />
                    </Field>
                    <Field label="Fecha *" htmlFor="factura_ref_fecha">
                      <Input
                        id="factura_ref_fecha"
                        type="date"
                        value={form.factura_ref_fecha}
                        onChange={(event) => updateField("factura_ref_fecha", event.target.value)}
                        className="bg-white shadow-none"
                      />
                    </Field>
                    <Field label="Autorización *" htmlFor="factura_ref_autorizacion">
                      <Input
                        id="factura_ref_autorizacion"
                        value={form.factura_ref_autorizacion}
                        onChange={(event) => updateField("factura_ref_autorizacion", event.target.value)}
                        className="bg-white shadow-none"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* SECCIÓN: Cliente */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                  </div>
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
                  <div>
                    <Field label="Cliente *" htmlFor="id_cliente">
                      <SelectPrimitive.Root
                        value={form.id_cliente === 0 ? undefined : form.id_cliente.toString()}
                        onValueChange={(val) => updateField("id_cliente", Number(val))}
                        disabled={loadingCatalogs}
                      >
                        <SelectPrimitive.Trigger
                          id="id_cliente"
                          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                        >
                          <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un cliente..."} />
                          <SelectPrimitive.Icon>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content
                            className="z-50 min-w-[320px] max-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectPrimitive.Viewport className="p-1 max-h-60 overflow-y-auto">
                              {clientes.map((cliente) => (
                                <SelectPrimitive.Item
                                  key={cliente.id}
                                  value={cliente.id.toString()}
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                >
                                  <SelectPrimitive.ItemText>{cliente.razon_social}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Identificación *" htmlFor="cli_identificacion">
                      <Input
                        id="cli_identificacion"
                        value={form.cli_identificacion}
                        onChange={(event) => updateField("cli_identificacion", event.target.value)}
                        className="bg-white shadow-none"
                      />
                    </Field>
                    <Field label="Razón social *" htmlFor="cli_razon_social">
                      <Input
                        id="cli_razon_social"
                        value={form.cli_razon_social}
                        onChange={(event) => updateField("cli_razon_social", event.target.value)}
                        className="bg-white shadow-none"
                      />
                    </Field>
                  </div>
                )}
              </div>

              {/* SECCIÓN: Detalles */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Detalles</h3>
                  </div>
                  <Button type="button" variant="secondary" onClick={addDetail} className="h-9 px-3">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Agregar detalle
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.detalles.map((detalle, index) => (
                    <div key={`detalle-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">Detalle #{index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDetail(index)}
                          disabled={form.detalles.length === 1}
                          className="h-9 px-3 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash className="mr-1.5 h-4 w-4" />
                          Quitar
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <Field label="Código" htmlFor={`detalle-${index}-codigo`}>
                          <Input
                            id={`detalle-${index}-codigo`}
                            value={detalle.codigo}
                            onChange={(event) => updateDetail(index, "codigo", event.target.value)}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Descripción *" htmlFor={`detalle-${index}-descripcion`}>
                          <Input
                            id={`detalle-${index}-descripcion`}
                            value={detalle.descripcion}
                            onChange={(event) => updateDetail(index, "descripcion", event.target.value)}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Cantidad" htmlFor={`detalle-${index}-cantidad`}>
                          <Input
                            id={`detalle-${index}-cantidad`}
                            type="number"
                            min={1}
                            value={detalle.cantidad}
                            onChange={(event) => updateDetail(index, "cantidad", Number(event.target.value))}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Precio unitario" htmlFor={`detalle-${index}-precio`}>
                          <Input
                            id={`detalle-${index}-precio`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.precio_unitario}
                            onChange={(event) => updateDetail(index, "precio_unitario", Number(event.target.value))}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Descuento" htmlFor={`detalle-${index}-descuento`}>
                          <Input
                            id={`detalle-${index}-descuento`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.descuento}
                            onChange={(event) => updateDetail(index, "descuento", Number(event.target.value))}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Código IVA" htmlFor={`detalle-${index}-codigoiva`}>
                          <Input
                            id={`detalle-${index}-codigoiva`}
                            value={detalle.codigo_iva}
                            onChange={(event) => updateDetail(index, "codigo_iva", event.target.value)}
                            className="bg-white shadow-none"
                          />
                        </Field>
                        <Field label="Porcentaje IVA" htmlFor={`detalle-${index}-porcentajeiva`}>
                          <Input
                            id={`detalle-${index}-porcentajeiva`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={detalle.porcentaje_iva}
                            onChange={(event) => updateDetail(index, "porcentaje_iva", Number(event.target.value))}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} className="h-10 px-4">
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving} className="h-10 px-4">
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Eye className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Detalle de nota de crédito
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la nota seleccionada.
                  </Dialog.Description>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {detail ? (
                <>
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

                  {/* Clave de acceso referenciada */}
                  {detail.factura_ref_autorizacion && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-800">Clave de acceso referenciada</span>
                        <Button
                          variant="secondary"
                          onClick={() => copyToClipboard(detail.factura_ref_autorizacion!)}
                          className="h-8 px-3 text-xs"
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Copiar
                        </Button>
                      </div>
                      <p className="break-all font-mono text-xs text-slate-600">
                        {detail.factura_ref_autorizacion}
                      </p>
                    </div>
                  )}

                  {/* SECCIÓN: Detalles */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Detalles</h3>
                    </div>
                    {detail.detalles?.length ? (
                      <div className="space-y-2">
                        {detail.detalles.map((item, idx) => (
                          <div key={`detalle-${idx}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Producto</div>
                              <div className="text-sm font-medium text-slate-800">{item.descripcion || item.codigo || "-"}</div>
                            </div>
                            <div className="w-16 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Cant.</div>
                              <div className="text-sm font-medium text-slate-800">{item.cantidad}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Sin detalles.</p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end pt-2">
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
