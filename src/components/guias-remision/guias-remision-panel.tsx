"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileText,
  MapPin,
  Plus,
  Power,
  Send,
  Trash2,
  Truck,
  ChevronDown,
  ListFilter,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Search,
  X,
  FileCheck,
  Radio,
  User,
  Calendar,
  Package,
  Route,
  Trash
} from "lucide-react";
import { toast } from "sonner";
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
  GuiaFormState,
  GuiaRemisionItem,
} from "@/src/modules/guias-remision/types/guias-remision.types";
import { guiasRemisionService } from "@/src/modules/guias-remision/services/guias-remision.service";
import { toGuiaFormState } from "@/src/modules/guias-remision/utils/guias-remision-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { Loader } from "@/src/components/ui/loader";

interface GuiasRemisionPanelProps {
  showPanel?: boolean;
}

const initialFormState: GuiaFormState = {
  id_punto_emision: 0,
  fecha_emision: new Date().toISOString().split("T")[0],
  ruc_transportista: "",
  razon_social_transportista: "",
  placa: "",
  fecha_ini_transporte: "",
  fecha_fin_transporte: "",
  motivo_traslado: "Venta de mercadería",
  ruta: "",
  id_cliente: 0,
  direccion_destino: "",
  detalles: [{ id_producto: 0, codigo: "", descripcion: "", cantidad: 1 }],
};

const motivosTraslado = [
  "Venta de mercadería",
  "Consignación",
  "Devolución",
  "Importación",
  "Exportación",
  "Traslado entre establecimientos",
  "Traslado por emisor itinerante",
  "Traslado a zona primaria",
  "Venta con entrega a terceros",
  "Otros",
];

