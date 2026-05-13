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
import { Edit, Eye, PlusCircle, Power, Send, Trash2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, Printer, Trash, Package, User, Calendar, FileCheck, Tag, Receipt, FileX } from "lucide-react";
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
import { Loader } from "@/src/components/ui/loader";

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

interface DebitNotesPanelProps {
  showPanel?: boolean;
}

export function DebitNotesPanel({ showPanel = true }: DebitNotesPanelProps) {
  const [notas, setNotas] = useState<NotaDebitoItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<NotaDebitoItem | null>(null);
  const [detail, setDetail] = useState<NotaDebitoItem | null>(null);
  const [form, setForm] = useState<NotaDebitoFormState>(initialForm);
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
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-debito/${row.original.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/notas-debito/${row.original.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
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
    setForm({
      ...initialForm,
      id_punto_emision: puntos[0]?.id ?? 0,
      id_cliente: clientes[0]?.id ?? 0,
      id_factura_ref: facturas[0]?.id ?? 0,
      fecha_emision: new Date().toISOString().slice(0, 10),
      motivos: [initialMotivo()],
    });
    setModalOpen(true);
  };

  const openEdit = async (nota: NotaDebitoItem) => {
    try {
      const data = await debitNoteService.getNota(nota.id);
      setEditing(data);
      setForm(toNotaDebitoFormState(data));
      setModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar la nota.";
      toast.error(message);
    }
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
  };

  const removeMotivo = (index: number) => {
    setForm((prev) => ({
      ...prev,
      motivos: prev.motivos.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = () => {
    return {
      id_punto_emision: form.id_punto_emision,
      id_factura_ref: form.id_factura_ref,
      motivo: form.motivo,
      id_cliente: form.use_manual_cliente ? undefined : form.id_cliente,
      cli_identificacion: form.use_manual_cliente ? form.cli_identificacion : undefined,
      cli_razon_social: form.use_manual_cliente ? form.cli_razon_social : undefined,
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
      toast.warning("Ingresa el motivo principal.");
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
      } else {
        await debitNoteService.createNota(payload);
        toast.success("Nota de débito creada.");
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

  const toggleEstado = async (nota: NotaDebitoItem) => {
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

  const getClienteLabel = (clienteId?: number, fallback?: string) => {
    if (!clienteId) return fallback || "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || fallback || "-";
  };

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  const getFacturaLabel = (facturaId?: number) => {
    if (!facturaId) return "-";
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
        <Loader label="Cargando notas de débito" className="mt-8" />
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
                    {editing ? "Editar nota de débito" : "Crear nueva nota de débito"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza la información de la nota de débito."
                      : "Registra una nueva nota de débito con los datos del cliente y la factura referenciada."}
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

                  <Field label="Motivo principal *" htmlFor="motivo">
                    <Input
                      id="motivo"
                      value={form.motivo}
                      onChange={(event) => updateField("motivo", event.target.value)}
                      placeholder="Ej: Intereses por mora"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Factura referenciada */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Factura referenciada</h3>
                </div>

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

              {/* SECCIÓN: Impuesto */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Impuesto</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Código IVA" htmlFor="codigo_iva">
                    <Input
                      id="codigo_iva"
                      value={form.codigo_iva}
                      onChange={(event) => updateField("codigo_iva", event.target.value)}
                      className="bg-white shadow-none"
                    />
                  </Field>
                  <Field label="Porcentaje IVA" htmlFor="porcentaje_iva">
                    <Input
                      id="porcentaje_iva"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.porcentaje_iva}
                      onChange={(event) => updateField("porcentaje_iva", Number(event.target.value))}
                      className="bg-white shadow-none"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Motivos */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Motivos</h3>
                  </div>
                  <Button type="button" variant="secondary" onClick={addMotivo} className="h-9 px-3">
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Agregar motivo
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.motivos.map((item, index) => (
                    <div key={`motivo-${index}`} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start">
                      <div className="flex-1 min-w-0">
                        <Field label="Razón" htmlFor={`razon-${index}`}>
                          <Input
                            id={`razon-${index}`}
                            value={item.razon}
                            onChange={(event) => updateMotivo(index, "razon", event.target.value)}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                      <div className="w-32 shrink-0">
                        <Field label="Valor" htmlFor={`valor-${index}`}>
                          <Input
                            id={`valor-${index}`}
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.valor}
                            onChange={(event) => updateMotivo(index, "valor", Number(event.target.value))}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                      <div className="pt-6">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeMotivo(index)}
                          disabled={form.motivos.length === 1}
                          className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
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
                    Detalle de nota de débito
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
