"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
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
  RefreshCw,
  DollarSign,
  Box,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ProductFormModal } from "@/src/components/products/product-form-modal";
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
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";
import { Loader } from "@/src/components/ui/loader";
import { Switch } from "@/src/components/ui/switch";
import { DiscountToggle } from "@/src/components/ui/discount-toggle";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { ClientFormModal } from "@/src/components/clients/client-form-modal";
import { confirmAction } from "@/src/lib/confirm";
import { motion, AnimatePresence } from "framer-motion";

interface DetalleDraft {
  mode: "CATALOGO" | "MANUAL";
  id_producto: number | null;
  codigo: string;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  precio_unitario: number;
  descuento: string;
  tipo_descuento: "PORCENTAJE" | "VALOR";
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
  descuento: "",
  tipo_descuento: "PORCENTAJE",
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

const estadoFilters = ["TODOS", "BORRADOR", "ENVIADO", "AUTORIZADO", "RECHAZADA", "ANULADA"] as const;
const formaPagoOptions = [
  { value: "01", label: "01 - Efectivo" },
  { value: "19", label: "19 - Tarjeta" },
  { value: "20", label: "20 - Transferencia" },
];
type EstadoFiltro = (typeof estadoFilters)[number];

interface NotasVentaPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

export function NotasVentaPanel({ showPanel = true, readOnly = false }: NotasVentaPanelProps) {
  const [notas, setNotas] = useState<NotaVentaItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Cliente[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const clientSearchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<NotaVentaItem | null>(null);
  const [detail, setDetail] = useState<NotaVentaItem | null>(null);
  const [form, setForm] = useState<NotaVentaFormState>(initialForm);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [emissionInfoOpen, setEmissionInfoOpen] = useState(false);
  const [emissionData, setEmissionData] = useState<NotaVentaItem | null>(null);
  const [montoRecibido, setMontoRecibido] = useState(0);
  const [montoStr, setMontoStr] = useState("");
  const [clientModalOpen, setClientModalOpen] = useState(false);
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

  const getFormaPagoLabel = (value?: string) => {
    const option = formaPagoOptions.find((o) => o.value === value);
    return option?.label || value || "-";
  };

  const getPuntoLabel = (id?: number) => {
    if (!id) return "-";
    const p = puntos.find((x) => x.id === id);
    return p ? `${p.codigo} - ${p.descripcion}` : `ID ${id}`;
  };

  const getDescuentoValor = (d: DetalleDraft) => {
    const cantidad = Number(d.cantidad) || 0;
    const precio = d.precio_unitario || 0;
    const raw = Math.max(Number(d.descuento) || 0, 0);
    if (d.tipo_descuento === "PORCENTAJE") {
      return (cantidad * precio) * (raw / 100);
    }
    return raw;
  };

  const totales = form.detalles.reduce<{ subtotal: number; descuento: number; total: number }>(
    (acc, d) => {
      const sub = d.cantidad * d.precio_unitario;
      const dto = getDescuentoValor(d);
      return {
        subtotal: acc.subtotal + sub,
        descuento: acc.descuento + dto,
        total: acc.total + sub - dto,
      };
    },
    { subtotal: 0, descuento: 0, total: 0 }
  );

  const totalExceeds50 = form.consumidor_final && totales.total > 50;

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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getEstadoColor(row.original.estado)}`}>
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
                {!readOnly && n.estado === "BORRADOR" && (
                  <DropdownMenuItem onClick={() => openEdit(n)}>
                    <Edit3 size={14} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {n.estado === "AUTORIZADO" && (
                  <>
                    <DropdownMenuItem onClick={() => viewEmissionInfo(n)} className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 font-medium">
                      <FileCheck size={14} className="mr-2" />
                      Ver autorización
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/api/notas-venta/${n.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                      <FileText size={14} className="mr-2" />
                      Nota PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/api/notas-venta/${n.id}/recibo`, '_blank')} className="text-teal-600 focus:bg-teal-50 focus:text-teal-700 font-medium">
                      <Printer size={14} className="mr-2" />
                      Imprimir Recibo
                    </DropdownMenuItem>
                    {!readOnly && (
                      <DropdownMenuItem onClick={() => handleAnular(n.id)} className="text-orange-600 focus:bg-orange-50 focus:text-orange-700 font-medium">
                        <X size={14} className="mr-2" />
                        Anular
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {!readOnly && n.estado === "BORRADOR" && (
                  <DropdownMenuItem onClick={() => handleEmitir(n.id)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                    <Send size={14} className="mr-2" />
                    Emitir al SRI
                  </DropdownMenuItem>
                )}
                {!readOnly && n.estado === "BORRADOR" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(n.id)} className="text-rose-600 focus:bg-rose-50 focus:text-rose-700">
                      <Trash2 size={14} className="mr-2" />
                      Eliminar
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

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [puntosData, productosData, clientesData, ivaData] = await Promise.all([
          emissionPointService.listPuntos("ACTIVO"),
          productService.listProductos("ACTIVO"),
          clientService.listClientes("ACTIVO"),
          ivaService.listCodigos(true),
        ]);
        setPuntos(puntosData);
        setProductos(productosData);
        setClientes(clientesData);
        setCodigosIva(ivaData);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron cargar los catálogos.";
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
        const data = await notasVentaService.listNotasVenta();
        const filtered = filter === "TODOS" ? data : data.filter((item) => item.estado === filter);
        setNotas(filtered);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron cargar las notas de venta.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadNotas();
  }, [filter]);

  useEffect(() => {
    if (editorOpen) {
      const navigateTo = (section: string) => {
        closeEditor();
        setActiveSection(section);
      };

      setHeaderVisible(false);
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Notas de Venta", onClick: () => navigateTo("notas-venta") },
        { label: editing ? "Editar nota de venta" : "Nueva nota de venta" },
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

  const getDefaultPuntoId = () => {
    const d = useAuthStore.getState().user?.puntoEmisionDefault;
    const n = Number(d);
    return (n > 0 && puntos.some(p => p.id === n)) ? n : (puntos[0]?.id ?? 0);
  };

  const openCreate = () => {
    setEditing(null);
    setMontoStr("");
    setMontoRecibido(0);
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(initialForm);
    setClienteQuery("");
    setMontoStr("");
    setMontoRecibido(0);
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
          descuento: parseFloat(d.descuento).toString(),
          tipo_descuento: "VALOR",
          subtotal: parseFloat(d.subtotal),
          total: parseFloat(d.total),
        })) || [initialDetail()],
      });
      setEditorOpen(true);
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

  const resetForm = () => {
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    });
    setClienteQuery("");
    setMontoStr("");
    setMontoRecibido(0);
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
    setForm((prev) => ({
      ...prev,
      id_cliente: cliente.id,
      consumidor_final: false,
      cli_identificacion: cliente.identificacion,
      cli_razon_social: cliente.razon_social,
      cli_direccion: cliente.direccion || "",
      cli_telefono: cliente.telefono || "",
      cli_email: cliente.email || "",
    }));
    setClienteQuery("");
    setClientSearchResults([]);
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

      const subtotal = updated.cantidad * updated.precio_unitario;
      const raw = Math.max(Number(updated.descuento) || 0, 0);
      const descuentoValor = updated.tipo_descuento === "PORCENTAJE"
        ? subtotal * (raw / 100)
        : raw;
      const total = subtotal - descuentoValor;

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
      precio_unitario: getProductoPrecioTotalizado(producto.id),
    });
  };

  const buildPayload = () => {
    const basePayload = {
      id_punto_emision: form.id_punto_emision,
      fecha_emision: form.fecha_emision,
      forma_pago: form.forma_pago,
      observacion: form.observacion,
      detalles: form.detalles.map((d) => {
        const sub = d.cantidad * d.precio_unitario;
        const raw = Math.max(Number(d.descuento) || 0, 0);
        const descuentoValor = d.tipo_descuento === "PORCENTAJE" ? sub * (raw / 100) : raw;
        return {
          id_producto: d.id_producto,
          codigo: d.codigo,
          descripcion: d.descripcion,
          unidad_medida: d.unidad_medida,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento: parseFloat(descuentoValor.toFixed(2)),
        };
      }),
    };

    if (form.consumidor_final || !form.id_cliente) {
      return {
        ...basePayload,
        consumidor_final: true,
        cli_identificacion: form.cli_identificacion,
        cli_razon_social: form.cli_razon_social,
        cli_direccion: form.cli_direccion || undefined,
        cli_telefono: form.cli_telefono || undefined,
        cli_email: form.cli_email || undefined,
      };
    }

    return {
      ...basePayload,
      id_cliente: form.id_cliente,
    };
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.id_punto_emision) {
      toast.warning("Selecciona un punto de emisión.");
      return;
    }
    if (form.detalles.length === 0) {
      toast.warning("Agrega al menos un detalle.");
      return;
    }
    if (totalExceeds50) {
      toast.warning("Las ventas superiores a $50.00 no pueden emitirse a Consumidor Final. Selecciona un cliente.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();

      if (editing) {
        await notasVentaService.updateNotaVenta(editing.id, payload);
        toast.success("Nota de venta actualizada correctamente");
      } else {
        await notasVentaService.createNotaVenta(payload as NotaVentaCreateInput);
        toast.success("Nota de venta creada correctamente");
      }

      const notasData = await notasVentaService.listNotasVenta();
      const filtered = filter === "TODOS" ? notasData : notasData.filter((item) => item.estado === filter);
      setNotas(filtered);
      closeEditor();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirmAction({ title: "Eliminar nota de venta", message: "¿Estás seguro de que deseas eliminar esta nota de venta? Esta acción no se puede deshacer.", confirmText: "Eliminar", variant: "danger" })) return;

    try {
      await notasVentaService.deleteNotaVenta(id);
      setNotas((prev) => prev.filter((n) => n.id !== id));
      toast.success("Nota de venta eliminada");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleAnular = async (id: number) => {
    if (!await confirmAction({ title: "Anular nota de venta", message: "Esta acción cambiará el estado a Anulado en el sistema. Asegúrate de haber realizado la anulación también en el portal del SRI en Línea.\n\nEsta acción es irreversible.", confirmText: "Anular", variant: "danger" })) return;
    try {
      await notasVentaService.cambiarEstado(id, "ANULADA");
      const notasData = await notasVentaService.listNotasVenta();
      const filtered = filter === "TODOS" ? notasData : notasData.filter((item) => item.estado === filter);
      setNotas(filtered);
      toast.success("Nota de venta anulada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al anular");
    }
  };

  const handleEmitir = async (id: number) => {
    if (!await confirmAction({ title: "Emitir al SRI", message: "¿Estás seguro de que deseas emitir esta nota de venta al SRI?", confirmText: "Emitir", variant: "info" })) return;
    try {
      const emitted = await notasVentaService.emitirNotaVenta(id);
      const notasData = await notasVentaService.listNotasVenta();
      const filtered = filter === "TODOS" ? notasData : notasData.filter((item) => item.estado === filter);
      setNotas(filtered);
      toast.success("Nota de venta emitida al SRI");
      setEmissionData(emitted);
      setEmissionInfoOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al emitir");
    }
  };

  const viewEmissionInfo = (nota: NotaVentaItem) => {
    setEmissionData(nota);
    setEmissionInfoOpen(true);
  };

  const refresh = async () => {
    try {
      const data = await notasVentaService.listNotasVenta();
      const filtered = filter === "TODOS" ? data : data.filter((item) => item.estado === filter);
      setNotas(filtered);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudieron cargar las notas de venta.";
      toast.error(message);
    }
  };

  const getClienteLabel = (clienteId?: number | null) => {
    if (!clienteId) return "CONSUMIDOR FINAL";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || "CONSUMIDOR FINAL";
  };

  const getProductoById = (productoId?: number | null) => {
    if (!productoId) return undefined;
    return productos.find((item) => item.id === productoId);
  };

  const getProductoIvaPorcentaje = (productoId?: number | null) => {
    const producto = getProductoById(productoId);
    if (!producto) return 0;
    const iva = codigosIva.find((item) => item.id === producto.id_iva);
    return iva?.porcentaje ?? 0;
  };

  const getProductoPrecioTotalizado = (productoId?: number | null) => {
    const producto = getProductoById(productoId);
    if (!producto) return 0;
    const base = producto.precio ?? 0;
    const baseCents = Math.round(base * 100);
    const ivaPct = getProductoIvaPorcentaje(productoId);
    const iceCents = producto.tiene_ice ? Math.round(baseCents * (producto.porcentaje_ice ?? 0) / 100) : 0;
    const baseImpCents = baseCents + iceCents;
    const ivaCents = Math.round(baseImpCents * ivaPct / 100);
    const irbpnrCents = producto.tiene_irbpnr ? Math.round((producto.valor_unitario_irbpnr ?? 0) * 100) : 0;
    return (baseCents + iceCents + ivaCents + irbpnrCents) / 100;
  };

  const formatMoney = (value: number) => {
    return value.toLocaleString("es-EC", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProductoQuery = (index: number) => productoQueries[index] ?? "";
  const setProductoQuery = (index: number, value: string) => {
    setProductoQueries((prev) => ({ ...prev, [index]: value }));
  };
  const [productoQueries, setProductoQueries] = useState<Record<number, string>>({});

  const getFilteredProductos = (index: number) => {
    const normalizedQuery = getProductoQuery(index).trim().toLowerCase();
    if (!normalizedQuery) return productos;
    return productos.filter((p) =>
      [p.descripcion, p.codigo]
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
                {editing ? "Editar nota de venta" : "Nueva nota de venta"}
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
                          className="z-50 min-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
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
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Consumidor final</span>
                    <Switch
                      checked={form.consumidor_final}
                      onCheckedChange={(checked) =>
                        setForm({
                          ...form,
                          consumidor_final: checked,
                          ...(checked
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

                {!form.consumidor_final && (
                  <div>
                    {form.id_cliente && clientSearchResults.length === 0 && !clienteQuery.trim() ? (
                      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                          <span className="text-sm font-medium text-slate-800 truncate">{getClienteLabel(form.id_cliente)}</span>
                          <span className="text-xs text-slate-400">· {clientes.find((c) => c.id === form.id_cliente)?.identificacion || ""}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => { setForm((prev) => ({ ...prev, id_cliente: null })); setClienteQuery(""); setClientSearchResults([]); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Cambiar cliente">
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
                  <div className="min-w-[570px]">
                    <div className="hidden lg:grid lg:grid-cols-[60px_minmax(180px,1fr)_60px_85px_62px_80px_44px] lg:gap-3 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <span>Código</span>
                      <span>Descripción</span>
                      <span>Cant.</span>
                      <span>P. UNIT</span>
                      <span>DESC.</span>
                      <span>Subtotal</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-200">
                      {form.detalles.map((detalle, index) => {
                        const producto = getProductoById(detalle.id_producto);
                        const subtotalLinea = detalle.cantidad * detalle.precio_unitario - getDescuentoValor(detalle);
                        return (
                          <div
                            key={`detalle-${index}`}
                            className="grid items-center gap-3 bg-white px-3 py-2 lg:grid-cols-[60px_minmax(180px,1fr)_60px_85px_62px_80px_44px]"
                          >
                            <span className="text-xs text-slate-500 truncate">
                              {producto?.codigo || detalle.codigo || "-"}
                            </span>

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
                              value={detalle.cantidad === 0 ? "" : detalle.cantidad}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                const cleaned = raw.includes(".") ? raw.slice(0, raw.indexOf(".") + 3) : raw;
                                updateDetail(index, { cantidad: cleaned === "" ? 0 : parseFloat(cleaned) });
                              }}
                              className="h-9 bg-white shadow-none text-xs"
                            />

                            <span className="text-xs text-slate-700 font-medium">
                              {detalle.precio_unitario > 0 ? detalle.precio_unitario.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                            </span>

                            <Input
                              type="text"
                              inputMode="decimal"
                              value={detalle.descuento}
                              onChange={(e) => {
                                let cleaned = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); }
                                updateDetail(index, { descuento: cleaned });
                              }}
                              className="h-9 bg-white shadow-none text-xs"
                            />

                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              {formatMoney(subtotalLinea)}
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
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Totales</h4>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">Subtotal:</span>
                  <span className="font-medium text-slate-800">${formatMoney(totales.subtotal)}</span>
                </div>
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Descuento:</span>
                    <span className="font-medium text-rose-600">${formatMoney(totales.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-sky-700">${formatMoney(totales.total)}</span>
                </div>
              </div>

              {form.forma_pago === "01" && (
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
                      value={montoStr}
                      onChange={(event) => {
                        const raw = event.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                        const parts = raw.split(".");
                        const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
                        const finalVal = cleaned.includes(".") ? cleaned.slice(0, cleaned.indexOf(".") + 3) : cleaned;
                        const num = parseFloat(finalVal);
                        setMontoStr(event.target.value);
                        setMontoRecibido(!isNaN(num) && num >= 0 ? Math.round(num * 100) / 100 : 0);
                      }}
                      className="bg-white shadow-none h-9"
                      placeholder="0.00"
                    />
                  </Field>
                  <div className="flex justify-between items-center bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-slate-600">Cambio:</span>
                    <span className={`text-lg font-bold ${montoRecibido >= totales.total ? "text-emerald-600" : "text-rose-600"}`}>
                      {montoRecibido > 0 ? formatMoney(montoRecibido - totales.total) : formatMoney(0)}
                    </span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">!</span>
                  <div className="text-xs text-amber-800">
                    <span className="font-semibold">Normativa SRI (Régimen RIMPE):</span> En las Notas de Venta no se desglosan impuestos. El precio unitario y los subtotales ya incluyen IVA/ICE de forma unificada según la ley vigente.
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" disabled={saving || totalExceeds50} className="h-10 w-full">
                  {saving ? "Guardando..." : totalExceeds50 ? "Seleccione un cliente" : editing ? "Guardar cambios" : "Crear nota"}
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
            setForm((prev) => ({
              ...prev,
              id_cliente: newClient.id,
              cli_razon_social: newClient.razon_social,
              cli_direccion: newClient.direccion || "",
              cli_telefono: newClient.telefono || "",
              cli_email: newClient.email || "",
            }));
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
        </motion.div>
      )}
      </AnimatePresence>

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando notas de venta" className="mt-8" />
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
          <p className="text-sm text-slate-600">No hay notas de venta para este filtro.</p>
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

      {/* Modal Detalle */}
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
                    Detalle de nota de venta
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información completa de la nota de venta seleccionada.
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
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Información de Emisión */}
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
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <FileCheck className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Nota de Venta Emitida
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    La nota de venta ha sido autorizada por el SRI.
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
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Autorización SRI</h3>
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                        <dt className="text-xs font-semibold text-slate-500">N° Comprobante</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {emissionData.numero_comprobante || "-"}
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
    </motion.div>
  );
}
