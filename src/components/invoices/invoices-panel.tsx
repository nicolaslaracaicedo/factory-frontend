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
import { FileText, Eye, Edit3, Plus, PlusCircle, Send, Trash2, Search, ChevronLeft, ChevronRight, X, FileCheck, Copy, ChevronsUpDown, ArrowUp, ArrowDown, ChevronDown, ListFilter, MoreVertical, Printer, Trash, Package, User, Calculator, Tag, Box, RefreshCw, DollarSign } from "lucide-react";
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
  FacturaDetalleDraft,
  FacturaFormState,
  FacturaItem,
} from "@/src/modules/invoices/types/invoice.types";
import {
  toFacturaFormState,
} from "@/src/modules/invoices/utils/invoice-payload.utils";
import { invoiceService } from "@/src/modules/invoices/services/invoice.service";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";
import { Loader } from "@/src/components/ui/loader";
import { Switch } from "@/src/components/ui/switch";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { ClientFormModal } from "@/src/components/clients/client-form-modal";
import { ProductFormModal } from "@/src/components/products/product-form-modal";

const initialDetail = (): FacturaDetalleDraft => ({
  mode: "CATALOGO",
  id_producto: 0,
  cantidad: 1,
  descuento: "",
  tipo_descuento: "PORCENTAJE",
  codigo: "",
  descripcion: "",
  precio_unitario: 0,
  codigo_iva: "2",
  porcentaje_iva: 12,
});

const initialForm: FacturaFormState = {
  id_punto_emision: 0,
  id_cliente: 0,
  cliente_mode: "REGISTRADO",
  cli_identificacion: "",
  cli_razon_social: "",
  cli_direccion: "",
  cli_telefono: "",
  cli_email: "",
  fecha_emision: "",
  forma_pago: "01",
  tipo_pago: "CONTADO",
  dias_plazo: 0,
  monto_recibido: 0,
  observacion: "",
  detalles: [initialDetail()],
  datos_adicionales: [],
};

const estadoFilters = ["TODOS", "BORRADOR", "AUTORIZADO", "RECHAZADA", "INACTIVO"] as const;
const tipoPagoOptions = ["CONTADO", "CREDITO"] as const;
const formaPagoOptions = [
  { value: "01", label: "01 - Efectivo" },
  { value: "19", label: "19 - Tarjeta" },
  { value: "20", label: "20 - Transferencia" },
];
type EstadoFiltro = (typeof estadoFilters)[number];
type TipoPago = (typeof tipoPagoOptions)[number];

interface InvoicesPanelProps {
  showPanel?: boolean;
}

