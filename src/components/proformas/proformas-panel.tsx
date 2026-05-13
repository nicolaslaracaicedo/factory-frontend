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
  Download,
  Edit,
  Eye,
  FileText,
  ListFilter,
  MoreVertical,
  Plus,
  Power,
  Receipt,
  Search,
  Send,
  Trash2,
  FileCheck,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
  Trash,
  Package,
  Calculator,
  User,
  Calendar,
  CreditCard
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
  ProformaFormState,
  ProformaItem,
  ProformaConvertirInput,
} from "@/src/modules/proformas/types/proformas.types";
import { proformasService } from "@/src/modules/proformas/services/proformas.service";
import { toProformaFormState } from "@/src/modules/proformas/utils/proformas-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { Loader } from "@/src/components/ui/loader";

interface ProformasPanelProps {
  showPanel?: boolean;
}

const initialFormState: ProformaFormState = {
  id_punto_emision: 0,
  id_cliente: 0,
  fecha_emision: new Date().toISOString().split("T")[0],
  fecha_vencimiento: "",
  observaciones: "",
  detalles: [{ codigo: "", descripcion: "", cantidad: 1, precio_unitario: 0, descuento: 0, codigo_iva: "2", porcentaje_iva: 12 }],
};

const codigosIva = [
  { value: "0", label: "0%", porcentaje: 0 },
  { value: "2", label: "12%", porcentaje: 12 },
  { value: "3", label: "14%", porcentaje: 14 },
  { value: "4", label: "15%", porcentaje: 15 },
  { value: "5", label: "5%", porcentaje: 5 },
  { value: "6", label: "No objeto de impuesto", porcentaje: 0 },
  { value: "7", label: "Exento de IVA", porcentaje: 0 },
];

const formasPago = [
  { value: "01", label: "SIN SISTEMA FINANCIERO" },
  { value: "15", label: "COMPENSACION DE DEUDAS" },
  { value: "16", label: "TARJETA DE DEBITO" },
  { value: "17", label: "DINERO ELECTRONICO" },
  { value: "18", label: "TARJETA PREPAGO" },
  { value: "19", label: "TARJETA DE CREDITO" },
  { value: "20", label: "OTROS CON UTILIZACION SISTEMA FINANCIERO" },
  { value: "21", label: "ENDOSO DE TITULOS" },
];

const tiposPago = [
  { value: "CONTADO", label: "Contado" },
  { value: "CREDITO", label: "Crédito" },
];

