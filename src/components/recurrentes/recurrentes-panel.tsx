"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Edit,
  Eye,
  FileText,
  ListFilter,
  MoreVertical,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
  Trash,
  Package,
  User,
  Calendar,
  CreditCard,
  FileCheck,
  Settings,
  RotateCw
} from "lucide-react";
import { toast } from "sonner";

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
  RecurrenteFormState,
  RecurrenteItem,
  FrecuenciaRecurrente,
  RecurrenteGenerarInput,
} from "@/src/modules/recurrentes/types/recurrentes.types";
import { recurrentesService } from "@/src/modules/recurrentes/services/recurrentes.service";
import { toRecurrenteFormState } from "@/src/modules/recurrentes/utils/recurrentes-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { Loader } from "@/src/components/ui/loader";

interface RecurrentesPanelProps {
  showPanel?: boolean;
}

const initialFormState: RecurrenteFormState = {
  id_cliente: 0,
  id_punto_emision: 0,
  descripcion: "",
  frecuencia: "MENSUAL",
  dia_emision: 1,
  proxima_facturacion: new Date().toISOString().split("T")[0],
  forma_pago: "01",
  detalles: [{ codigo: "", descripcion: "", cantidad: 1, precio_unitario: 0, descuento: 0, codigo_iva: "2", porcentaje_iva: 12 }],
};

const frecuencias: { value: FrecuenciaRecurrente; label: string }[] = [
  { value: "DIARIA", label: "Diaria" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "ANUAL", label: "Anual" },
];

const formasPago = [
  { value: "01", label: "01 - SIN SISTEMA FINANCIERO" },
  { value: "15", label: "15 - COMPENSACION DE DEUDAS" },
  { value: "16", label: "16 - TARJETA DE DEBITO" },
  { value: "17", label: "17 - DINERO ELECTRONICO" },
  { value: "18", label: "18 - TARJETA PREPAGO" },
  { value: "19", label: "19 - TARJETA DE CREDITO" },
  { value: "20", label: "20 - OTROS CON UTILIZACION SISTEMA FINANCIERO" },
  { value: "21", label: "21 - ENDOSO DE TITULOS" },
];

