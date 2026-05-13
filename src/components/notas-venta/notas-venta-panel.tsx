"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
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
import {
  FileText,
  Eye,
  Edit3,
  Plus,
  PlusCircle,
  Send,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck,
  Copy,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ListFilter,
  MoreVertical,
  Printer,
  ShoppingCart,
  Trash,
  Package,
  User,
  Calendar,
  CreditCard,
  Calculator,
  Building2,
} from "lucide-react";
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
import { Textarea } from "@/src/components/ui/textarea";
import type {
  NotaVentaItem,
  NotaVentaDetalle,
  NotaVentaCreateInput,
  NotaVentaUpdateInput,
} from "@/src/modules/notas-venta/types/notas-venta.types";
import { notasVentaService } from "@/src/modules/notas-venta/services/notas-venta.service";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { Loader } from "@/src/components/ui/loader";

interface DetalleDraft {
  mode: "CATALOGO" | "MANUAL";
  id_producto: number | null;
  codigo: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  total: number;
}

interface NotaVentaFormState {
  id_punto_emision: number;
  fecha_emision: string;
  forma_pago: string;
  observacion: string;
  consumidor_final: boolean;
  id_cliente: number | null;
  cli_identificacion: string;
  cli_razon_social: string;
  cli_direccion: string;
  cli_telefono: string;
  cli_email: string;
  detalles: DetalleDraft[];
}

const initialDetail = (): DetalleDraft => ({
  mode: "CATALOGO",
  id_producto: null,
  codigo: "",
  descripcion: "",
  unidad_medida: "UNIDAD",
  cantidad: 1,
  precio_unitario: 0,
  descuento: 0,
  subtotal: 0,
  total: 0,
});

const initialForm: NotaVentaFormState = {
  id_punto_emision: 0,
  fecha_emision: "",
  forma_pago: "01",
  observacion: "",
  consumidor_final: true,
  id_cliente: null,
  cli_identificacion: "9999999999",
  cli_razon_social: "CONSUMIDOR FINAL",
  cli_direccion: "",
  cli_telefono: "",
  cli_email: "",
  detalles: [initialDetail()],
};

const estadoFilters = ["TODOS", "BORRADOR", "AUTORIZADO", "RECHAZADA", "INACTIVO"] as const;
const formaPagoOptions = [
  { value: "01", label: "01 - Efectivo" },
  { value: "19", label: "19 - Tarjeta" },
  { value: "20", label: "20 - Transferencia" },
];
type EstadoFiltro = (typeof estadoFilters)[number];

interface NotasVentaPanelProps {
  showPanel?: boolean;
}