export function InvoicesPanel({ showPanel = true }: InvoicesPanelProps) {
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [productoQueries, setProductoQueries] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<FacturaItem | null>(null);
  const [detail, setDetail] = useState<FacturaItem | null>(null);
  const [form, setForm] = useState<FacturaFormState>(initialForm);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [emissionInfoOpen, setEmissionInfoOpen] = useState(false);
  const [emissionData, setEmissionData] = useState<FacturaItem | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const { setBreadcrumbs, setHeaderVisible } = useBreadcrumbs();
  const { setActiveSection } = useDashboardSection();

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

  // Columnas para react-table
  const columns = useMemo<ColumnDef<FacturaItem>[]>(() => [
    {
      accessorKey: "numero",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Factura
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.numero || `Factura #${row.original.id}`}</div>
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
          {row.original.estado || "ACTIVO"}
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
                    <Edit3 size={14} className="mr-2" />
                    Gestionar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteFactura(row.original)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                    <Trash2 size={14} className="mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
              {row.original.estado?.toUpperCase() !== "AUTORIZADO" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => emitirFactura(row.original)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                    <Send size={14} className="mr-2" />
                    Emitir
                  </DropdownMenuItem>
                </>
              )}
              {row.original.estado?.toUpperCase() === "AUTORIZADO" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(`/api/facturas/${row.original.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Factura PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/facturas/${row.original.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
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
  ], [clientes, puntos]);

  const table = useReactTable({
    data: facturas,
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
        const [clientesData, puntosData, productosData, ivaData] = await Promise.all([
          clientService.listClientes("ACTIVO"),
          emissionPointService.listPuntos("ACTIVO"),
          productService.listProductos("ACTIVO"),
          ivaService.listCodigos(true),
        ]);
        setClientes(clientesData);
        setPuntos(puntosData);
        setProductos(productosData);
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
    if (editorOpen) {
      const navigateTo = (section: string) => {
        closeEditor();
        setActiveSection(section);
      };

      setHeaderVisible(false);
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Facturas", onClick: () => navigateTo("facturas") },
        { label: editing ? "Editar factura" : "Nueva factura" },
      ]);
    } else {
      setHeaderVisible(true);
      setBreadcrumbs(null);
    }

    return () => {
      setHeaderVisible(true);
      setBreadcrumbs(null);
    };
  }, [editorOpen, editing, setBreadcrumbs, setHeaderVisible, setActiveSection]);

  useEffect(() => {
    const loadFacturas = async () => {
      setLoading(true);
      try {
        const data = await invoiceService.listFacturas();
        const filtered =
          filter === "TODOS"
            ? data
            : data.filter((item) => item.estado?.toUpperCase() === filter);
        setFacturas(filtered);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar las facturas.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadFacturas();
  }, [filter]);

  const refresh = async () => {
    try {
      const data = await invoiceService.listFacturas();
      const filtered =
        filter === "TODOS"
          ? data
          : data.filter((item) => item.estado?.toUpperCase() === filter);
      setFacturas(filtered);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las facturas.";
      toast.error(message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_punto_emision: puntos[0]?.id ?? 0,
      id_cliente: clientes[0]?.id ?? 0,
      fecha_emision: new Date().toISOString().slice(0, 10),
      detalles: [initialDetail()],
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(initialForm);
  };

  const openEdit = async (factura: FacturaItem) => {
    try {
      const data = await invoiceService.getFactura(factura.id);
      setEditing(data);
      setForm(toFacturaFormState(data));
      setEditorOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar la factura.";
      toast.error(message);
    }
  };

  const openDetail = async (factura: FacturaItem) => {
    try {
      const data = await invoiceService.getFactura(factura.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof FacturaFormState, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setClienteMode = (mode: FacturaFormState["cliente_mode"]) => {
    setForm((prev) => ({
      ...prev,
      cliente_mode: mode,
      id_cliente: mode === "REGISTRADO" ? prev.id_cliente : 0,
      cli_identificacion: mode === "MANUAL" ? prev.cli_identificacion : "",
      cli_razon_social: mode === "MANUAL" ? prev.cli_razon_social : "",
      cli_direccion: mode === "MANUAL" ? prev.cli_direccion : "",
      cli_telefono: mode === "MANUAL" ? prev.cli_telefono : "",
      cli_email: mode === "MANUAL" ? prev.cli_email : "",
    }));
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      id_punto_emision: puntos[0]?.id ?? 0,
      fecha_emision: new Date().toISOString().slice(0, 10),
      detalles: [initialDetail()],
    });
    setClienteQuery("");
    setProductoQueries({});
  };

  const getProductoQuery = (index: number) => productoQueries[index] ?? "";

  const setProductoQuery = (index: number, value: string) => {
    setProductoQueries((prev) => ({
      ...prev,
      [index]: value,
    }));
  };

  const updateDetail = (index: number, field: keyof FacturaDetalleDraft, value: string | number) => {
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

  const addDatoAdicional = () => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: [...prev.datos_adicionales, { nombre: "", valor: "" }],
    }));
  };

  const updateDatoAdicional = (index: number, field: "nombre" | "valor", value: string) => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: prev.datos_adicionales.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeDatoAdicional = (index: number) => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: prev.datos_adicionales.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = () => {
    const detalles = form.detalles.map((item) => {
      const producto = getProductoById(item.id_producto);
      return {
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        descuento: getDescuentoValor(item),
        codigo_ice: producto?.codigo_ice || undefined,
        porcentaje_ice: producto?.tiene_ice ? (producto.porcentaje_ice ?? 0) : undefined,
        valor_unitario_irbpnr: producto?.tiene_irbpnr ? (producto.valor_unitario_irbpnr ?? 0) : undefined,
      };
    });

    const payload = {
      id_punto_emision: form.id_punto_emision,
      consumidor_final: form.cliente_mode === "CONSUMIDOR_FINAL",
      id_cliente: form.cliente_mode === "REGISTRADO" ? form.id_cliente : undefined,
      cli_identificacion: form.cliente_mode === "MANUAL" ? form.cli_identificacion : undefined,
      cli_razon_social: form.cliente_mode === "MANUAL" ? form.cli_razon_social : undefined,
      cli_direccion: form.cliente_mode === "MANUAL" ? form.cli_direccion : undefined,
      cli_telefono: form.cliente_mode === "MANUAL" ? form.cli_telefono : undefined,
      cli_email: form.cliente_mode === "MANUAL" ? form.cli_email : undefined,
      fecha_emision: form.fecha_emision,
      forma_pago: form.forma_pago,
      tipo_pago: form.tipo_pago,
      dias_plazo: form.dias_plazo,
      monto_recibido: form.monto_recibido,
      observacion: form.observacion,
      detalles,
      datos_adicionales: form.datos_adicionales.filter(
        (item) => item.nombre.trim() || item.valor.trim()
      ),
    };

    return payload;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.id_punto_emision) {
      toast.warning("Selecciona un punto de emisión.");
      return;
    }
    if (form.cliente_mode === "REGISTRADO" && !form.id_cliente) {
      toast.warning("Selecciona un cliente.");
      return;
    }
    if (form.cliente_mode === "MANUAL") {
      if (!form.cli_identificacion.trim() || !form.cli_razon_social.trim() || !form.cli_email.trim()) {
        toast.warning("Completa identificación, razón social y correo del cliente.");
        return;
      }
    }
    if (form.detalles.length === 0) {
      toast.warning("Agrega al menos un detalle.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await invoiceService.updateFactura(editing.id, payload);
        toast.success("Factura actualizada.");
      } else {
        await invoiceService.createFactura(payload);
        toast.success("Factura creada.");
      }
      await refresh();
      closeEditor();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la factura.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (factura: FacturaItem) => {
    try {
      await invoiceService.toggleEstado(factura.id);
      await refresh();
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const emitirFactura = async (factura: FacturaItem) => {
    try {
      const emittedFactura = await invoiceService.emitirFactura(factura.id);
      await refresh();
      toast.success("Factura emitida.");
      setEmissionData(emittedFactura);
      setEmissionInfoOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo emitir la factura.";
      toast.error(message);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles.`);
    } catch {
      toast.error(`No se pudo copiar ${label}.`);
    }
  };

  const deleteFactura = async (factura: FacturaItem) => {
    try {
      await invoiceService.deleteFactura(factura.id);
      await refresh();
      toast.success("Factura eliminada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la factura.";
      toast.error(message);
    }
  };

  const getClienteLabel = (clienteId?: number, fallback?: string) => {
    if (!clienteId) return fallback || "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || fallback || "-";
  };

  const getProductoLabel = (productoId?: number, fallback?: string) => {
    if (!productoId) return fallback || "-";
    const producto = productos.find((item) => item.id === productoId);
    return producto?.descripcion || fallback || "-";
  };

  const getProductoById = (productoId?: number) => {
    if (!productoId) return undefined;
    return productos.find((item) => item.id === productoId);
  };

  const getIvaLabel = (ivaId?: number) => {
    if (!ivaId) return "-";
    const iva = codigosIva.find((item) => item.id === ivaId);
    return iva ? `${iva.codigo} - ${iva.nombre}` : "-";
  };

  const formatMoney = (value: number) => {
    return value.toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getDescuentoValor = (detalle: FacturaDetalleDraft) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const precio = getProductoById(detalle.id_producto)?.precio ?? 0;
    const raw = Math.max(Number(detalle.descuento) || 0, 0);
    if (detalle.tipo_descuento === "PORCENTAJE") {
      return (cantidad * precio) * (raw / 100);
    }
    return raw;
  };

  const getDetalleSubtotal = (detalle: FacturaDetalleDraft) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const precio = getProductoById(detalle.id_producto)?.precio ?? 0;
    const descuentoValor = getDescuentoValor(detalle);
    const subtotal = cantidad * precio - descuentoValor;
    return subtotal < 0 ? 0 : subtotal;
  };

  const getDetalleIvaPercent = (detalle: FacturaDetalleDraft) => {
    const producto = getProductoById(detalle.id_producto);
    const iva = codigosIva.find((item) => item.id === producto?.id_iva);
    return iva?.porcentaje ?? 0;
  };

  const getDetalleTotal = (detalle: FacturaDetalleDraft) => {
    const base = getDetalleSubtotal(detalle);
    const ivaPct = getDetalleIvaPercent(detalle);
    const iva = (base * ivaPct) / 100;
    const producto = getProductoById(detalle.id_producto);
    const cantidad = Number(detalle.cantidad) || 0;
    const ice = producto?.tiene_ice
      ? (base * (producto.porcentaje_ice ?? 0)) / 100
      : 0;
    const irbpnr = producto?.tiene_irbpnr
      ? cantidad * (producto.valor_unitario_irbpnr ?? 0)
      : 0;
    return base + iva + ice + irbpnr;
  };

  interface PorIvaRate {
    pct: number;
    monto: number;
  }
  const totales = form.detalles.reduce<{
    subtotal: number;
    descuento: number;
    iva: number;
    ice: number;
    irbpnr: number;
    icePcts: number[];
    irbpnrValues: number[];
    total: number;
    ivaPorRates: Record<string, PorIvaRate>;
  }>(
    (acc, detalle) => {
      const descuento = Math.max(Number(detalle.descuento) || 0, 0);
      const base = getDetalleSubtotal(detalle);
      const ivaPct = getDetalleIvaPercent(detalle);
      const iva = (base * ivaPct) / 100;
      const producto = getProductoById(detalle.id_producto);
      const icePct = producto?.porcentaje_ice ?? 0;
      const irbpnrVal = producto?.valor_unitario_irbpnr ?? 0;
      const ice = producto?.tiene_ice
        ? (base * icePct) / 100
        : 0;
      const irbpnr = producto?.tiene_irbpnr
        ? (Number(detalle.cantidad) || 0) * irbpnrVal
        : 0;
      const key = ivaPct.toString();
      const prev = acc.ivaPorRates[key] ?? { pct: ivaPct, monto: 0 };
      return {
        subtotal: acc.subtotal + base,
        descuento: acc.descuento + descuento,
        iva: acc.iva + iva,
        ice: acc.ice + ice,
        icePcts: producto?.tiene_ice
          ? acc.icePcts.includes(icePct) ? acc.icePcts : [...acc.icePcts, icePct]
          : acc.icePcts,
        irbpnr: acc.irbpnr + irbpnr,
        irbpnrValues: producto?.tiene_irbpnr
          ? acc.irbpnrValues.includes(irbpnrVal) ? acc.irbpnrValues : [...acc.irbpnrValues, irbpnrVal]
          : acc.irbpnrValues,
        total: acc.total + base + iva + ice + irbpnr,
        ivaPorRates: { ...acc.ivaPorRates, [key]: { ...prev, monto: prev.monto + iva } },
      };
    },
    { subtotal: 0, descuento: 0, iva: 0, ice: 0, irbpnr: 0, icePcts: [], irbpnrValues: [], total: 0, ivaPorRates: {} }
  );

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  const normalizedClienteQuery = clienteQuery.trim().toLowerCase();
  const filteredClientes = normalizedClienteQuery
    ? clientes.filter((cliente) =>
        [cliente.razon_social, cliente.identificacion]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedClienteQuery))
      )
    : clientes;

  const getFilteredProductos = (index: number) => {
    const normalizedQuery = getProductoQuery(index).trim().toLowerCase();
    if (!normalizedQuery) return productos;
    return productos.filter((producto) =>
      [producto.descripcion, producto.codigo]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  };

  if (!showPanel) return null;

  if (editorOpen) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" type="button" onClick={closeEditor} className="h-10 w-10 p-0 text-slate-600 bg-slate-100 hover:bg-slate-200">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-900">
                {editing ? "Editar factura" : "Nueva factura"}
              </p>
              <p className="text-xs text-slate-500">
                Completa los datos y agrega los productos antes de guardar.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" type="button" onClick={resetForm} className="h-9 px-3 text-xs">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Limpiar
            </Button>
          </div>
        </div>

        <form className="space-y-6" onSubmit={submitForm}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
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
                          className="z-50 min-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
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

                  <Field label="Tipo de pago *" htmlFor="tipo_pago">
                    <SelectPrimitive.Root
                      value={form.tipo_pago}
                      onValueChange={(val) => updateField("tipo_pago", val)}
                    >
                      <SelectPrimitive.Trigger
                        id="tipo_pago"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value />
                        <SelectPrimitive.Icon>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content
                          className="z-50 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <SelectPrimitive.Viewport className="p-1">
                            {tipoPagoOptions.map((tipo) => (
                              <SelectPrimitive.Item
                                key={tipo}
                                value={tipo}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{tipo}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Forma de pago *" htmlFor="forma_pago">
                    <SelectPrimitive.Root
                      value={form.forma_pago}
                      onValueChange={(val) => updateField("forma_pago", val)}
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
                          className="z-50 min-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                          position="popper"
                          sideOffset={4}
                        >
                          <SelectPrimitive.Viewport className="p-1">
                            {formaPagoOptions.map((option) => (
                              <SelectPrimitive.Item
                                key={option.value}
                                value={option.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  {form.tipo_pago === "CREDITO" ? (
                    <Field label="Días de plazo" htmlFor="dias_plazo">
                      <Input
                        id="dias_plazo"
                        type="number"
                        min={0}
                        value={form.dias_plazo}
                        onChange={(event) => updateField("dias_plazo", Number(event.target.value))}
                        className="bg-white shadow-none"
                      />
                    </Field>
                  ) : null}

                  <Field label="Observación" htmlFor="observacion">
                    <Input
                      id="observacion"
                      value={form.observacion}
                      onChange={(event) => updateField("observacion", event.target.value)}
                      placeholder="Notas u observaciones adicionales"
                      className="bg-white shadow-none placeholder:text-slate-300"
                    />
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Consumidor final</span>
                    <Switch
                      checked={form.cliente_mode === "CONSUMIDOR_FINAL"}
                      onCheckedChange={(checked) => setClienteMode(checked ? "CONSUMIDOR_FINAL" : "REGISTRADO")}
                    />
                  </div>
                </div>

                {form.cliente_mode !== "CONSUMIDOR_FINAL" && (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
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
                              className="z-50 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] max-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                              position="popper"
                              sideOffset={4}
                            >
                              <div className="border-b border-slate-100 p-2">
                                <Input
                                  value={clienteQuery}
                                  onChange={(event) => setClienteQuery(event.target.value)}
                                  placeholder="Razón social o nombre cliente"
                                  className="h-8 bg-white shadow-none"
                                  onKeyDown={(event) => event.stopPropagation()}
                                  onPointerDown={(event) => event.stopPropagation()}
                                />
                              </div>
                              <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                                {filteredClientes.length === 0 ? (
                                  <div className="px-3 py-2 text-xs text-slate-500">Sin resultados.</div>
                                ) : (
                                  filteredClientes.map((cliente) => (
                                    <SelectPrimitive.Item
                                      key={cliente.id}
                                      value={cliente.id.toString()}
                                      className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                    >
                                      <SelectPrimitive.ItemText>
                                        {cliente.razon_social} · {cliente.identificacion}
                                      </SelectPrimitive.ItemText>
                                    </SelectPrimitive.Item>
                                  ))
                                )}
                              </SelectPrimitive.Viewport>
                            </SelectPrimitive.Content>
                          </SelectPrimitive.Portal>
                        </SelectPrimitive.Root>
                      </Field>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setClientModalOpen(true)}
                      className="h-9 px-3 mb-0.5 shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nuevo
                    </Button>
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
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Descuento:</span>
                      <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              detalles: prev.detalles.map((d) => ({ ...d, tipo_descuento: "PORCENTAJE" as const })),
                            }))
                          }
                          className={`flex h-7 w-8 items-center justify-center rounded text-xs font-bold transition-colors ${
                            form.detalles[0]?.tipo_descuento === "PORCENTAJE"
                              ? "bg-sky-500 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title="Descuento en porcentaje"
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              detalles: prev.detalles.map((d) => ({ ...d, tipo_descuento: "VALOR" as const })),
                            }))
                          }
                          className={`flex h-7 w-8 items-center justify-center rounded text-xs font-bold transition-colors ${
                            form.detalles[0]?.tipo_descuento === "VALOR"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                          title="Descuento en valor monetario"
                        >
                          $
                        </button>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={() => setProductModalOpen(true)} className="h-9 px-3">
                      <Box className="mr-1.5 h-4 w-4" />
                      Crear producto
                    </Button>
                    <Button type="button" variant="secondary" onClick={addDetail} className="h-9 px-3">
                      <PlusCircle className="mr-1.5 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <div className="min-w-[860px]">
                    <div className="hidden lg:grid lg:grid-cols-[55px_minmax(150px,1fr)_44px_75px_72px_58px_62px_48px_82px_44px] lg:gap-2 bg-slate-50 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <span>Código</span>
                      <span>Descripción</span>
                      <span>Cant.</span>
                      <span>Precio</span>
                      <span>IVA</span>
                      <span>ICE</span>
                      <span>IRBPNR</span>
                      <span>Desc.</span>
                      <span>Total</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-200">
                      {form.detalles.map((detalle, index) => {
                        const producto = getProductoById(detalle.id_producto);
                        const detalleTotal = getDetalleTotal(detalle);
                        const precioCatalogo = producto?.precio ?? 0;
                        return (
                          <div
                            key={`detalle-${index}`}
                            className="grid items-center gap-2 bg-white px-2 py-2 lg:grid-cols-[55px_minmax(150px,1fr)_44px_75px_72px_58px_62px_48px_82px_44px]"
                          >
                            <span className="text-xs text-slate-500 truncate">
                              {producto?.codigo || "-"}
                            </span>

                            <SelectPrimitive.Root
                              value={detalle.id_producto === 0 ? undefined : detalle.id_producto.toString()}
                              onValueChange={(val) => updateDetail(index, "id_producto", Number(val))}
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
                                  className="z-50 min-w-[300px] max-h-60 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                  position="popper"
                                  sideOffset={4}
                                >
                                  <div className="border-b border-slate-100 p-2">
                                    <Input
                                      value={getProductoQuery(index)}
                                      onChange={(event) => setProductoQuery(index, event.target.value)}
                                      placeholder="Nombre o codigo"
                                      className="h-8 bg-white shadow-none"
                                      onKeyDown={(event) => event.stopPropagation()}
                                      onPointerDown={(event) => event.stopPropagation()}
                                    />
                                  </div>
                                  <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                                    {getFilteredProductos(index).length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-slate-500">Sin resultados.</div>
                                    ) : (
                                      getFilteredProductos(index).map((item) => (
                                        <SelectPrimitive.Item
                                          key={item.id}
                                          value={item.id.toString()}
                                          className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                        >
                                          <SelectPrimitive.ItemText>
                                            {item.descripcion} · {item.codigo}
                                          </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                      ))
                                    )}
                                  </SelectPrimitive.Viewport>
                                </SelectPrimitive.Content>
                              </SelectPrimitive.Portal>
                            </SelectPrimitive.Root>

                            <Input
                              type="text"
                              inputMode="decimal"
                              value={detalle.cantidad}
                              onChange={(event) => {
                                let cleaned = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); }
                                updateDetail(index, "cantidad", cleaned === "" ? 0 : Number(cleaned));
                              }}
                              placeholder="Cant."
                              className="h-9 bg-white shadow-none"
                            />

                            <span className="text-sm text-slate-700">
                              {formatMoney(precioCatalogo)}
                            </span>

                            <span className="text-xs text-slate-500">
                              {getIvaLabel(producto?.id_iva)}
                            </span>

                            <span className="text-xs text-amber-600 font-medium">
                              {producto?.tiene_ice ? `${producto.porcentaje_ice}% · ${formatMoney(getDetalleSubtotal(detalle) * ((producto.porcentaje_ice ?? 0) / 100))}` : "-"}
                            </span>

                            <span className="text-xs text-purple-600 font-medium">
                              {producto?.tiene_irbpnr ? formatMoney((Number(detalle.cantidad) || 0) * (producto.valor_unitario_irbpnr ?? 0)) : "-"}
                            </span>

                            <Input
                              type="text"
                              inputMode="decimal"
                              value={detalle.descuento}
                              onChange={(event) => {
                                let cleaned = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); }
                                updateDetail(index, "descuento", cleaned);
                              }}
                              className="h-9 bg-white shadow-none"
                            />

                            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                              {formatMoney(detalleTotal)}
                            </span>

                            <button
                              type="button"
                              onClick={() => removeDetail(index)}
                              disabled={form.detalles.length === 1}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Datos adicionales */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Datos adicionales</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Añadir</span>
                    <Switch
                      checked={form.datos_adicionales.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) addDatoAdicional();
                        else setForm((prev) => ({ ...prev, datos_adicionales: [] }));
                      }}
                    />
                  </div>
                </div>

                {form.datos_adicionales.length > 0 && (
                  <div className="space-y-3">
                    {form.datos_adicionales.map((item, index) => (
                      <div key={`dato-${index}`} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                          <Input
                            placeholder="Ej: Contrato"
                            value={item.nombre}
                            onChange={(event) => updateDatoAdicional(index, "nombre", event.target.value)}
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Valor</label>
                          <Input
                            placeholder="Ej: CT-2026-001"
                            value={item.valor}
                            onChange={(event) => updateDatoAdicional(index, "valor", event.target.value)}
                            className="bg-white shadow-none placeholder:text-slate-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDatoAdicional(index)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600 transition-colors hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addDatoAdicional} className="h-9 px-3">
                      <PlusCircle className="mr-1.5 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Totales</h4>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Subtotal:</span>
                  <span className="font-medium text-slate-800">{formatMoney(totales.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Descuento:</span>
                  <span className="font-medium text-slate-800">{formatMoney(totales.descuento)}</span>
                </div>
                {totales.iva > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {Object.keys(totales.ivaPorRates).length === 1
                        ? `IVA (${Object.values(totales.ivaPorRates)[0].pct}%):`
                        : "IVA:"}
                    </span>
                    <span className="font-medium text-slate-800">{formatMoney(totales.iva)}</span>
                  </div>
                )}
                {totales.ice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {totales.icePcts.length === 1 ? `ICE (${totales.icePcts[0]}%):` : "ICE:"}
                    </span>
                    <span className="font-medium text-slate-800">{formatMoney(totales.ice)}</span>
                  </div>
                )}
                {totales.irbpnr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {totales.irbpnrValues.length === 1 ? `IRBPNR ($${totales.irbpnrValues[0].toFixed(2)}):` : "IRBPNR:"}
                    </span>
                    <span className="font-medium text-slate-800">{formatMoney(totales.irbpnr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-sky-700">{formatMoney(totales.total)}</span>
                </div>
              </div>

              {form.tipo_pago === "CONTADO" && form.forma_pago === "01" && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-slate-700">Finalizar Pago</h4>
                  </div>
                  <Field label="Monto recibido" htmlFor="monto_recibido">
                    <Input
                      id="monto_recibido"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.monto_recibido}
                      onChange={(event) => updateField("monto_recibido", Number(event.target.value))}
                      className="bg-white shadow-none h-9"
                      placeholder="0.00"
                    />
                  </Field>
                  <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-slate-600">Cambio:</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {form.monto_recibido > 0 ? formatMoney(form.monto_recibido - totales.total) : "$0.00"}
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" disabled={saving} className="h-10 w-full">
                  {saving ? "Guardando..." : "Guardar factura"}
                </Button>
              </div>
            </aside>
          </div>
        </form>

        <ClientFormModal
          open={clientModalOpen}
          onOpenChange={setClientModalOpen}
          onSuccess={(newClient) => {
            setClientes((prev) => [...prev, newClient]);
            setForm((prev) => ({ ...prev, id_cliente: newClient.id, cliente_mode: "REGISTRADO" }));
          }}
        />
        <ProductFormModal
          open={productModalOpen}
          onOpenChange={setProductModalOpen}
          onSuccess={(newProduct) => {
            setProductos((prev) => [...prev, newProduct]);
          }}
        />
      </section>
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
              placeholder="Buscar factura..."
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
            Nueva factura
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
                    <SelectPrimitive.ItemText>Factura</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="cliente_nombre" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Cliente</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="fecha_emision" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Fecha</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando facturas" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay facturas para este filtro.</p>
          <Button onClick={openCreate} disabled={loadingCatalogs} className="mt-3 h-9 shadow-none">
            <Plus size={15} className="mr-1.5" /> Crear factura
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
                    Detalle de factura
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la factura seleccionada.
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
                        <div className="text-xs text-slate-500 mb-0.5">Factura</div>
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
                        <div className="text-xs text-slate-500 mb-0.5">Forma de pago</div>
                        <div className="text-slate-800">{detail.forma_pago || "-"}</div>
                      </div>
                      {detail.monto_recibido != null && detail.monto_recibido > 0 && (
                        <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                          <div className="text-xs text-slate-500 mb-0.5">Monto recibido</div>
                          <div className="text-slate-800">${detail.monto_recibido.toFixed(2)}</div>
                        </div>
                      )}
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
                      {detail.cliente_identificacion && (
                        <div className="text-xs text-slate-500 mt-1">{detail.cliente_identificacion}</div>
                      )}
                    </div>
                  </div>

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
                              <div className="text-sm font-medium text-slate-800">{getProductoLabel(item.id_producto, item.descripcion)}</div>
                            </div>
                            <div className="w-16 shrink-0 text-right">
                              <div className="text-xs text-slate-500 mb-0.5">Cant.</div>
                              <div className="text-sm font-medium text-slate-800">{item.cantidad}</div>
                            </div>
                            {item.precio_unitario !== undefined && (
                              <div className="w-24 shrink-0 text-right">
                                <div className="text-xs text-slate-500 mb-0.5">P.Unit</div>
                                <div className="text-sm text-slate-800">${item.precio_unitario.toFixed(2)}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Sin detalles.</p>
                    )}
                  </div>

                  {/* SECCIÓN: Datos adicionales */}
                  {detail.datos_adicionales?.length ? (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Datos adicionales</h3>
                      </div>
                      <div className="space-y-2">
                        {detail.datos_adicionales.map((item, idx) => (
                          <div key={`dato-${idx}`} className="flex gap-2 rounded-lg border border-slate-200 bg-white p-2.5">
                            <div className="text-sm font-medium text-slate-700">{item.nombre}:</div>
                            <div className="text-sm text-slate-600">{item.valor}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

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

      <Dialog.Root open={emissionInfoOpen} onOpenChange={setEmissionInfoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0">
                  <FileCheck className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Factura Emitida
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    La factura ha sido autorizada por el SRI.
                  </Dialog.Description>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              {emissionData && (
                <>
                  {/* Clave de acceso */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold text-emerald-800">Clave de acceso</span>
                      <Button
                        variant="secondary"
                        onClick={() => copyToClipboard(emissionData.clave_acceso || "", "Clave de acceso")}
                        disabled={!emissionData.clave_acceso}
                        className="h-8 px-3 text-xs"
                      >
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copiar
                      </Button>
                    </div>
                    <p className="break-all font-mono text-xs text-emerald-700">
                      {emissionData.clave_acceso || "No disponible"}
                    </p>
                  </div>

                  {/* Información SRI */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Información SRI</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Número de comprobante</div>
                        <div className="text-sm font-semibold text-slate-800">{emissionData.numero_comprobante || emissionData.numero || "-"}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Número de autorización</div>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate font-mono text-xs text-slate-700 flex-1">{emissionData.numero_autorizacion || "-"}</p>
                          {emissionData.numero_autorizacion && (
                            <Button 
                              variant="ghost" 
                              className="h-7 w-7 p-0 shrink-0" 
                              onClick={() => copyToClipboard(emissionData.numero_autorizacion || "", "Número de autorización")}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Estado</div>
                        <div className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                          {emissionData.estado || "AUTORIZADO"}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Fecha de autorización</div>
                        <div className="text-sm text-slate-800">{emissionData.fecha_autorizacion ? new Date(emissionData.fecha_autorizacion).toLocaleString() : "-"}</div>
                      </div>
                    </div>
                  </div>

                  {/* PDF */}
                  {emissionData.pdf_url && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Documento PDF</h3>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <a
                          href={emissionData.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
                        >
                          <Printer className="h-4 w-4" />
                          Descargar PDF
                        </a>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end pt-2">
                <Button 
                  variant="secondary" 
                  type="button" 
                  onClick={() => setEmissionInfoOpen(false)}
                  className="h-10 px-4"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