export function ProformasPanel({ showPanel = true }: ProformasPanelProps) {
  const [proformas, setProformas] = useState<ProformaItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [editing, setEditing] = useState<ProformaItem | null>(null);
  const [viewing, setViewing] = useState<ProformaItem | null>(null);
  const [converting, setConverting] = useState<ProformaItem | null>(null);
  const [form, setForm] = useState<ProformaFormState>(initialFormState);
  const [convertForm, setConvertForm] = useState<ProformaConvertirInput>({
    forma_pago: "01",
    tipo_pago: "CONTADO",
    fecha_emision: new Date().toISOString().split("T")[0],
  });

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadProformas();
    loadCatalogs();
  }, []);

  const loadProformas = async () => {
    setLoading(true);
    try {
      const data = await proformasService.listProformas();
      setProformas(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar proformas");
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
    if (!filterEstado) return proformas;
    return proformas.filter((p) => p.estado === filterEstado);
  }, [proformas, filterEstado]);

  const columns = useMemo<ColumnDef<ProformaItem>[]>(() => [
    {
      accessorKey: "numero",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Número <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.numero || "Borrador"}</div>
          <div className="text-xs text-slate-500">{row.original.secuencial || ""}</div>
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
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Emisión <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_emision}</span>,
    },
    {
      accessorKey: "fecha_vencimiento",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Vencimiento <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_vencimiento || "-"}</span>,
    },
    {
      accessorKey: "importe_total",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-700">{formatCurrency(row.original.importe_total)}</span>,
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                  <MoreVertical size={16} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetail(p)}><Eye size={14} className="mr-2" /> Ver detalle</DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/api/proformas/${p.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700"><FileText size={14} className="mr-2" /> Descargar PDF</DropdownMenuItem>
                {canConvertir(p) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openConvert(p)} className="text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700 font-medium"><FileCheck size={14} className="mr-2" /> Convertir a Factura</DropdownMenuItem></>)}
                {canEditDelete(p) && (<><DropdownMenuSeparator /><DropdownMenuItem onClick={() => openEdit(p)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem><DropdownMenuItem onClick={() => handleDelete(p)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem></>)}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleToggleEstado(p)}><Power size={14} className="mr-2" /> Cambiar estado</DropdownMenuItem>
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

  const canEditDelete = (prof: ProformaItem) =>
    prof.estado === "PENDIENTE" || prof.estado === "RECHAZADA";

  const canConvertir = (prof: ProformaItem) => prof.estado === "PENDIENTE";

  const openCreate = () => {
    setEditing(null);
    setForm(initialFormState);
    setModalOpen(true);
  };

  const openEdit = (prof: ProformaItem) => {
    setEditing(prof);
    setForm(toProformaFormState(prof));
    setModalOpen(true);
  };

  const openDetail = (prof: ProformaItem) => {
    setViewing(prof);
    setDetailOpen(true);
  };

  const openConvert = (prof: ProformaItem) => {
    setConverting(prof);
    setConvertForm({
      forma_pago: "01",
      tipo_pago: "CONTADO",
      fecha_emision: new Date().toISOString().split("T")[0],
    });
    setConvertOpen(true);
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

  const closeConvert = () => {
    setConvertOpen(false);
    setConverting(null);
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
    if (form.detalles.length === 0 || form.detalles.every((d) => !d.descripcion && !d.id_producto)) {
      toast.error("Agregue al menos un producto a la proforma");
      return false;
    }
    const invalidDetalle = form.detalles.find((d) => d.cantidad <= 0);
    if (invalidDetalle) {
      toast.error("Todos los detalles deben tener cantidad mayor a 0");
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
        await proformasService.updateProforma(editing.id, payload);
        toast.success("Proforma actualizada");
      } else {
        await proformasService.createProforma(payload);
        toast.success("Proforma creada");
      }
      closeModal();
      loadProformas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async (prof: ProformaItem) => {
    if (!confirm(`¿Eliminar la proforma ${prof.numero || prof.id}?`)) return;
    try {
      await proformasService.deleteProforma(prof.id);
      toast.success("Proforma eliminada");
      loadProformas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleEstado = async (prof: ProformaItem) => {
    try {
      await proformasService.toggleEstado(prof.id);
      toast.success("Estado actualizado");
      loadProformas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleConvertir = async () => {
    if (!converting) return;
    try {
      await proformasService.convertirAFactura(converting.id, convertForm);
      toast.success("Proforma convertida a factura exitosamente");
      closeConvert();
      loadProformas();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al convertir a factura");
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

  const updateDetalle = (idx: number, updates: Partial<ProformaFormState["detalles"][0]>) => {
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

  const handleIvaChange = (idx: number, codigo: string) => {
    const ivaOption = codigosIva.find((i) => i.value === codigo);
    updateDetalle(idx, { codigo_iva: codigo, porcentaje_iva: ivaOption?.porcentaje || 0 });
  };

  const calcularTotales = () => {
    return form.detalles.reduce(
      (acc, d) => {
        const subtotal = d.cantidad * d.precio_unitario;
        const descuento = (subtotal * d.descuento) / 100;
        const base = subtotal - descuento;
        const iva = (base * d.porcentaje_iva) / 100;
        const total = base + iva;
        return {
          subtotal: acc.subtotal + base,
          descuento: acc.descuento + descuento,
          iva: acc.iva + iva,
          total: acc.total + total,
        };
      },
      { subtotal: 0, descuento: 0, iva: 0, total: 0 }
    );
  };

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-blue-100 text-blue-700";
      case "FACTURADA":
        return "bg-emerald-100 text-emerald-700";
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

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "$0.00";
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
  };

  if (!showPanel) return null;

  const totales = calcularTotales();

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar proforma..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
            <Plus size={15} className="mr-1.5" /> Nueva Proforma
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
                  {["TODOS", "PENDIENTE", "FACTURADA", "RECHAZADA", "INACTIVO"].map((e) => (
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
        <div className="py-12"><Loader label="Cargando proformas..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay proformas para este filtro.</p>
          <Button className="mt-3 h-9 shadow-none" onClick={openCreate}><Plus size={15} className="mr-1.5" /> Nueva Proforma</Button>
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
                  <FileText className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar proforma" : "Crear nueva proforma"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos de la proforma y sus productos."
                      : "Registra una nueva proforma con los datos del cliente y los productos."}
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
                {/* Fila 1: Punto de emisión y Cliente */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Punto de emisión *" htmlFor="prof-punto">
                    <SelectPrimitive.Root 
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="prof-punto"
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

                  <Field label="Cliente *" htmlFor="prof-cliente">
                    <SelectPrimitive.Root 
                      value={form.id_cliente === 0 ? undefined : form.id_cliente.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_cliente: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="prof-cliente"
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
                </div>

                {/* Fila 2: Fechas y Observaciones */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Fecha emisión *" htmlFor="prof-fecha">
                    <Input
                      id="prof-fecha"
                      type="date"
                      value={form.fecha_emision}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_emision: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Fecha vencimiento" htmlFor="prof-venc">
                    <Input
                      id="prof-venc"
                      type="date"
                      value={form.fecha_vencimiento}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_vencimiento: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>

                  <Field label="Observaciones" htmlFor="prof-obs">
                    <Input
                      id="prof-obs"
                      value={form.observaciones}
                      onChange={(event) => setForm((f) => ({ ...f, observaciones: event.target.value }))}
                      placeholder="Notas u observaciones adicionales"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
                  </Field>
                </div>
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
                        <Field label="Producto" htmlFor={`prof-prod-${idx}`}>
                          <SelectPrimitive.Root
                            value={detalle.id_producto ? detalle.id_producto.toString() : undefined}
                            onValueChange={(val) => handleProductoChange(idx, Number(val))}
                          >
                            <SelectPrimitive.Trigger
                              id={`prof-prod-${idx}`}
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
                        <Field label="Código" htmlFor={`prof-cod-${idx}`}>
                          <Input
                            id={`prof-cod-${idx}`}
                            value={detalle.codigo}
                            onChange={(event) => updateDetalle(idx, { codigo: event.target.value })}
                            placeholder="COD-001"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="flex-1 min-w-0">
                        <Field label="Descripción" htmlFor={`prof-desc-${idx}`}>
                          <Input
                            id={`prof-desc-${idx}`}
                            value={detalle.descripcion}
                            onChange={(event) => updateDetalle(idx, { descripcion: event.target.value })}
                            placeholder="Descripción del producto"
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </Field>
                      </div>

                      <div className="w-20 shrink-0">
                        <Field label="Cantidad" htmlFor={`prof-cant-${idx}`}>
                          <Input
                            id={`prof-cant-${idx}`}
                            type="number"
                            min={1}
                            value={detalle.cantidad}
                            onChange={(event) => updateDetalle(idx, { cantidad: Number(event.target.value) })}
                            className="bg-white shadow-none"
                          />
                        </Field>
                      </div>

                      <div className="w-28 shrink-0">
                        <Field label="Precio" htmlFor={`prof-precio-${idx}`}>
                          <Input
                            id={`prof-precio-${idx}`}
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

                {/* Totales */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Calculator className="h-3.5 w-3.5 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">Totales</h4>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totales.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Descuento:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totales.descuento)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IVA:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totales.iva)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t border-slate-200 pt-2 mt-2">
                    <span className="text-slate-800">Total:</span>
                    <span className="text-slate-900">{formatCurrency(totales.total)}</span>
                  </div>
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
                  {editing ? "Guardar cambios" : "Crear proforma"}
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
                    Proforma {viewing?.numero}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la proforma registrada.
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
                        <div className="font-semibold text-slate-800">{viewing.numero || "-"}</div>
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
                        <div className="text-xs text-slate-500 mb-0.5">Vencimiento</div>
                        <div className="text-slate-800">{viewing.fecha_vencimiento || "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Cliente */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
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
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                      <div className="text-xs text-slate-500 mb-0.5">Observaciones</div>
                      <div className="text-sm text-slate-800">{viewing.observaciones || "Sin observaciones"}</div>
                    </div>
                  </div>

                  {/* SECCIÓN: Totales */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Totales</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Subtotal</div>
                        <div className="text-sm font-medium text-slate-800">{formatCurrency(viewing.subtotal_sin_impuestos)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Descuento</div>
                        <div className="text-sm text-slate-800">{formatCurrency(viewing.total_descuento)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">IVA</div>
                        <div className="text-sm text-slate-800">{formatCurrency(viewing.total_iva)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Total</div>
                        <div className="text-sm font-semibold text-slate-800">{formatCurrency(viewing.importe_total)}</div>
                      </div>
                    </div>
                  </div>

                  {/* SECCIÓN: Detalles */}
                  {viewing.detalles && viewing.detalles.length > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Detalles ({viewing.detalles.length})</h3>
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
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">P.Unit</div>
                              <div className="text-sm text-slate-800">{formatCurrency(d.precio_unitario)}</div>
                            </div>
                            <div className="w-24 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Total</div>
                              <div className="text-sm font-medium text-slate-800">{formatCurrency(d.total)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 pt-2">
                    {viewing.estado === "PENDIENTE" && (
                      <Button 
                        variant="secondary" 
                        onClick={() => openConvert(viewing)}
                        className="h-10 px-4"
                      >
                        <FileCheck className="mr-1.5 h-4 w-4" />
                        Convertir a Factura
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

      <Dialog.Root open={convertOpen} onOpenChange={setConvertOpen}>
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
                  <FileCheck className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Convertir Proforma a Factura
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Configure los datos de pago para convertir la proforma {converting?.numero} en una factura.
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 space-y-5">
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos de pago</h3>
                </div>

                <Field label="Forma de Pago *" htmlFor="conv-forma">
                  <SelectPrimitive.Root 
                    value={convertForm.forma_pago} 
                    onValueChange={(val) => setConvertForm((f) => ({ ...f, forma_pago: val }))}
                  >
                    <SelectPrimitive.Trigger 
                      id="conv-forma"
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
                              <SelectPrimitive.ItemText>{f.value} - {f.label}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <Field label="Tipo de Pago *" htmlFor="conv-tipo">
                  <SelectPrimitive.Root 
                    value={convertForm.tipo_pago} 
                    onValueChange={(val) => setConvertForm((f) => ({ ...f, tipo_pago: val }))}
                  >
                    <SelectPrimitive.Trigger 
                      id="conv-tipo"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <SelectPrimitive.Value />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content 
                        className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectPrimitive.Viewport className="p-1">
                          {tiposPago.map((t) => (
                            <SelectPrimitive.Item 
                              key={t.value}
                              value={t.value}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{t.label}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <Field label="Fecha de Emisión (Factura)" htmlFor="conv-fecha">
                  <Input
                    id="conv-fecha"
                    type="date"
                    value={convertForm.fecha_emision}
                    onChange={(event) => setConvertForm((f) => ({ ...f, fecha_emision: event.target.value }))}
                    className="bg-white shadow-none"
                  />
                </Field>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="secondary" 
                  onClick={closeConvert}
                  className="h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleConvertir}
                  className="h-10 px-4"
                >
                  <FileCheck className="mr-1.5 h-4 w-4" />
                  Convertir a Factura
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