export function GuiasRemisionPanel({ showPanel = true }: GuiasRemisionPanelProps) {
  const [guias, setGuias] = useState<GuiaRemisionItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaRemisionItem | null>(null);
  const [viewing, setViewing] = useState<GuiaRemisionItem | null>(null);
  const [form, setForm] = useState<GuiaFormState>(initialFormState);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("");

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const filteredByEstado = useMemo(() => {
    if (!filterEstado) return guias;
    return guias.filter((g) => g.estado === filterEstado);
  }, [guias, filterEstado]);

  const columns = useMemo<ColumnDef<GuiaRemisionItem>[]>(() => [
    {
      accessorKey: "numero_comprobante",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Número <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-900">{row.original.numero_comprobante || row.original.numero || "-"}</div>
          <div className="text-xs text-slate-500">{row.original.secuencial || row.original.id}</div>
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Estado <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoClasses(row.original.estado)}`}>
          {row.original.estado || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "cliente_nombre",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Cliente <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-800">{row.original.cliente_nombre || getClienteLabel(row.original.id_cliente)}</div>
          <div className="text-xs text-slate-500">{row.original.cliente_identificacion || ""}</div>
        </div>
      ),
    },
    {
      accessorKey: "razon_social_transportista",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Transportista <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-slate-800">{row.original.razon_social_transportista}</div>
          <div className="text-xs text-slate-500">Placa: {row.original.placa}</div>
        </div>
      ),
    },
    {
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha Emisión <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_emision}</span>,
    },
    {
      accessorKey: "ruta",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Ruta <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate text-slate-700" title={row.original.ruta}>
          {row.original.ruta || "-"}
        </div>
      ),
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => {
        const g = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                  <MoreVertical size={16} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetail(g)}><Eye size={14} className="mr-2" /> Ver detalle</DropdownMenuItem>
                {canEmitir(g) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => handleEmitir(g)} className="text-emerald-700 focus:text-emerald-700"><Send size={14} className="mr-2" /> Emitir al SRI</DropdownMenuItem></>)}
                {canEdit(g) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openEdit(g)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem></>)}
                {canDelete(g) && (<DropdownMenuItem onClick={() => handleDelete(g)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleEstado(g)}><Power size={14} className="mr-2" /> Cambiar estado</DropdownMenuItem>
                {g.estado?.toUpperCase() === "AUTORIZADO" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(`/api/guias-remision/${g.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
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
  ], [clientes]);

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

  const canEdit = (guia: GuiaRemisionItem) =>
    guia.estado === "BORRADOR" || guia.estado === "RECHAZADA";
  const canDelete = (guia: GuiaRemisionItem) => guia.estado === "BORRADOR";
  const canEmitir = (guia: GuiaRemisionItem) =>
    guia.estado === "BORRADOR" || guia.estado === "RECHAZADA";

  const openCreate = () => {
    setEditing(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (guia: GuiaRemisionItem) => {
    setEditing(guia);
    setForm(toGuiaFormState(guia));
    setModalOpen(true);
  };

  const openDetail = (guia: GuiaRemisionItem) => {
    setViewing(guia);
    setDetailOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialFormState);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setViewing(null);
  };

  const validateForm = (): boolean => {
    if (!form.id_punto_emision) {
      toast.error("Seleccione un punto de emisión");
      return false;
    }
    if (!form.id_cliente) {
      toast.error("Seleccione un cliente");
      return false;
    }
    if (!form.fecha_emision) {
      toast.error("Ingrese la fecha de emisión");
      return false;
    }
    if (!form.ruc_transportista.trim()) {
      toast.error("Ingrese el RUC del transportista");
      return false;
    }
    if (!form.razon_social_transportista.trim()) {
      toast.error("Ingrese la razón social del transportista");
      return false;
    }
    if (!form.placa.trim()) {
      toast.error("Ingrese la placa del vehículo");
      return false;
    }
    if (!form.fecha_ini_transporte) {
      toast.error("Ingrese la fecha inicio de transporte");
      return false;
    }
    if (!form.fecha_fin_transporte) {
      toast.error("Ingrese la fecha fin de transporte");
      return false;
    }
    if (!form.motivo_traslado.trim()) {
      toast.error("Ingrese el motivo del traslado");
      return false;
    }
    if (!form.direccion_destino.trim()) {
      toast.error("Ingrese la dirección de destino");
      return false;
    }
    if (form.detalles.length === 0 || form.detalles.every((d) => !d.id_producto && !d.descripcion)) {
      toast.error("Agregue al menos un producto a la guía");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const payload = {
        ...form,
        detalles: form.detalles.map((d) =>
          d.id_producto
            ? { id_producto: d.id_producto }
            : { codigo: d.codigo, descripcion: d.descripcion, cantidad: d.cantidad }
        ),
      };

      if (editing) {
        await guiasRemisionService.updateGuia(editing.id, payload);
        toast.success("Guía de remisión actualizada");
      } else {
        await guiasRemisionService.createGuia(payload);
        toast.success("Guía de remisión creada");
      }
      closeModal();
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async (guia: GuiaRemisionItem) => {
    if (!confirm(`¿Eliminar la guía ${guia.numero_comprobante || guia.id}?`)) return;
    try {
      await guiasRemisionService.deleteGuia(guia.id);
      toast.success("Guía eliminada");
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleEstado = async (guia: GuiaRemisionItem) => {
    try {
      await guiasRemisionService.toggleEstado(guia.id);
      toast.success("Estado actualizado");
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleEmitir = async (guia: GuiaRemisionItem) => {
    if (!confirm(`¿Emitir la guía ${guia.numero_comprobante || guia.id} al SRI?`)) return;
    try {
      await guiasRemisionService.emitirGuia(guia.id);
      toast.success("Guía emitida al SRI");
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al emitir");
    }
  };

  const addDetalle = () => {
    setForm((f) => ({
      ...f,
      detalles: [...f.detalles, { id_producto: 0, codigo: "", descripcion: "", cantidad: 1 }],
    }));
  };

  const removeDetalle = (idx: number) => {
    setForm((f) => ({
      ...f,
      detalles: f.detalles.filter((_, i) => i !== idx),
    }));
  };

  const updateDetalle = (idx: number, updates: Partial<GuiaFormState["detalles"][0]>) => {
    setForm((f) => {
      const nuevos = [...f.detalles];
      nuevos[idx] = { ...nuevos[idx], ...updates };
      return { ...f, detalles: nuevos };
    });
  };

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "AUTORIZADO":
        return "bg-emerald-100 text-emerald-700";
      case "BORRADOR":
        return "bg-amber-100 text-amber-700";
      case "RECHAZADA":
        return "bg-rose-100 text-rose-700";
      case "INACTIVO":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getClienteLabel = (id: number) => {
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.razon_social} (${c.identificacion})` : "-";
  };

  if (!showPanel) return null;

  useEffect(() => {
    loadGuias();
    loadCatalogs();
  }, []);

  const loadGuias = async () => {
    setLoading(true);
    try {
      const data = await guiasRemisionService.listGuias();
      setGuias(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar guías");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const [puntosData, clientesData, productosData] = await Promise.all([
        emissionPointService.listPuntos(),
        clientService.listClientes(),
        productService.listProductos(),
      ]);
      setPuntos(puntosData);
      setClientes(clientesData);
      setProductos(productosData);
    } catch {
      toast.error("Error al cargar catálogos");
    } finally {
      setLoadingCatalogs(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar guía..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap" disabled={loadingCatalogs}>
            <Plus size={15} className="mr-1.5" /> Nueva Guía
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs font-medium text-slate-500">Filtrar por:</div>
          <SelectPrimitive.Root value={filterEstado || ""} onValueChange={(val) => setFilterEstado(val)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value placeholder="Todos los estados" />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Todos los estados</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="BORRADOR" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Borrador</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="AUTORIZADO" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Autorizado</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="RECHAZADA" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Rechazada</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="INACTIVO" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Inactivo</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      )}

      {loading ? (
        <div className="py-12"><Loader label="Cargando guías..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Truck size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay guías para este filtro.</p>
          <Button className="mt-3 h-9 shadow-none" onClick={openCreate} disabled={loadingCatalogs}><Plus size={15} className="mr-1.5" /> Nueva Guía</Button>
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Truck className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar guía de remisión" : "Crear nueva guía de remisión"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos de la guía de remisión existente."
                      : "Registra una nueva guía de remisión con los datos del transporte y los productos a transportar."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* SECCIÓN: Información general */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Punto de emisión *" htmlFor="guia-punto">
                    <SelectPrimitive.Root 
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="guia-punto"
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

                  <Field label="Cliente *" htmlFor="guia-cliente">
                    <SelectPrimitive.Root 
                      value={form.id_cliente === 0 ? undefined : form.id_cliente.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_cliente: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="guia-cliente"
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
                            {clientes.map((c) => (
                              <SelectPrimitive.Item 
                                key={c.id}
                                value={c.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{c.razon_social} ({c.identificacion})</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Fecha de emisión *" htmlFor="guia-fecha">
                    <Input
                      id="guia-fecha"
                      type="date"
                      value={form.fecha_emision}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_emision: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Datos del transporte */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos del transporte</h3>
                </div>
                
                {/* Transportista */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="RUC Transportista *" htmlFor="guia-ruc">
                    <Input
                      id="guia-ruc"
                      value={form.ruc_transportista}
                      onChange={(event) => setForm((f) => ({ ...f, ruc_transportista: event.target.value }))}
                      placeholder="1712345678001"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>

                  <Field label="Razón Social Transportista *" htmlFor="guia-razon">
                    <Input
                      id="guia-razon"
                      value={form.razon_social_transportista}
                      onChange={(event) => setForm((f) => ({ ...f, razon_social_transportista: event.target.value }))}
                      placeholder="Transportes SA"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>

                  <Field label="Placa Vehículo *" htmlFor="guia-placa">
                    <Input
                      id="guia-placa"
                      value={form.placa}
                      onChange={(event) => setForm((f) => ({ ...f, placa: event.target.value.toUpperCase() }))}
                      placeholder="ABC-1234"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>
                </div>

                {/* Fechas */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Fecha inicio transporte *" htmlFor="guia-ini">
                    <Input
                      id="guia-ini"
                      type="date"
                      value={form.fecha_ini_transporte}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_ini_transporte: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Fecha fin transporte *" htmlFor="guia-fin">
                    <Input
                      id="guia-fin"
                      type="date"
                      value={form.fecha_fin_transporte}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_fin_transporte: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Destino */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Destino</h3>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Field label="Motivo de traslado *" htmlFor="guia-motivo">
                      <SelectPrimitive.Root 
                        value={form.motivo_traslado} 
                        onValueChange={(val) => setForm((f) => ({ ...f, motivo_traslado: val }))}
                      >
                        <SelectPrimitive.Trigger 
                          id="guia-motivo"
                          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        >
                          <SelectPrimitive.Value />
                          <SelectPrimitive.Icon>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content 
                            className="z-50 min-w-[280px] max-h-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                              {motivosTraslado.map((m) => (
                                <SelectPrimitive.Item 
                                  key={m}
                                  value={m}
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                >
                                  <SelectPrimitive.ItemText>{m}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>

                  <Field label="Ruta" htmlFor="guia-ruta">
                    <Input
                      id="guia-ruta"
                      value={form.ruta}
                      onChange={(event) => setForm((f) => ({ ...f, ruta: event.target.value }))}
                      placeholder="Quito - Guayaquil"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>
                </div>

                <Field label="Dirección de destino *" htmlFor="guia-dir">
                  <Input
                    id="guia-dir"
                    value={form.direccion_destino}
                    onChange={(event) => setForm((f) => ({ ...f, direccion_destino: event.target.value }))}
                    placeholder="Av. 9 de Octubre 123"
                    className="bg-white shadow-none placeholder:text-slate-300"
                  />
                </Field>
              </div>

              {/* SECCIÓN: Productos a transportar */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Productos a transportar</h3>
                  </div>
                  <Button type="button" variant="secondary" className="h-9 px-3" onClick={addDetalle}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Agregar producto
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.detalles.map((detalle, idx) => (
                    <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start">
                      <div className="flex-[2] min-w-0">
                        <Field label="Producto *" htmlFor={`guia-prod-${idx}`}>
                          <SelectPrimitive.Root
                            value={detalle.id_producto === 0 ? undefined : detalle.id_producto.toString()}
                            onValueChange={(val) => {
                              const id_producto = Number(val);
                              const producto = productos.find((p) => p.id === id_producto);
                              updateDetalle(idx, {
                                id_producto,
                                codigo: producto?.codigo || "",
                                descripcion: producto?.descripcion || "",
                              });
                            }}
                          >
                            <SelectPrimitive.Trigger
                              id={`guia-prod-${idx}`}
                              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            >
                              <SelectPrimitive.Value placeholder="Selecciona un producto..." className="truncate" />
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
                                  {productos.map((p) => (
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
                      </div>

                      <div className="w-28 shrink-0">
                        <Field label="Código" htmlFor={`guia-cod-${idx}`}>
                          <Input
                            id={`guia-cod-${idx}`}
                            value={detalle.codigo}
                            onChange={(event) => updateDetalle(idx, { codigo: event.target.value })}
                            placeholder="P001"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Field label="Descripción" htmlFor={`guia-desc-${idx}`}>
                          <Input
                            id={`guia-desc-${idx}`}
                            value={detalle.descripcion}
                            onChange={(event) => updateDetalle(idx, { descripcion: event.target.value })}
                            placeholder="Producto A"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="w-24 shrink-0">
                        <Field label="Cantidad" htmlFor={`guia-cant-${idx}`}>
                          <Input
                            id={`guia-cant-${idx}`}
                            type="number"
                            min={1}
                            value={detalle.cantidad}
                            onChange={(event) => updateDetalle(idx, { cantidad: Number(event.target.value) })}
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
                  onClick={handleSubmit}
                  className="h-10 px-4"
                >
                  {editing ? "Guardar cambios" : "Crear guía"}
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
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
                    Guía de Remisión {viewing?.numero_comprobante || viewing?.numero}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la guía de remisión registrada.
                  </Dialog.Description>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {viewing && (
                <>
                  {/* SECCIÓN: Información general */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Número</div>
                        <div className="font-semibold text-slate-800">{viewing.numero_comprobante || viewing.numero || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Estado</div>
                        <div>
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${getEstadoClasses(viewing.estado)}`}>
                            {viewing.estado || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Fecha emisión</div>
                        <div className="text-slate-800">{viewing.fecha_emision}</div>
                      </div>
                      {viewing.clave_acceso && (
                        <div className="sm:col-span-3 bg-white rounded-lg p-2.5 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-0.5">Clave de acceso</div>
                          <div className="text-xs text-slate-800 break-all font-mono">{viewing.clave_acceso}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN: Datos del transporte */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Truck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Datos del transporte</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">RUC Transportista</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.ruc_transportista}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Razón Social</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.razon_social_transportista}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Placa</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.placa}</div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Inicio transporte</div>
                        <div className="text-sm text-slate-800">{viewing.fecha_ini_transporte}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Fin transporte</div>
                        <div className="text-sm text-slate-800">{viewing.fecha_fin_transporte}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Destino */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Destino</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Motivo de traslado</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.motivo_traslado}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Ruta</div>
                        <div className="text-sm text-slate-800">{viewing.ruta || "-"}</div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Cliente</div>
                        <div className="text-sm font-medium text-slate-800">{getClienteLabel(viewing.id_cliente)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Dirección de destino</div>
                        <div className="text-sm text-slate-800">{viewing.direccion_destino}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Productos */}
                  {viewing.detalles && viewing.detalles.length > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Productos a transportar ({viewing.detalles.length})</h3>
                      </div>
                      <div className="space-y-2">
                        {viewing.detalles.map((d, idx) => (
                          <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="w-24 shrink-0">
                              <div className="text-xs text-slate-500 mb-0.5">Código</div>
                              <div className="text-sm font-medium text-slate-800">{d.codigo || "-"}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Descripción</div>
                              <div className="text-sm text-slate-800 truncate">{d.descripcion || "-"}</div>
                            </div>
                            <div className="w-20 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Cantidad</div>
                              <div className="text-sm font-medium text-slate-800">{d.cantidad || 1}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 pt-2">
                    {viewing.estado === "AUTORIZADO" && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const url = `http://185.214.135.60:3000/api/guias-remision/${viewing.id}/pdf`;
                          window.open(url, "_blank");
                        }}
                        className="h-10 px-4"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Descargar PDF
                      </Button>
                    )}
                    <Button 
                      variant="secondary" 
                      onClick={closeDetail}
                      className="h-10 px-4"
                    >
                      Cerrar
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