export function RecurrentesPanel({ showPanel = true }: RecurrentesPanelProps) {
  const [recurrentes, setRecurrentes] = useState<RecurrenteItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generarOpen, setGenerarOpen] = useState(false);
  const [editing, setEditing] = useState<RecurrenteItem | null>(null);
  const [viewing, setViewing] = useState<RecurrenteItem | null>(null);
  const [generando, setGenerando] = useState<RecurrenteItem | null>(null);
  const [form, setForm] = useState<RecurrenteFormState>(initialFormState);
  const [generarForm, setGenerarForm] = useState<RecurrenteGenerarInput>({
    id_cliente: 0,
    id_punto_emision: 0,
    descripcion: "",
    frecuencia: "MENSUAL",
    dia_emision: 1,
    proxima_facturacion: new Date().toISOString().split("T")[0],
    forma_pago: "01",
    detalles: [{ id_producto: 0, cantidad: 1 }],
  });

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("ACTIVO");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadRecurrentes();
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadRecurrentes();
  }, [filterEstado]);

  const loadRecurrentes = async () => {
    setLoading(true);
    try {
      const data = await recurrentesService.listRecurrentes(filterEstado || undefined);
      setRecurrentes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar recurrentes");
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
    if (!filterEstado || filterEstado === "TODOS") return recurrentes;
    return recurrentes.filter((r) => r.estado === filterEstado);
  }, [recurrentes, filterEstado]);

  const columns = useMemo<ColumnDef<RecurrenteItem>[]>(() => [
    {
      accessorKey: "descripcion",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Descripción <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.descripcion}</div>
          <div className="text-xs text-slate-500">Punto: {row.original.punto_emision_codigo || row.original.id_punto_emision}</div>
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
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoClasses(row.original.estado || "")}`}>{row.original.estado}</span>
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
          <div className="font-medium text-slate-800">{row.original.cliente_nombre || getClienteLabel(row.original.id_cliente || 0)}</div>
          <div className="text-xs text-slate-500">{row.original.cliente_identificacion || ""}</div>
        </div>
      ),
    },
    {
      accessorKey: "frecuencia",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Frecuencia <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{getFrecuenciaLabel(row.original.frecuencia)}</span>,
    },
    {
      accessorKey: "proxima_facturacion",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Próxima Fact. <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.proxima_facturacion}</span>,
    },
    {
      accessorKey: "total_facturas_generadas",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Facturas Gen. <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700 font-medium">{row.original.total_facturas_generadas || 0}</span>,
    },
    {
      accessorKey: "total_estimado",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Est. <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-700">{new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(row.original.total_estimado || 0)}</span>,
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
                {r.estado === "ACTIVO" && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openGenerar(r)} className="text-emerald-700 focus:text-emerald-700"><RefreshCw size={14} className="mr-2" /> Generar Factura</DropdownMenuItem></>)}
                {canEditDelete(r) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openEdit(r)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete(r)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem></>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleEstado(r)}><Power size={14} className="mr-2" /> Activar/Desactivar</DropdownMenuItem>
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

  const canEditDelete = (rec: RecurrenteItem) =>
    rec.estado === "ACTIVO" || rec.estado === "INACTIVO";

  const openCreate = () => {
    setEditing(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (rec: RecurrenteItem) => {
    setEditing(rec);
    setForm(toRecurrenteFormState(rec));
    setModalOpen(true);
  };

  const openDetail = (rec: RecurrenteItem) => {
    setViewing(rec);
    setDetailOpen(true);
  };

  const openGenerar = (rec: RecurrenteItem) => {
    setGenerando(rec);
    setGenerarForm({
      id_cliente: rec.id_cliente,
      id_punto_emision: rec.id_punto_emision,
      descripcion: rec.descripcion,
      frecuencia: rec.frecuencia,
      dia_emision: rec.dia_emision,
      proxima_facturacion: rec.proxima_facturacion,
      forma_pago: rec.forma_pago,
      detalles: (rec.detalles || []).map((d) => ({
        id_producto: d.id_producto || 0,
        cantidad: d.cantidad,
      })),
    });
    setGenerarOpen(true);
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

  const closeGenerar = () => {
    setGenerarOpen(false);
    setGenerando(null);
  };

  const validateForm = (): boolean => {
    if (!form.id_cliente) {
      toast.error("Seleccione un cliente");
      return false;
    }
    if (!form.id_punto_emision) {
      toast.error("Seleccione un punto de emisión");
      return false;
    }
    if (!form.descripcion.trim()) {
      toast.error("Ingrese una descripción");
      return false;
    }
    if (!form.proxima_facturacion) {
      toast.error("Ingrese la próxima fecha de facturación");
      return false;
    }
    if (form.dia_emision < 1 || form.dia_emision > 31) {
      toast.error("El día de emisión debe estar entre 1 y 31");
      return false;
    }
    if (form.detalles.length === 0 || form.detalles.every((d) => !d.descripcion && !d.id_producto)) {
      toast.error("Agregue al menos un producto");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      ...form,
      detalles: form.detalles.map((d) => ({
        id_producto: d.id_producto,
        codigo: d.codigo,
        descripcion: d.descripcion,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        descuento: d.descuento,
        codigo_iva: d.codigo_iva,
        porcentaje_iva: d.porcentaje_iva,
      })),
    };

    try {
      if (editing) {
        await recurrentesService.updateRecurrente(editing.id, payload);
        toast.success("Recurrente actualizado");
      } else {
        await recurrentesService.createRecurrente(payload);
        toast.success("Recurrente creado");
      }
      closeModal();
      loadRecurrentes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async (rec: RecurrenteItem) => {
    if (!confirm(`¿Eliminar el recurrente "${rec.descripcion}"?`)) return;
    try {
      await recurrentesService.deleteRecurrente(rec.id);
      toast.success("Recurrente eliminado");
      loadRecurrentes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleEstado = async (rec: RecurrenteItem) => {
    try {
      await recurrentesService.toggleEstado(rec.id);
      toast.success("Estado actualizado");
      loadRecurrentes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleGenerar = async () => {
    if (!generando) return;
    try {
      await recurrentesService.generarFactura(generando.id, generarForm);
      toast.success("Factura generada exitosamente");
      closeGenerar();
      loadRecurrentes();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar factura");
    }
  };

  const addDetalle = () => {
    setForm((f) => ({
      ...f,
      detalles: [...f.detalles, { codigo: "", descripcion: "", cantidad: 1, precio_unitario: 0, descuento: 0, codigo_iva: "2", porcentaje_iva: 12 }],
    }));
  };

  const removeDetalle = (idx: number) => {
    setForm((f) => ({
      ...f,
      detalles: f.detalles.filter((_, i) => i !== idx),
    }));
  };

  const updateDetalle = (idx: number, updates: Partial<RecurrenteFormState["detalles"][0]>) => {
    setForm((f) => {
      const nuevos = [...f.detalles];
      nuevos[idx] = { ...nuevos[idx], ...updates };
      return { ...f, detalles: nuevos };
    });
  };

  const handleProductoChange = (idx: number, productoId: number) => {
    const producto = productos.find((p) => p.id === productoId);
    if (producto) {
      updateDetalle(idx, {
        id_producto: productoId,
        codigo: producto.codigo || "",
        descripcion: producto.descripcion || "",
        precio_unitario: producto.precio || 0,
        codigo_iva: String(producto.id_iva) || "2",
        porcentaje_iva: 12,
      });
    }
  };

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "ACTIVO":
        return "bg-emerald-100 text-emerald-700";
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

  const getFrecuenciaLabel = (frec: FrecuenciaRecurrente) => {
    return frecuencias.find((f) => f.value === frec)?.label || frec;
  };

  if (!showPanel) return null;

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar recurrente..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
            <Plus size={15} className="mr-1.5" /> Nuevo Recurrente
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs font-medium text-slate-500">Filtrar por:</div>
          <SelectPrimitive.Root value={filterEstado || "TODOS"} onValueChange={(val) => setFilterEstado(val === "TODOS" ? "" : val)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  {["TODOS", "ACTIVO", "INACTIVO"].map((e) => (
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
        <div className="py-12"><Loader label="Cargando recurrentes..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay recurrentes para este filtro.</p>
          <Button className="mt-3 h-9 shadow-none" onClick={openCreate}><Plus size={15} className="mr-1.5" /> Nuevo Recurrente</Button>
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
                  <RefreshCw className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar facturación recurrente" : "Crear nueva facturación recurrente"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza la configuración de facturación recurrente."
                      : "Configure una facturación automática para el cliente con los productos y frecuencia deseada."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* SECCIÓN: Configuración general */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Configuración general</h3>
                </div>
                {/* Fila 1: Cliente y Punto de emisión */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cliente *" htmlFor="rec-cliente">
                    <SelectPrimitive.Root 
                      value={form.id_cliente === 0 ? undefined : form.id_cliente.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_cliente: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="rec-cliente"
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

                  <Field label="Punto de emisión *" htmlFor="rec-punto">
                    <SelectPrimitive.Root 
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="rec-punto"
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
                </div>

                {/* Fila 2: Descripción */}
                <Field label="Descripción *" htmlFor="rec-desc">
                  <Input
                    id="rec-desc"
                    value={form.descripcion}
                    onChange={(event) => setForm((f) => ({ ...f, descripcion: event.target.value }))}
                    placeholder="Ej: Servicio mensual de internet"
                    className="bg-white shadow-none placeholder:text-slate-300"
                  />
                </Field>
              </div>

              {/* SECCIÓN: Frecuencia y pagos */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Frecuencia y pagos</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Frecuencia *" htmlFor="rec-frec">
                    <SelectPrimitive.Root 
                      value={form.frecuencia} 
                      onValueChange={(val) => setForm((f) => ({ ...f, frecuencia: val as FrecuenciaRecurrente }))}
                    >
                      <SelectPrimitive.Trigger 
                        id="rec-frec"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value />
                        <SelectPrimitive.Icon>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content 
                          className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <SelectPrimitive.Viewport className="p-1">
                            {frecuencias.map((f) => (
                              <SelectPrimitive.Item 
                                key={f.value}
                                value={f.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Día de emisión *" htmlFor="rec-dia">
                    <Input
                      id="rec-dia"
                      type="number"
                      min={1}
                      max={31}
                      value={form.dia_emision}
                      onChange={(event) => setForm((f) => ({ ...f, dia_emision: Number(event.target.value) }))}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Forma de pago *" htmlFor="rec-pago">
                    <SelectPrimitive.Root 
                      value={form.forma_pago} 
                      onValueChange={(val) => setForm((f) => ({ ...f, forma_pago: val }))}
                    >
                      <SelectPrimitive.Trigger 
                        id="rec-pago"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value />
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
                            {formasPago.map((f) => (
                              <SelectPrimitive.Item 
                                key={f.value}
                                value={f.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>
                </div>

                <Field label="Próxima facturación *" htmlFor="rec-prox">
                  <Input
                    id="rec-prox"
                    type="date"
                    value={form.proxima_facturacion}
                    onChange={(event) => setForm((f) => ({ ...f, proxima_facturacion: event.target.value }))}
                    className="bg-white shadow-none"
                  />
                </Field>
              </div>

              {/* SECCIÓN: Productos */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Productos</h3>
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
                        <Field label="Producto" htmlFor={`rec-prod-${idx}`}>
                          <SelectPrimitive.Root
                            value={detalle.id_producto ? detalle.id_producto.toString() : undefined}
                            onValueChange={(val) => handleProductoChange(idx, Number(val))}
                          >
                            <SelectPrimitive.Trigger
                              id={`rec-prod-${idx}`}
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
                        <Field label="Código" htmlFor={`rec-cod-${idx}`}>
                          <Input
                            id={`rec-cod-${idx}`}
                            value={detalle.codigo}
                            onChange={(event) => updateDetalle(idx, { codigo: event.target.value })}
                            placeholder="COD-001"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Field label="Descripción" htmlFor={`rec-desc-${idx}`}>
                          <Input
                            id={`rec-desc-${idx}`}
                            value={detalle.descripcion}
                            onChange={(event) => updateDetalle(idx, { descripcion: event.target.value })}
                            placeholder="Descripción del producto"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="w-20 shrink-0">
                        <Field label="Cantidad" htmlFor={`rec-cant-${idx}`}>
                          <Input
                            id={`rec-cant-${idx}`}
                            type="number"
                            min={1}
                            value={detalle.cantidad}
                            onChange={(event) => updateDetalle(idx, { cantidad: Number(event.target.value) })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>

                      <div className="w-28 shrink-0">
                        <Field label="Precio" htmlFor={`rec-precio-${idx}`}>
                          <Input
                            id={`rec-precio-${idx}`}
                            type="number"
                            min={0}
                            step={0.01}
                            value={detalle.precio_unitario}
                            onChange={(event) => updateDetalle(idx, { precio_unitario: Number(event.target.value) })}
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
                  {editing ? "Guardar cambios" : "Crear recurrente"}
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
                    {viewing?.descripcion}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la facturación recurrente.
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
                        <div className="text-xs text-slate-500 mb-0.5">Descripción</div>
                        <div className="font-semibold text-slate-800">{viewing.descripcion || "-"}</div>
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
                        <div className="text-xs text-slate-500 mb-0.5">Frecuencia</div>
                        <div className="text-slate-800">{getFrecuenciaLabel(viewing.frecuencia)} - Día {viewing.dia_emision}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Cliente y Configuración */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Cliente y Configuración</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Razón Social</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.cliente_nombre || getClienteLabel(viewing.id_cliente)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Identificación</div>
                        <div className="text-sm text-slate-800">{viewing.cliente_identificacion || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Punto de Emisión</div>
                        <div className="text-sm text-slate-800">{viewing.punto_emision_codigo || viewing.id_punto_emision || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Forma de Pago</div>
                        <div className="text-sm text-slate-800">{viewing.forma_pago || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Facturación */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Facturación</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Próxima</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.proxima_facturacion || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Última</div>
                        <div className="text-sm text-slate-800">{viewing.ultima_facturacion || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Total generadas</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.total_facturas_generadas || 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Productos */}
                  {viewing.detalles && viewing.detalles.length > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Productos ({viewing.detalles.length})</h3>
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
                            <div className="w-16 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Cant.</div>
                              <div className="text-sm font-medium text-slate-800">{d.cantidad}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 pt-2">
                    {viewing.estado === "ACTIVO" && (
                      <Button 
                        variant="secondary" 
                        onClick={() => openGenerar(viewing)}
                        className="h-10 px-4"
                      >
                        <RefreshCw className="mr-1.5 h-4 w-4" />
                        Generar Factura
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

      <Dialog.Root open={generarOpen} onOpenChange={setGenerarOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <RotateCw className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Generar Factura Manual
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Genere una factura ahora mismo a partir del recurrente "{generando?.descripcion}".
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  Esta acción creará una factura inmediatamente. La próxima fecha de facturación se actualizará automáticamente.
                </p>
              </div>

              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos de facturación</h3>
                </div>

                <Field label="Próxima Facturación" htmlFor="gen-prox">
                  <Input
                    id="gen-prox"
                    type="date"
                    value={generarForm.proxima_facturacion}
                    onChange={(event) => setGenerarForm((f) => ({ ...f, proxima_facturacion: event.target.value }))}
                    className="bg-white shadow-none"
                  />
                </Field>

                <Field label="Forma de Pago" htmlFor="gen-pago">
                  <SelectPrimitive.Root 
                    value={generarForm.forma_pago} 
                    onValueChange={(val) => setGenerarForm((f) => ({ ...f, forma_pago: val }))}
                  >
                    <SelectPrimitive.Trigger 
                      id="gen-pago"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <SelectPrimitive.Value />
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
                          {formasPago.map((f) => (
                            <SelectPrimitive.Item 
                              key={f.value}
                              value={f.value}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  onClick={closeGenerar}
                  className="h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleGenerar}
                  className="h-10 px-4"
                >
                  <RefreshCw className="mr-1.5 h-4 w-4" />
                  Generar Factura
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
