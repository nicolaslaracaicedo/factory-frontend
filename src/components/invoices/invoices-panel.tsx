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
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Eye, Edit3, Plus, PlusCircle, Send, Trash2, Search, ChevronLeft, ChevronRight, X, FileCheck, Copy, ChevronsUpDown, ArrowUp, ArrowDown, ChevronDown, ListFilter, MoreVertical, Printer, Trash, Package, User, Calculator, Tag, Box, RefreshCw, DollarSign, Mail } from "lucide-react";
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
import { DiscountToggle } from "@/src/components/ui/discount-toggle";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { ClientFormModal } from "@/src/components/clients/client-form-modal";
import { ProductFormModal } from "@/src/components/products/product-form-modal";
import { confirmAction } from "@/src/lib/confirm";

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

const estadoFilters = ["TODOS", "BORRADOR", "ENVIADO", "AUTORIZADO", "RECHAZADA", "ANULADA"] as const;
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
  readOnly?: boolean;
}

export function InvoicesPanel({ showPanel = true, readOnly = false }: InvoicesPanelProps) {
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Cliente[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const clientSearchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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
  const [montoStr, setMontoStr] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [emissionInfoOpen, setEmissionInfoOpen] = useState(false);
  const [emissionData, setEmissionData] = useState<FacturaItem | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailFactura, setEmailFactura] = useState<FacturaItem | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);
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
      case "ENVIADO": return "bg-blue-100 text-blue-700";
      case "ANULADA": return "bg-slate-100 text-slate-600";
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getEstadoColor(row.original.estado)}`}>
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
              {!readOnly && row.original.estado?.toUpperCase() === "BORRADOR" && (
                <DropdownMenuItem onClick={() => openEdit(row.original)}>
                  <Edit3 size={14} className="mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {row.original.estado?.toUpperCase() === "AUTORIZADO" && (
                <>
                  <DropdownMenuItem onClick={() => viewEmissionInfo(row.original)} className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-medium">
                    <FileCheck size={14} className="mr-2" />
                    Ver autorización
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/facturas/${row.original.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Factura PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`/api/facturas/${row.original.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
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
                <DropdownMenuItem onClick={() => emitirFactura(row.original)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                  <Send size={14} className="mr-2" />
                  Emitir al SRI
                </DropdownMenuItem>
              )}
              {!readOnly && row.original.estado?.toUpperCase() === "BORRADOR" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteFactura(row.original)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
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

  const getDefaultPuntoId = () => {
    const d = useAuthStore.getState().user?.puntoEmisionDefault;
    const n = Number(d);
    return (n > 0 && puntos.some(p => p.id === n)) ? n : (puntos[0]?.id ?? 0);
  };

  const openCreate = () => {
    setEditing(null);
    setMontoStr("");
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
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
    setMontoStr("");
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
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

    const isCredito = form.tipo_pago === "CREDITO" || form.tipo_pago === "CRÉDITO";
    const isContado = form.tipo_pago === "CONTADO";
    const totalRounded = Math.round(totales.total * 100) / 100;
    const montoRecibido = isCredito
      ? 0
      : isContado
        ? (form.monto_recibido > 0 ? form.monto_recibido : totalRounded)
        : form.monto_recibido;
    const diasPlazo = isContado ? 0 : form.dias_plazo;
    const tipoPago = isCredito ? "CREDITO" : form.tipo_pago;

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
      tipo_pago: tipoPago,
      dias_plazo: diasPlazo,
      monto_recibido: montoRecibido,
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
    if (totalExceeds50) {
      toast.warning("Las ventas superiores a $50.00 no pueden emitirse a Consumidor Final. Selecciona un cliente.");
      return;
    }
    if (form.tipo_pago === "CONTADO" && form.monto_recibido <= 0) {
      toast.warning("Ingresa el monto recibido para facturas al contado.");
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
    if (!await confirmAction({ message: "¿Estás seguro de que deseas cambiar el estado de esta factura?", variant: "warning" })) return;
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
    if (!await confirmAction({ title: "Emitir al SRI", message: "¿Estás seguro de que deseas emitir esta factura al SRI?", confirmText: "Emitir", variant: "info" })) return;
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

  const viewEmissionInfo = (factura: FacturaItem) => {
    setEmissionData(factura);
    setEmissionInfoOpen(true);
  };

  const openEmailDialog = (factura: FacturaItem) => {
    setEmailFactura(factura);
    const cliente = clientes.find((c) => c.id === factura.id_cliente);
    setEmailAddress(cliente?.email || "");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailFactura || emailSending) return;

    const email = emailAddress.trim();
    if (!email) return toast.error("Ingresa un correo de destino.");

    setEmailSending(true);
    try {
      await invoiceService.enviarCorreo(emailFactura.id, email);
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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles.`);
    } catch {
      toast.error(`No se pudo copiar ${label}.`);
    }
  };

  const deleteFactura = async (factura: FacturaItem) => {
    if (!await confirmAction({ title: "Eliminar factura", message: "¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "danger" })) return;
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

  const handleAnular = async (factura: FacturaItem) => {
    if (!await confirmAction({ title: "Anular factura", message: "Esta acción cambiará el estado a Anulado en el sistema. Asegúrate de haber realizado la anulación también en el portal del SRI en Línea.\n\nEsta acción es irreversible.", confirmText: "Anular", variant: "danger" })) return;
    try {
      await invoiceService.cambiarEstado(factura.id, "ANULADA");
      await refresh();
      toast.success("Factura anulada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error al anular la factura.";
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
    return iva ? `${iva.nombre}` : "-";
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
    const producto = getProductoById(detalle.id_producto);
    const cantidad = Number(detalle.cantidad) || 0;
    const ice = producto?.tiene_ice
      ? (base * (producto.porcentaje_ice ?? 0)) / 100
      : 0;
    const baseImponibleIva = base + ice;
    const iva = (baseImponibleIva * ivaPct) / 100;
    const irbpnr = producto?.tiene_irbpnr
      ? cantidad * (producto.valor_unitario_irbpnr ?? 0)
      : 0;
    return base + ice + iva + irbpnr;
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
      const descuento = getDescuentoValor(detalle);
      const base = getDetalleSubtotal(detalle);
      const ivaPct = getDetalleIvaPercent(detalle);
      const producto = getProductoById(detalle.id_producto);
      const icePct = producto?.porcentaje_ice ?? 0;
      const ice = producto?.tiene_ice
        ? (base * icePct) / 100
        : 0;
      const baseImponibleIva = base + ice;
      const iva = (baseImponibleIva * ivaPct) / 100;
      const irbpnrVal = producto?.valor_unitario_irbpnr ?? 0;
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
        total: acc.total + base + ice + iva + irbpnr,
        ivaPorRates: { ...acc.ivaPorRates, [key]: { ...prev, monto: prev.monto + iva } },
      };
    },
    { subtotal: 0, descuento: 0, iva: 0, ice: 0, irbpnr: 0, icePcts: [], irbpnrValues: [], total: 0, ivaPorRates: {} }
  );

  const isCredito = form.tipo_pago === "CREDITO" || form.tipo_pago === "CRÉDITO";
  const isContado = form.tipo_pago === "CONTADO";
  const totalRounded = Math.round(totales.total * 100) / 100;
  const totalExceeds50 = form.cliente_mode === "CONSUMIDOR_FINAL" && totalRounded > 50;
  const montoRecibidoDisplay = isContado
    ? (form.monto_recibido > 0 ? form.monto_recibido : totalRounded)
    : 0;
  const cambio = montoRecibidoDisplay - totales.total;
  const showPagoCard = (isContado && form.forma_pago === "01") || isCredito;

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  const handleClientSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setClienteQuery(value);
    if (clientSearchTimerRef.current) clearTimeout(clientSearchTimerRef.current);
    if (!value.trim()) { setClientSearchResults([]); return; }
    clientSearchTimerRef.current = setTimeout(async () => {
      setClientSearching(true);
      try {
        const results = await clientService.listClientes("ACTIVO", value.trim());
        setClientSearchResults(results);
      } catch { /* ignore */ }
      finally { setClientSearching(false); }
    }, 300);
  };

  const selectClient = (cliente: Cliente) => {
    updateField("id_cliente", cliente.id);
    setClienteQuery("");
    setClientSearchResults([]);
  };

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
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-6"
          onSubmit={submitForm}
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-6">
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
                      value={form.tipo_pago === "CRÉDITO" ? "CREDITO" : form.tipo_pago}
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
                                <SelectPrimitive.ItemText>
                                  {tipo === "CREDITO" ? "CRÉDITO" : tipo}
                                </SelectPrimitive.ItemText>
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

                  {isCredito ? (
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

                {totalExceeds50 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold shrink-0">!</span>
                    <p className="text-xs text-amber-800">
                      Por disposición del SRI, las ventas superiores a $50.00 no pueden emitirse a Consumidor Final. Por favor, ingrese una cédula o RUC.
                    </p>
                  </div>
                )}

                {form.cliente_mode !== "CONSUMIDOR_FINAL" && (
                  <div>
                    {form.id_cliente > 0 && clientSearchResults.length === 0 && !clienteQuery.trim() ? (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{getClienteLabel(form.id_cliente)}</span>
                          <span className="text-xs text-slate-400">· {clientes.find((c) => c.id === form.id_cliente)?.identificacion || ""}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => { updateField("id_cliente", 0); setClienteQuery(""); setClientSearchResults([]); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Cambiar cliente">
                            <Search size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-end gap-2">
                        <div className="flex-1 min-w-0 relative">
                          <Field label="Buscar cliente *" htmlFor="cliente_search">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                              <input
                                id="cliente_search"
                                type="text"
                                value={clienteQuery}
                                onChange={handleClientSearchChange}
                                placeholder="Buscar por cédula, RUC o razón social..."
                                className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                              />
                              {clientSearching && (
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                                </div>
                              )}
                            </div>
                          </Field>

                          {clientSearchResults.length > 0 && (
                            <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                              {clientSearchResults.map((cliente) => (
                                <button
                                  key={cliente.id}
                                  type="button"
                                  onClick={() => selectClient(cliente)}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
                                >
                                  <div className="font-medium text-slate-800">{cliente.razon_social}</div>
                                  <div className="text-xs text-slate-500">{cliente.identificacion}</div>
                                </button>
                              ))}
                            </div>
                          )}
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
                    <DiscountToggle
                      value={form.detalles[0]?.tipo_descuento ?? "PORCENTAJE"}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          detalles: prev.detalles.map((d) => ({ ...d, tipo_descuento: value })),
                        }))
                      }
                    />
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
                  <div className="min-w-[960px]">
                    <div className="hidden lg:grid lg:grid-cols-[60px_minmax(180px,1fr)_60px_90px_88px_72px_76px_62px_80px_44px] lg:gap-3 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <span>Código</span>
                      <span>Descripción</span>
                      <span>Cant.</span>
                      <span>Precio</span>
                      <span>IVA</span>
                      <span>ICE</span>
                      <span>IRBPNR</span>
                      <span>Desc.</span>
                      <span>Subtotal</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-200">
                      {form.detalles.map((detalle, index) => {
                        const producto = getProductoById(detalle.id_producto);
                        const detalleSubtotal = getDetalleSubtotal(detalle);
                        const precioCatalogo = producto?.precio ?? 0;
                        return (
                          <div
                            key={`detalle-${index}`}
                            className="grid items-center gap-3 bg-white px-3 py-2 lg:grid-cols-[60px_minmax(180px,1fr)_60px_90px_88px_72px_76px_62px_80px_44px]"
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
                                  className="z-50 w-[380px] max-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                                  position="popper"
                                  side="bottom"
                                  align="start"
                                  sideOffset={4}
                                >
                                  <div className="border-b border-slate-100 p-2">
                                    <Input
                                      value={getProductoQuery(index)}
                                      onChange={(event) => setProductoQuery(index, event.target.value)}
                                      placeholder="Buscar por nombre o código..."
                                      className="h-8 bg-white shadow-none w-full"
                                      onKeyDown={(event) => event.stopPropagation()}
                                      onPointerDown={(event) => event.stopPropagation()}
                                    />
                                  </div>
                                  <SelectPrimitive.Viewport className="p-1 max-h-56 overflow-y-auto">
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
                              {formatMoney(detalleSubtotal)}
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
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Descuento:</span>
                    <span className="font-medium text-rose-600">{formatMoney(totales.descuento)}</span>
                  </div>
                )}
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
                    <span className="font-medium text-amber-600">{formatMoney(totales.ice)}</span>
                  </div>
                )}
                {totales.irbpnr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {totales.irbpnrValues.length === 1 ? `IRBPNR ($${totales.irbpnrValues[0].toFixed(2)}):` : "IRBPNR:"}
                    </span>
                    <span className="font-medium text-purple-600">{formatMoney(totales.irbpnr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-sky-700">{formatMoney(totales.total)}</span>
                </div>
              </div>

              {showPagoCard && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <h4 className="text-sm font-semibold text-slate-700">Finalizar Pago</h4>
                  </div>
                  <Field label="Monto recibido" htmlFor="monto_recibido">
                    <Input
                      id="monto_recibido"
                      type="text"
                      inputMode="decimal"
                      value={isCredito ? "0.00" : montoStr}
                      onChange={(event) => {
                        if (isCredito) return;
                        const raw = event.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                        const parts = raw.split(".");
                        const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
                        const finalVal = cleaned.includes(".") ? cleaned.slice(0, cleaned.indexOf(".") + 3) : cleaned;
                        const num = parseFloat(finalVal);
                        setMontoStr(event.target.value);
                        updateField("monto_recibido", !isNaN(num) && num >= 0 ? Math.round(num * 100) / 100 : 0);
                      }}
                      readOnly={isCredito}
                      className={`shadow-none h-9 ${isCredito ? "bg-slate-50 text-slate-500" : "bg-white"}`}
                      placeholder="0.00"
                    />
                  </Field>
                  <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-slate-600">
                      {isCredito ? "Monto a crédito:" : "Cambio:"}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        isCredito ? "text-sky-600" : cambio < 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isCredito ? formatMoney(totales.total) : formatMoney(cambio)}
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" disabled={saving || totalExceeds50} className="h-10 w-full">
                  {saving ? "Guardando..." : totalExceeds50 ? "Seleccione un cliente" : "Guardar factura"}
                </Button>
              </div>
            </aside>
          </div>
        </motion.form>

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
      </motion.section>
    );
  }

  return (
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

        {!readOnly && (
          <div className="ml-auto">
            <Button onClick={openCreate} disabled={loadingCatalogs} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" />
              Nueva factura
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando facturas" className="mt-8" />
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
          <p className="text-sm text-slate-600">No hay facturas para este filtro.</p>
          {!readOnly && (
            <Button onClick={openCreate} disabled={loadingCatalogs} className="mt-3 h-9 shadow-none">
              <Plus size={15} className="mr-1.5" /> Crear factura
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
                    Detalle de factura
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la factura seleccionada.
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

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {detail ? (
                <div className="space-y-4">
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
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500">N° Comprobante</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.numero_comprobante || detail.numero || `Factura #${detail.id}`}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Fecha emisión</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.fecha_emision || "-"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Estado</dt>
                        <dd className="mt-2">
                          <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getEstadoColor(detail.estado)}`}>
                            {detail.estado || "DESCONOCIDO"}
                          </span>
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Forma de pago</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.tipo_pago || detail.forma_pago || "-"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Plazo</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.dias_plazo != null ? `${detail.dias_plazo} días` : "-"}
                        </dd>
                      </div>
                      {detail.observacion ? (
                        <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                          <dt className="text-xs font-semibold text-slate-500">Observación</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            {detail.observacion}
                          </dd>
                        </div>
                      ) : null}
                      {detail.monto_recibido != null && detail.monto_recibido > 0 ? (
                        <div className="rounded-lg bg-white/80 px-3 py-2">
                          <dt className="text-xs font-semibold text-slate-500">Monto recibido</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            ${detail.monto_recibido.toFixed(2)}
                          </dd>
                        </div>
                      ) : null}
                      {detail.vuelto != null && detail.vuelto > 0 ? (
                        <div className="rounded-lg bg-white/80 px-3 py-2">
                          <dt className="text-xs font-semibold text-slate-500">Cambio</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            ${detail.vuelto.toFixed(2)}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  {/* SECCIÓN: Cliente */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      {detail.cliente_identificacion ? (
                        <>
                          <div className="rounded-lg bg-white/80 px-3 py-2">
                            <dt className="text-xs font-semibold text-slate-500">Razón social / Cliente</dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-800">
                              {getClienteLabel(detail.id_cliente, detail.cliente_nombre)}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-white/80 px-3 py-2">
                            <dt className="text-xs font-semibold text-slate-500">Identificación</dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-800">
                              {detail.cliente_identificacion}
                            </dd>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                          <dt className="text-xs font-semibold text-slate-500">Razón social / Cliente</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            {getClienteLabel(detail.id_cliente, detail.cliente_nombre)}
                          </dd>
                        </div>
                      )}
                      {detail.consumidor_final ? (
                        <div className="rounded-lg bg-white/80 px-3 py-2">
                          <dt className="text-xs font-semibold text-slate-500">Tipo</dt>
                          <dd className="mt-2">
                            <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-sky-100 text-sky-700">
                              CONSUMIDOR FINAL
                            </span>
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  {/* SECCIÓN: Autorización SRI */}
                  {(detail.clave_acceso || detail.numero_autorizacion) ? (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Autorización SRI</h3>
                      </div>
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        {detail.clave_acceso ? (
                          <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                            <dt className="text-xs font-semibold text-slate-500">Clave de acceso</dt>
                            <dd className="mt-2 flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-slate-800 break-all flex-1">
                                {detail.clave_acceso}
                              </span>
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(detail.clave_acceso ?? ""); toast.success("Clave copiada."); }}
                                className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                title="Copiar clave de acceso"
                              >
                                <Copy size={12} />
                              </button>
                            </dd>
                          </div>
                        ) : null}
                        {detail.numero_autorizacion ? (
                          <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                            <dt className="text-xs font-semibold text-slate-500">N° Autorización</dt>
                            <dd className="mt-2 flex items-center gap-2">
                              <span className="text-xs font-mono font-semibold text-slate-800 break-all flex-1">
                                {detail.numero_autorizacion}
                              </span>
                              <button
                                type="button"
                                onClick={() => { navigator.clipboard.writeText(detail.numero_autorizacion ?? ""); toast.success("N° Autorización copiado."); }}
                                className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                                title="Copiar número de autorización"
                              >
                                <Copy size={12} />
                              </button>
                            </dd>
                          </div>
                        ) : null}
                        {detail.fecha_autorizacion ? (
                          <div className="rounded-lg bg-white/80 px-3 py-2">
                            <dt className="text-xs font-semibold text-slate-500">Fecha autorización</dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-800">
                              {new Date(detail.fecha_autorizacion).toLocaleDateString("es-EC", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}

                  {/* SECCIÓN: Detalles */}
                  {detail.detalles?.length ? (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Detalles</h3>
                      </div>
                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50">
                              <th className="text-left font-semibold text-slate-500 px-3 py-2.5 w-16">Código</th>
                              <th className="text-left font-semibold text-slate-500 px-3 py-2.5 max-w-[200px]">Descripción</th>
                              <th className="text-right font-semibold text-slate-500 px-4 py-2.5 w-14">Cant.</th>
                              <th className="text-right font-semibold text-slate-500 px-4 py-2.5 w-20">P. Unit</th>
                              <th className="text-right font-semibold text-slate-500 px-4 py-2.5 w-20">Subtotal</th>
                              <th className="text-right font-semibold text-slate-500 px-4 py-2.5 w-20">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detail.detalles.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-3 py-2.5 text-slate-700 font-medium whitespace-nowrap">{item.codigo || "-"}</td>
                                <td className="px-3 py-2.5 text-slate-800 max-w-[200px] truncate">{getProductoLabel(item.id_producto, item.descripcion)}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">{item.cantidad}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">${item.precio_unitario?.toFixed(2) ?? "-"}</td>
                                <td className="px-4 py-2.5 text-right text-slate-700 whitespace-nowrap">${item.subtotal?.toFixed(2) ?? "-"}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap">${item.total?.toFixed(2) ?? "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-slate-300">
                              <td colSpan={4} className="pt-3 pr-4 pb-1.5 text-right text-xs font-semibold text-slate-600">Subtotal</td>
                              <td className="pt-3 pb-1.5"></td>
                              <td className="pt-3 pb-1.5 pr-4 text-right font-bold text-slate-800">${detail.subtotal?.toFixed(2) ?? "0.00"}</td>
                            </tr>
                            {detail.valor_ice != null && detail.valor_ice > 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-1.5 text-right text-xs font-semibold text-slate-600">ICE</td>
                                <td className="py-1.5"></td>
                                <td className="py-1.5 pr-4 text-right font-bold text-slate-800">${detail.valor_ice.toFixed(2)}</td>
                              </tr>
                            ) : null}
                            {detail.valor_irbpnr != null && detail.valor_irbpnr > 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-1.5 text-right text-xs font-semibold text-slate-600">IRBPNR</td>
                                <td className="py-1.5"></td>
                                <td className="py-1.5 pr-4 text-right font-bold text-slate-800">${detail.valor_irbpnr.toFixed(2)}</td>
                              </tr>
                            ) : null}
                            <tr>
                              <td colSpan={4} className="px-4 py-1.5 text-right text-xs font-semibold text-slate-600">IVA</td>
                              <td className="py-1.5"></td>
                              <td className="py-1.5 pr-4 text-right font-bold text-slate-800">${detail.iva_total?.toFixed(2) ?? "0.00"}</td>
                            </tr>
                            <tr className="border-t border-slate-200">
                              <td colSpan={4} className="pt-2.5 pr-4 pb-3 text-right text-sm font-bold text-slate-700">Total</td>
                              <td className="pt-2.5 pb-3"></td>
                              <td className="pt-2.5 pb-3 pr-4 text-right text-lg font-bold text-app-primary">${detail.total?.toFixed(2) ?? "0.00"}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {/* SECCIÓN: Datos adicionales */}
                  {detail.datos_adicionales?.length ? (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Datos adicionales</h3>
                      </div>
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        {detail.datos_adicionales.map((item, idx) => (
                          <div key={idx} className="rounded-lg bg-white/80 px-3 py-2">
                            <dt className="text-xs font-semibold text-slate-500">{item.nombre}</dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-800">{item.valor || "-"}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}

                  {/* SECCIÓN: Auditoría */}
                  {detail.created_at ? (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Auditoría</h3>
                      </div>
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-lg bg-white/80 px-3 py-2">
                          <dt className="text-xs font-semibold text-slate-500">Creado</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            {new Date(detail.created_at).toLocaleDateString("es-EC", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </dd>
                        </div>
                        {detail.updated_at ? (
                          <div className="rounded-lg bg-white/80 px-3 py-2">
                            <dt className="text-xs font-semibold text-slate-500">Actualizado</dt>
                            <dd className="mt-2 text-sm font-semibold text-slate-800">
                              {new Date(detail.updated_at).toLocaleDateString("es-EC", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-2">
                    {detail?.estado?.toUpperCase() === "AUTORIZADO" && (
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => {
                          setDetailOpen(false);
                          openEmailDialog(detail);
                        }}
                        className="gap-2"
                      >
                        <Mail size={14} />
                        Enviar por correo
                      </Button>
                    )}
                    <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                      Cerrar
                    </Button>
                  </div>
                </div>
              ) : (
                <Loader label="Cargando detalle" className="mt-4 min-h-[100px]" />
              )}
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={emissionInfoOpen} onOpenChange={setEmissionInfoOpen}>
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
                  <FileCheck className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Factura Emitida
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    La factura ha sido autorizada por el SRI.
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

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {emissionData && (
                <div className="space-y-4">
                  {/* Autorización SRI */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Autorización SRI</h3>
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500">N° Comprobante</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {emissionData.numero_comprobante || emissionData.numero || "-"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Estado</dt>
                        <dd className="mt-2">
                          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                            {emissionData.estado || "AUTORIZADO"}
                          </span>
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Fecha de autorización</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {emissionData.fecha_autorizacion
                            ? new Date(emissionData.fecha_autorizacion).toLocaleDateString("es-EC", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500">Clave de acceso</dt>
                        <dd className="mt-2 flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-slate-800 break-all flex-1">
                            {emissionData.clave_acceso || "No disponible"}
                          </span>
                          {emissionData.clave_acceso && (
                            <button
                              type="button"
                              onClick={() => { navigator.clipboard.writeText(emissionData.clave_acceso ?? ""); toast.success("Clave copiada."); }}
                              className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                              title="Copiar clave de acceso"
                            >
                              <Copy size={12} />
                            </button>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* PDF */}
                  {emissionData.pdf_url && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Documento PDF</h3>
                      </div>
                      <dl className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
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
                      </dl>
                    </div>
                  )}
                </div>
              )}

              {/* Botón cerrar */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setEmissionInfoOpen(false)}>
                  Cerrar
                </Button>
              </div>
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
                    Enviar factura por correo
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
                    {emailFactura ? getClienteLabel(emailFactura.id_cliente, emailFactura.cliente_nombre || "Cliente") : "-"}
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
  );
}
