"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, Eye, Plus, PlusCircle, Power, Send, Trash2, Search, ChevronLeft, ChevronRight, FileText, ChevronDown, ListFilter, MoreVertical, ArrowUp, ArrowDown, ChevronsUpDown, X, Receipt, Radio, User, FileCheck, Calendar, Tag, DollarSign, Trash } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import type {
  RetencionFormState,
  RetencionItem,
  RetencionDetalleDraft,
} from "@/src/modules/retenciones/types/retenciones.types";
import { toRetencionFormState } from "@/src/modules/retenciones/utils/retenciones-payload.utils";
import { retencionesService } from "@/src/modules/retenciones/services/retenciones.service";
import { providerService } from "@/src/modules/providers/services/provider.service";
import type { Proveedor } from "@/src/modules/providers/types/provider.types";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { invoiceService } from "@/src/modules/invoices/services/invoice.service";
import type { FacturaItem } from "@/src/modules/invoices/types/invoice.types";
import { Loader } from "@/src/components/ui/loader";

const initialDetalle = (): RetencionDetalleDraft => ({
  tipo: "1",
  codigo: "",
  descripcion: "",
  base_imponible: 0,
  porcentaje: 0,
});

const initialForm: RetencionFormState = {
  id_punto_emision: 0,
  id_proveedor: 0,
  id_factura_ref: 0,
  fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
  detalles: [initialDetalle()],
};

const tipoRetencionOptions = [
  { value: "1", label: "Retención en la fuente (IRT)" },
  { value: "2", label: "Retención IVA" },
];

const codigosIRTEcuador = [
  { value: "303", label: "303 - Honorarios profesionales" },
  { value: "304", label: "304 - Servicios predomina intelecto" },
  { value: "307", label: "307 - Servicios predomina mano de obra" },
  { value: "308", label: "308 - Servicios entre soc. relacionadas" },
  { value: "309", label: "309 - Servicios de publicidad y com." },
  { value: "310", label: "310 - Servicios de transporte" },
  { value: "311", label: "311 - Servicios de hotelería" },
  { value: "312", label: "312 - Servicios de restaurantes" },
  { value: "320", label: "320 - Arrendamiento de inmuebles" },
  { value: "322", label: "322 - Seguros y reaseguros" },
  { value: "332", label: "332 - Venta de bienes inmuebles" },
  { value: "332A", label: "332A - Venta acciones o derechos" },
  { value: "346", label: "346 - Otras compras a persona natural" },
];

const codigosIVAEcuador = [
  { value: "721", label: "721 - Retención IVA 30%" },
  { value: "723", label: "723 - Retención IVA 100%" },
  { value: "725", label: "725 - Retención IVA 10%" },
  { value: "726", label: "726 - Retención IVA 20%" },
  { value: "727", label: "727 - Retención IVA 50%" },
  { value: "728", label: "728 - Retención IVA 70%" },
];

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

interface RetencionesPanelProps {
  showPanel?: boolean;
}