export function NotasVentaPanel({ showPanel = true }: NotasVentaPanelProps) {
  const [notas, setNotas] = useState<NotaVentaItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<NotaVentaItem | null>(null);
  const [detail, setDetail] = useState<NotaVentaItem | null>(null);
  const [form, setForm] = useState<NotaVentaFormState>(initialForm);
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

  const getEstadoColor = (estado?: string) => {
    switch (estado?.toUpperCase()) {
      case "AUTORIZADO": return "bg-emerald-100 text-emerald-700";
      case "RECHAZADA": return "bg-rose-100 text-rose-700";
      case "BORRADOR": return "bg-amber-100 text-amber-700";
      case "INACTIVO": return "bg-rose-100 text-rose-700";
      default: return "bg-sky-100 text-sky-700";
    }
  };

  const getFormaPagoLabel = (value: string) => {
    const option = formaPagoOptions.find((o) => o.value === value);
    return option?.label || value;
  };

  const getPuntoLabel = (id?: number) => {
    if (!id) return "-";
    const p = puntos.find((x) => x.id === id);
    return p ? `${p.codigo} - ${p.descripcion}` : `ID ${id}`;
  };

  const calcularTotales = (detalles: DetalleDraft[]) => {
    return detalles.reduce((acc, d) => {
      const subtotal = d.cantidad * d.precio_unitario;
      const descuento = d.descuento || 0;
      const total = subtotal - descuento;
      return acc + total;
    }, 0);
  };

  // Columnas para react-table
  const columns = useMemo<ColumnDef<NotaVentaItem>[]>(() => [
    {
      accessorKey: "numero_comprobante",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Número
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.numero_comprobante || `Nota #${row.original.id}`}</div>
          <div className="text-slate-500 text-xs">{getPuntoLabel(row.original.id_punto_emision)}</div>
        </div>
      ),
    },
    {
      accessorKey: "cli_razon_social",
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
          <div className="text-slate-800">{row.original.cli_razon_social}</div>
          <div className="text-slate-500 text-xs">{row.original.cli_identificacion || "-"}</div>
        </div>
      ),
    },
    {
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_emision || "-"}</span>,
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
      accessorKey: "total",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">
          ${parseFloat(row.original.total || "0").toFixed(2)}
        </span>
      ),
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => {
        const n = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                  <MoreVertical size={16} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetail(n)}>
                  <Eye size={14} className="mr-2" />
                  Ver
                </DropdownMenuItem>
                {n.estado === "BORRADOR" && (
                  <>
                    <DropdownMenuItem onClick={() => openEdit(n)}>
                      <Edit3 size={14} className="mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(n.id)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                      <Trash2 size={14} className="mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
                {n.estado === "BORRADOR" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleEmitir(n.id)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                      <Send size={14} className="mr-2" />
                      Emitir
                    </DropdownMenuItem>
                  </>
                )}
                {n.estado === "AUTORIZADO" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.open(`/api/notas-venta/${n.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                      <FileText size={14} className="mr-2" />
                      Nota PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/api/notas-venta/${n.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
                      <Printer size={14} className="mr-2" />
                      Imprimir Recibo
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [puntos]);

  const filteredData = useMemo(() => {
    let result = notas;
    if (filter !== "TODOS") {
      result = result.filter((n) => n.estado === filter);
    }
    return result;
  }, [notas, filter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [notasData, puntosData, productosData, clientesData] = await Promise.all([
          notasVentaService.listNotasVenta(),
          emissionPointService.listPuntos(),
          productService.listProductos(),
          clientService.listClientes(),
        ]);
        setNotas(notasData);
        setPuntos(puntosData);
        setProductos(productosData);
        setClientes(clientesData);
      } catch (error) {
        toast.error("Error al cargar notas de venta");
        console.error(error);
      } finally {
        setLoading(false);
        setLoadingCatalogs(false);
      }
    };

    loadData();
  }, []);

  // Set fecha por defecto al abrir modal
  useEffect(() => {
    if (modalOpen && !editing) {
      const today = new Date().toISOString().split("T")[0];
      setForm((prev) => ({
        ...prev,
        fecha_emision: today,
        id_punto_emision: puntos[0]?.id || 0,
      }));
    }
  }, [modalOpen, editing, puntos]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = async (n: NotaVentaItem) => {
    try {
      const fullNota = await notasVentaService.getNotaVenta(n.id);
      setEditing(fullNota);
      setForm({
        id_punto_emision: fullNota.id_punto_emision,
        fecha_emision: fullNota.fecha_emision,
        forma_pago: fullNota.forma_pago,
        observacion: fullNota.observacion || "",
        consumidor_final: !fullNota.id_cliente,
        id_cliente: fullNota.id_cliente,
        cli_identificacion: fullNota.cli_identificacion,
        cli_razon_social: fullNota.cli_razon_social,
        cli_direccion: fullNota.cli_direccion || "",
        cli_telefono: fullNota.cli_telefono || "",
        cli_email: fullNota.cli_email || "",
        detalles: fullNota.detalles?.map((d) => ({
          mode: d.id_producto ? "CATALOGO" : "MANUAL",
          id_producto: d.id_producto,
          codigo: d.codigo,
          descripcion: d.descripcion,
          unidad_medida: d.unidad_medida,
          cantidad: parseFloat(d.cantidad),
          precio_unitario: parseFloat(d.precio_unitario),
          descuento: parseFloat(d.descuento),
          subtotal: parseFloat(d.subtotal),
          total: parseFloat(d.total),
        })) || [initialDetail()],
      });
      setModalOpen(true);
    } catch (error) {
      toast.error("Error al cargar detalle de la nota");
    }
  };

  const openDetail = async (n: NotaVentaItem) => {
    try {
      const fullNota = await notasVentaService.getNotaVenta(n.id);
      setDetail(fullNota);
      setDetailOpen(true);
    } catch (error) {
      toast.error("Error al cargar detalle");
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Construir payload según si es consumidor final o cliente específico
      const basePayload = {
        id_punto_emision: form.id_punto_emision,
        fecha_emision: form.fecha_emision,
        forma_pago: form.forma_pago,
        observacion: form.observacion,
        detalles: form.detalles.map((d) => ({
          id_producto: d.id_producto,
          codigo: d.codigo,
          descripcion: d.descripcion,
          unidad_medida: d.unidad_medida,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento: d.descuento,
        })),
      };

      let input;
      if (form.consumidor_final) {
        // Si es consumidor final, enviar flag y datos del cliente
        input = {
          ...basePayload,
          consumidor_final: true,
          cli_identificacion: form.cli_identificacion,
          cli_razon_social: form.cli_razon_social,
          cli_direccion: form.cli_direccion || undefined,
          cli_telefono: form.cli_telefono || undefined,
          cli_email: form.cli_email || undefined,
        };
      } else {
        // Si es cliente específico, enviar id_cliente
        input = {
          ...basePayload,
          id_cliente: form.id_cliente,
        };
      }

      if (editing) {
        await notasVentaService.updateNotaVenta(editing.id, input);
        toast.success("Nota de venta actualizada correctamente");
      } else {
        await notasVentaService.createNotaVenta(input);
        toast.success("Nota de venta creada correctamente");
      }

      // Recargar lista
      const notasData = await notasVentaService.listNotasVenta();
      setNotas(notasData);
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta nota de venta?")) return;

    try {
      await notasVentaService.deleteNotaVenta(id);
      setNotas((prev) => prev.filter((n) => n.id !== id));
      toast.success("Nota de venta eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleEmitir = async (id: number) => {
    try {
      await notasVentaService.emitirNotaVenta(id);
      toast.success("Nota de venta emitida al SRI");
      const notasData = await notasVentaService.listNotasVenta();
      setNotas(notasData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al emitir");
    }
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
      detalles: prev.detalles.filter((_, i) => i !== index),
    }));
  };

  const updateDetail = (index: number, updates: Partial<DetalleDraft>) => {
    setForm((prev) => {
      const detalles = [...prev.detalles];
      const current = detalles[index];
      const updated = { ...current, ...updates };

      // Recalcular subtotal y total
      const subtotal = updated.cantidad * updated.precio_unitario;
      const total = subtotal - updated.descuento;

      detalles[index] = { ...updated, subtotal, total };
      return { ...prev, detalles };
    });
  };

  const selectProduct = (index: number, productoId: number) => {
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return;

    updateDetail(index, {
      mode: "CATALOGO",
      id_producto: producto.id,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      unidad_medida: producto.unidad_medida,
      precio_unitario: producto.precio || 0,
    });
  };

  const totalNota = calcularTotales(form.detalles);

  if (!showPanel) return null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <Loader label="Cargando notas de venta..." />
        </div>
      </div>
    );
  }

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
              placeholder="Buscar nota de venta..."
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
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando notas de venta" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay notas de venta para este filtro.</p>
          <Button onClick={openCreate} disabled={loadingCatalogs} className="mt-3 h-9 shadow-none">
            <Plus size={15} className="mr-1.5" /> Crear nota
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-4 py-2.5 font-bold whitespace-nowrap text-slate-600">
                        {flexRender(header.column.columnDef.header, header.getContext())}
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

      {/* Modal Crear/Editar */}
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
                  <ShoppingCart className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar nota de venta" : "Crear nueva nota de venta"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos de la nota de venta y sus detalles."
                      : "Registra una nueva nota de venta con los datos del cliente y los productos."}
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
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Punto de emisión *" htmlFor="id_punto_emision">
                    <SelectPrimitive.Root
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()}
                      onValueChange={(val) => setForm({ ...form, id_punto_emision: parseInt(val) })}
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
                      onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Forma de pago *" htmlFor="forma_pago">
                    <SelectPrimitive.Root
                      value={form.forma_pago}
                      onValueChange={(val) => setForm({ ...form, forma_pago: val })}
                    >
                      <SelectPrimitive.Trigger
                        id="forma_pago"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value />
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
                            {formaPagoOptions.map((o) => (
                              <SelectPrimitive.Item
                                key={o.value}
                                value={o.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
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
                      checked={form.consumidor_final}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          consumidor_final: e.target.checked,
                          ...(e.target.checked
                            ? {
                                cli_identificacion: "9999999999",
                                cli_razon_social: "CONSUMIDOR FINAL",
                                id_cliente: null,
                              }
                            : {
                                cli_identificacion: "",
                                cli_razon_social: "",
                              }),
                        })
                      }
                      className="h-4 w-4 accent-sky-700"
                    />
                    Consumidor Final
                  </label>
                </div>

                {form.consumidor_final ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Identificación *" htmlFor="cli_identificacion">
                      <Input
                        id="cli_identificacion"
                        value={form.cli_identificacion}
                        onChange={(e) => setForm({ ...form, cli_identificacion: e.target.value })}
                        placeholder="Ej: 9999999999"
                        className="bg-white shadow-none placeholder:text-slate-300"
                      />
                    </Field>
                    <Field label="Razón Social *" htmlFor="cli_razon_social">
                      <Input
                        id="cli_razon_social"
                        value={form.cli_razon_social}
                        onChange={(e) => setForm({ ...form, cli_razon_social: e.target.value })}
                        placeholder="Ej: CONSUMIDOR FINAL"
                        className="bg-white shadow-none placeholder:text-slate-300"
                      />
                    </Field>
                    <Field label="Dirección" htmlFor="cli_direccion">
                      <Input
                        id="cli_direccion"
                        value={form.cli_direccion}
                        onChange={(e) => setForm({ ...form, cli_direccion: e.target.value })}
                        className="bg-white shadow-none"
                      />
                    </Field>
                    <Field label="Teléfono" htmlFor="cli_telefono">
                      <Input
                        id="cli_telefono"
                        value={form.cli_telefono}
                        onChange={(e) => setForm({ ...form, cli_telefono: e.target.value })}
                        className="bg-white shadow-none"
                      />
                    </Field>
                  </div>
                ) : (
                  <div>
                    <Field label="Cliente *" htmlFor="id_cliente">
                      <SelectPrimitive.Root
                        value={form.id_cliente === null ? undefined : form.id_cliente.toString()}
                        onValueChange={(val) => setForm({ ...form, id_cliente: parseInt(val) })}
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
                              {clientes.map((c) => (
                                <SelectPrimitive.Item
                                  key={c.id}
                                  value={c.id.toString()}
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                >
                                  <SelectPrimitive.ItemText>{c.identificacion} - {c.razon_social}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
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
                    Agregar Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.detalles.map((detalle, index) => (
                    <div key={index} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-start">
                      <div className="flex-1 min-w-0">
                        <Field label="Producto *" htmlFor={`producto-${index}`}>
                          <SelectPrimitive.Root
                            value={detalle.id_producto === null ? undefined : detalle.id_producto.toString()}
                            onValueChange={(val) => selectProduct(index, parseInt(val))}
                            disabled={loadingCatalogs}
                          >
                            <SelectPrimitive.Trigger
                              id={`producto-${index}`}
                              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                            >
                              <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un producto..."} />
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
                      <div className="w-40 shrink-0">
                        <Field label="Descripción" htmlFor={`descripcion-${index}`}>
                          <Input
                            id={`descripcion-${index}`}
                            value={detalle.descripcion}
                            onChange={(e) => updateDetail(index, { descripcion: e.target.value })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                      <div className="w-24 shrink-0">
                        <Field label="Cantidad" htmlFor={`cantidad-${index}`}>
                          <Input
                            id={`cantidad-${index}`}
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={detalle.cantidad}
                            onChange={(e) => updateDetail(index, { cantidad: parseFloat(e.target.value) || 0 })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                      <div className="w-28 shrink-0">
                        <Field label="P. Unitario" htmlFor={`precio-${index}`}>
                          <Input
                            id={`precio-${index}`}
                            type="number"
                            min={0}
                            step={0.01}
                            value={detalle.precio_unitario}
                            onChange={(e) => updateDetail(index, { precio_unitario: parseFloat(e.target.value) || 0 })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => removeDetail(index)}
                          className="h-9 w-9 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg"
                          type="button"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <div className="bg-white rounded-lg border border-slate-200 px-4 py-2">
                    <p className="text-xs text-slate-500 mb-0.5">Total Nota de Venta</p>
                    <p className="text-xl font-bold text-slate-900">${totalNota.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Observación */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Observaciones</h3>
                </div>
                <Field label="Observación" htmlFor="observacion">
                  <Textarea
                    id="observacion"
                    value={form.observacion}
                    onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                    rows={2}
                    placeholder="Notas adicionales sobre la venta..."
                    className="bg-white shadow-none placeholder:text-slate-300"
                  />
                </Field>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} className="h-10 px-4">
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="h-10 px-4">
                  {saving ? <Loader className="mr-2" /> : null}
                  {editing ? "Guardar Cambios" : "Crear Nota"}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Detalle */}
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
                    Detalle de nota de venta
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la nota de venta seleccionada.
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
                        <div className="text-xs text-slate-500 mb-0.5">Número</div>
                        <div className="font-semibold text-slate-800">{detail.numero_comprobante || "-"}</div>
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
                        <div className="text-xs text-slate-500 mb-0.5">Forma de Pago</div>
                        <div className="text-slate-800">{getFormaPagoLabel(detail.forma_pago)}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Cliente */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Identificación</div>
                        <div className="font-medium text-slate-800">{detail.cli_identificacion || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Razón Social</div>
                        <div className="font-medium text-slate-800">{detail.cli_razon_social || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Items */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Items</h3>
                    </div>
                    {detail.detalles?.length ? (
                      <div className="space-y-2">
                        {detail.detalles.map((item, idx) => (
                          <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-slate-500 mb-0.5">Descripción</div>
                              <div className="text-sm font-medium text-slate-800">{item.descripcion || "-"}</div>
                            </div>
                            <div className="w-16 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Cant.</div>
                              <div className="text-sm font-medium text-slate-800">{item.cantidad}</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">P.Unit</div>
                              <div className="text-sm text-slate-800">${parseFloat(item.precio_unitario).toFixed(2)}</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Total</div>
                              <div className="text-sm font-semibold text-slate-800">${parseFloat(item.total).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end pt-2 border-t border-slate-200">
                          <div className="bg-white rounded-lg border border-slate-200 px-3 py-1.5">
                            <span className="text-xs text-slate-500">Total: </span>
                            <span className="font-semibold text-slate-900">${parseFloat(detail.total).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Sin items.</p>
                    )}
                  </div>

                  {/* Observación */}
                  {detail.observacion && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Observaciones</h3>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-sm text-slate-700">{detail.observacion}</p>
                      </div>
                    </div>
                  )}

                  {/* Respuesta SRI */}
                  {detail.respuesta_sri && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Respuesta SRI</h3>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-sm text-slate-700">{detail.respuesta_sri}</p>
                      </div>
                    </div>
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