export function RetencionesPanel({ showPanel = true }: RetencionesPanelProps) {
  const [retenciones, setRetenciones] = useState<RetencionItem[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<RetencionItem | null>(null);
  const [detail, setDetail] = useState<RetencionItem | null>(null);
  const [form, setForm] = useState<RetencionFormState>(initialForm);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const filteredByEstado = useMemo(() => {
    if (filter === "TODOS") return retenciones;
    return retenciones.filter((r) => (r.estado ?? "").toUpperCase() === filter);
  }, [retenciones, filter]);

  const columns = useMemo<ColumnDef<RetencionItem>[]>(() => [
    {
      accessorKey: "numero",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Número <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-semibold text-slate-900">{row.original.numero || "-"}</span>,
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Estado <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoColor(row.original.estado)}`}>
          {row.original.estado || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "proveedor_nombre",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Proveedor <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-800">{row.original.proveedor_nombre || "-"}</div>
          <div className="text-xs text-slate-500">{row.original.proveedor_identificacion || ""}</div>
        </div>
      ),
    },
    {
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha emisión <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_emision || "-"}</span>,
    },
    {
      accessorKey: "id_factura_ref",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Factura ref. <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{getFacturaLabel(row.original.id_factura_ref || 0)}</span>,
    },
    {
      accessorKey: "total_retenido",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-800">${(row.original.total_retenido || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                  <MoreVertical size={16} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetail(r)}><Eye size={14} className="mr-2" /> Ver detalle</DropdownMenuItem>
                {canEmitir(r) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleEmitir(r)} className="text-emerald-700 focus:text-emerald-700"><Send size={14} className="mr-2" /> Emitir al SRI</DropdownMenuItem></>)}
                {canEdit(r) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openEdit(r)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem></>)}
                {canDelete(r) && (<DropdownMenuItem onClick={() => handleDelete(r)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleEstado(r)}><Power size={14} className="mr-2" /> Cambiar estado</DropdownMenuItem>
                {r.estado?.toUpperCase() === "AUTORIZADO" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(`/api/retenciones/${r.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                      <FileText size={14} className="mr-2" />
                      Descargar PDF
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [facturas]);

  const table = useReactTable({
    data: filteredByEstado,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });



  const loadRetenciones = async () => {
    setLoading(true);
    try {
      const data = await retencionesService.listRetenciones();
      setRetenciones(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar retenciones");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const [provData, puntosData, facturasData] = await Promise.all([
        providerService.listProveedores(),
        emissionPointService.listPuntos(),
        invoiceService.listFacturas(),
      ]);
      setProveedores(provData);
      setPuntos(puntosData);
      setFacturas(facturasData);
    } catch {
      toast.error("Error al cargar catálogos");
    } finally {
      setLoadingCatalogs(false);
    }
  };

  useEffect(() => {
    void loadRetenciones();
    void loadCatalogs();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (retencion: RetencionItem) => {
    if (!canEdit(retencion)) {
      toast.error("Solo se pueden editar retenciones en estado BORRADOR o RECHAZADA");
      return;
    }
    setEditing(retencion);
    setForm(toRetencionFormState(retencion));
    setModalOpen(true);
  };

  const openDetail = async (retencion: RetencionItem) => {
    try {
      const full = await retencionesService.getRetencion(retencion.id);
      setDetail(full);
      setDetailOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar detalle");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    if (!form.id_punto_emision || !form.id_proveedor || !form.id_factura_ref) {
      toast.error("Complete todos los campos obligatorios");
      return;
    }
    if (form.detalles.length === 0 || form.detalles.some(d => !d.codigo || d.base_imponible <= 0)) {
      toast.error("Agregue al menos un detalle válido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id_punto_emision: form.id_punto_emision,
        id_proveedor: form.id_proveedor,
        id_factura_ref: form.id_factura_ref,
        fecha_emision: form.fecha_emision,
        detalles: form.detalles.map(d => ({
          tipo: d.tipo,
          codigo: d.codigo,
          descripcion: d.descripcion,
          base_imponible: d.base_imponible,
          porcentaje: d.porcentaje,
        })),
      };

      if (editing) {
        await retencionesService.updateRetencion(editing.id, payload);
        toast.success("Retención actualizada");
      } else {
        await retencionesService.createRetencion(payload);
        toast.success("Retención creada");
      }
      closeModal();
      await loadRetenciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (retencion: RetencionItem) => {
    if (!window.confirm("¿Eliminar esta retención? Solo se pueden eliminar borradores.")) return;
    try {
      await retencionesService.deleteRetencion(retencion.id);
      toast.success("Retención eliminada");
      await loadRetenciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleEstado = async (retencion: RetencionItem) => {
    try {
      await retencionesService.toggleEstado(retencion.id);
      toast.success("Estado actualizado");
      await loadRetenciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleEmitir = async (retencion: RetencionItem) => {
    if (!window.confirm("¿Emitir esta retención al SRI?")) return;
    try {
      await retencionesService.emitirRetencion(retencion.id);
      toast.success("Retención emitida exitosamente");
      await loadRetenciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al emitir");
    }
  };

  const canEdit = (retencion: RetencionItem) => {
    const estado = (retencion.estado ?? "").toUpperCase();
    return estado === "BORRADOR" || estado === "RECHAZADA";
  };

  const canDelete = (retencion: RetencionItem) => {
    return (retencion.estado ?? "").toUpperCase() === "BORRADOR";
  };

  const canEmitir = (retencion: RetencionItem) => {
    const estado = (retencion.estado ?? "").toUpperCase();
    return estado === "BORRADOR" || estado === "RECHAZADA";
  };

  const getPuntoLabel = (id: number) => {
    const p = puntos.find((x) => x.id === id);
    return p ? `${p.codigo} - ${p.descripcion}` : `ID ${id}`;
  };

  const getProveedorLabel = (id: number) => {
    const p = proveedores.find((x) => x.id === id);
    return p ? `${p.razon_social}` : `ID ${id}`;
  };

  const getFacturaLabel = (id: number) => {
    const f = facturas.find((x) => x.id === id);
    return f ? `${f.numero ?? f.id}` : `ID ${id}`;
  };

  const updateDetalle = (index: number, updates: Partial<RetencionDetalleDraft>) => {
    setForm((prev) => {
      const nuevos = [...prev.detalles];
      nuevos[index] = { ...nuevos[index], ...updates };
      return { ...prev, detalles: nuevos };
    });
  };

  const removeDetalle = (index: number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
  };

  const addDetalle = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [...prev.detalles, initialDetalle()],
    }));
  };

  if (!showPanel) return null;

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar retención..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap" disabled={loadingCatalogs}>
            <Plus size={15} className="mr-1.5" /> Nueva Retención
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs font-medium text-slate-500">Filtrar por:</div>
          <SelectPrimitive.Root value={filter || "TODOS"} onValueChange={(val) => setFilter(val as EstadoFiltro)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  {estadoFilters.map((e) => (
                    <SelectPrimitive.Item key={e} value={e} className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                      <SelectPrimitive.ItemText>{e === "TODOS" ? "Todos los estados" : e.charAt(0) + e.slice(1).toLowerCase()}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      )}

      {loading ? (
        <div className="py-12"><Loader label="Cargando retenciones..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay retenciones para este filtro.</p>
          <Button className="mt-3 h-9 shadow-none" onClick={openCreate} disabled={loadingCatalogs}><Plus size={15} className="mr-1.5" /> Nueva Retención</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>{hg.headers.map((h) => <th key={h.id} className="px-4 py-3 text-xs text-slate-500">{flexRender(h.column.columnDef.header, h.getContext())}</th>)}</tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 align-top">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Filas:</span>
              <SelectPrimitive.Root value={table.getState().pagination.pageSize.toString()} onValueChange={(v) => table.setPageSize(Number(v))}>
                <SelectPrimitive.Trigger className="inline-flex h-7 min-w-[60px] items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none">
                  <SelectPrimitive.Value /><SelectPrimitive.Icon><ChevronDown size={12} className="text-slate-400" /></SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                  <SelectPrimitive.Content className="z-50 min-w-[60px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                    <SelectPrimitive.Viewport className="p-1">
                      {[10, 20, 50].map((ps) => <SelectPrimitive.Item key={ps} value={ps.toString()} className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"><SelectPrimitive.ItemText>{ps}</SelectPrimitive.ItemText></SelectPrimitive.Item>)}
                    </SelectPrimitive.Viewport>
                  </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
              </SelectPrimitive.Root>
              <span className="text-slate-300">·</span>
              <span className="font-medium text-slate-600">Total: {table.getFilteredRowModel().rows.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
              <span className="px-2 text-xs text-slate-500 font-medium">{table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Receipt className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar retención" : "Crear nueva retención"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos de la retención existente."
                      : "Registra una nueva retención completando los datos del encabezado y agregando los detalles correspondientes."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* SECCIÓN: Datos del encabezado */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos del encabezado</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Punto de emisión *" htmlFor="ret-punto">
                    <SelectPrimitive.Root 
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="ret-punto"
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
                            {puntos.map((p) => (
                              <SelectPrimitive.Item 
                                key={p.id}
                                value={p.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{p.codigo} - {p.descripcion}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Proveedor *" htmlFor="ret-proveedor">
                    <SelectPrimitive.Root 
                      value={form.id_proveedor === 0 ? undefined : form.id_proveedor.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_proveedor: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="ret-proveedor"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un proveedor..."} />
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
                            {proveedores.map((p) => (
                              <SelectPrimitive.Item 
                                key={p.id}
                                value={p.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{p.razon_social}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Factura de referencia *" htmlFor="ret-factura">
                    <SelectPrimitive.Root 
                      value={form.id_factura_ref === 0 ? undefined : form.id_factura_ref.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_factura_ref: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="ret-factura"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona una factura..."} />
                        <SelectPrimitive.Icon>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content 
                          className="z-50 min-w-[320px] max-h-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          {/* Input de búsqueda para facturas */}
                          <div className="p-2 border-b border-slate-200">
                            <input
                              type="text"
                              placeholder="Buscar factura..."
                              className="w-full h-8 px-3 text-sm rounded-md border border-slate-200 bg-slate-50 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
                              onChange={(e) => {
                                // Filtrar facturas en el viewport
                                const searchTerm = e.target.value.toLowerCase();
                                const items = document.querySelectorAll('[data-factura-item]');
                                items.forEach((item) => {
                                  const text = item.textContent?.toLowerCase() || '';
                                  if (text.includes(searchTerm)) {
                                    item.removeAttribute('hidden');
                                  } else {
                                    item.setAttribute('hidden', 'true');
                                  }
                                });
                              }}
                            />
                          </div>
                          <SelectPrimitive.Viewport className="p-1 max-h-60 overflow-y-auto">
                            {facturas.map((f) => (
                              <SelectPrimitive.Item 
                                key={f.id}
                                value={f.id.toString()}
                                data-factura-item
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{f.numero || f.id} - {f.cliente_nombre || "Sin cliente"}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Fecha de emisión *" htmlFor="ret-fecha">
                    <Input
                      id="ret-fecha"
                      type="date"
                      value={form.fecha_emision}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_emision: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Detalles de retención */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Detalles de retención</h3>
                  </div>
                  <Button type="button" variant="secondary" className="h-9 px-3" onClick={addDetalle}>
                    <PlusCircle className="mr-1.5 h-4 w-4" />
                    Agregar detalle
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.detalles.map((detalle, idx) => (
                    <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start">
                      <div className="flex-1 min-w-0">
                        <Field label="Tipo" htmlFor={`ret-tipo-${idx}`}>
                          <SelectPrimitive.Root
                            value={detalle.tipo}
                            onValueChange={(val) => updateDetalle(idx, { tipo: val })}
                          >
                            <SelectPrimitive.Trigger
                              id={`ret-tipo-${idx}`}
                              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            >
                              <SelectPrimitive.Value className="truncate" />
                              <SelectPrimitive.Icon>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              </SelectPrimitive.Icon>
                            </SelectPrimitive.Trigger>
                            <SelectPrimitive.Portal>
                              <SelectPrimitive.Content
                                className="z-50 min-w-[260px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                position="popper"
                                sideOffset={4}
                              >
                                <SelectPrimitive.Viewport className="p-1">
                                  {tipoRetencionOptions.map((opt) => (
                                    <SelectPrimitive.Item
                                      key={opt.value}
                                      value={opt.value}
                                      className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                    >
                                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                                    </SelectPrimitive.Item>
                                  ))}
                                </SelectPrimitive.Viewport>
                              </SelectPrimitive.Content>
                            </SelectPrimitive.Portal>
                          </SelectPrimitive.Root>
                        </Field>
                      </div>

                      <div className="flex-[1.5] min-w-0">
                        <Field label="Código" htmlFor={`ret-codigo-${idx}`}>
                          <SelectPrimitive.Root
                            value={detalle.codigo || undefined}
                            onValueChange={(val) => {
                              const codigo = val;
                              const descripcion = detalle.tipo === "1"
                                ? codigosIRTEcuador.find(c => c.value === codigo)?.label.split(" - ")[1] || ""
                                : codigosIVAEcuador.find(c => c.value === codigo)?.label.split(" - ")[1] || "";
                              updateDetalle(idx, { codigo, descripcion });
                            }}
                          >
                            <SelectPrimitive.Trigger
                              id={`ret-codigo-${idx}`}
                              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            >
                              <SelectPrimitive.Value placeholder="Selecciona..." className="truncate" />
                              <SelectPrimitive.Icon>
                                <ChevronDown className="h-4 w-4 text-slate-400" />
                              </SelectPrimitive.Icon>
                            </SelectPrimitive.Trigger>
                            <SelectPrimitive.Portal>
                              <SelectPrimitive.Content
                                className="z-50 min-w-[300px] max-h-60 overflow-y-auto overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                position="popper"
                                sideOffset={4}
                              >
                                <SelectPrimitive.Viewport className="p-1">
                                  {(detalle.tipo === "1" ? codigosIRTEcuador : codigosIVAEcuador).map((opt) => (
                                    <SelectPrimitive.Item
                                      key={opt.value}
                                      value={opt.value}
                                      className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                    >
                                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                                    </SelectPrimitive.Item>
                                  ))}
                                </SelectPrimitive.Viewport>
                              </SelectPrimitive.Content>
                            </SelectPrimitive.Portal>
                          </SelectPrimitive.Root>
                        </Field>
                      </div>

                      <div className="w-28 shrink-0">
                        <Field label="Base" htmlFor={`ret-base-${idx}`}>
                          <Input
                            id={`ret-base-${idx}`}
                            type="number"
                            min={0}
                            step={0.01}
                            value={detalle.base_imponible}
                            onChange={(event) => updateDetalle(idx, { base_imponible: Number(event.target.value) })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>

                      <div className="w-24 shrink-0">
                        <Field label="% Retención" htmlFor={`ret-porc-${idx}`}>
                          <Input
                            id={`ret-porc-${idx}`}
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            value={detalle.porcentaje}
                            onChange={(event) => updateDetalle(idx, { porcentaje: Number(event.target.value) })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>

                      <div className="pt-6">
                        <Button
                          variant="ghost"
                          className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeDetalle(idx)}
                          disabled={form.detalles.length === 1}
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
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={closeModal}
                  className="h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="h-10 px-4"
                >
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear retención"}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
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
                    Detalle de retención
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la retención registrada en el sistema.
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
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Número</dt>
                        <dd className="font-semibold text-slate-800">{detail.numero || "-"}</dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Estado</dt>
                        <dd>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${getEstadoColor(detail.estado)}`}>
                            {detail.estado || "N/A"}
                          </span>
                        </dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Proveedor</dt>
                        <dd className="font-medium text-slate-800">{detail.proveedor_nombre || "-"}</dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Identificación</dt>
                        <dd className="text-slate-800">{detail.proveedor_identificacion || "-"}</dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Fecha emisión</dt>
                        <dd className="text-slate-800">{detail.fecha_emision || "-"}</dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Factura ref.</dt>
                        <dd className="text-slate-800">{getFacturaLabel(detail.id_factura_ref || 0)}</dd>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <dt className="text-xs text-slate-500 mb-0.5">Punto emisión</dt>
                        <dd className="text-slate-800">{getPuntoLabel(detail.id_punto_emision || 0)}</dd>
                      </div>
                      {detail.clave_acceso && (
                        <div className="sm:col-span-2 bg-white rounded-lg p-2.5 border border-slate-200">
                          <dt className="text-xs text-slate-500 mb-0.5">Clave de acceso</dt>
                          <dd className="text-xs text-slate-800 break-all font-mono">{detail.clave_acceso}</dd>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN: Detalles de retención */}
                  {detail.detalles && detail.detalles.length > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Detalles de retención</h3>
                      </div>
                      <div className="space-y-2">
                        {detail.detalles.map((item, idx) => (
                          <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Tipo</div>
                              <div className="text-sm font-medium text-slate-800 truncate">
                                {item.tipo === "1" ? "Retención en la fuente" : "Retención IVA"}
                              </div>
                            </div>
                            <div className="flex-[1.5] min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Código</div>
                              <div className="text-sm font-medium text-slate-800">{item.codigo}</div>
                              <div className="text-xs text-slate-600 truncate">{item.descripcion}</div>
                            </div>
                            <div className="w-28 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Base</div>
                              <div className="text-sm font-medium text-slate-800">${item.base_imponible?.toFixed(2)}</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">%</div>
                              <div className="text-sm font-medium text-slate-800">{item.porcentaje}%</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Valor</div>
                              <div className="text-sm font-medium text-slate-800">
                                ${((item.base_imponible || 0) * (item.porcentaje || 0) / 100).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Loader label="Cargando detalle" className="min-h-[100px]" />
              )}

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
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
