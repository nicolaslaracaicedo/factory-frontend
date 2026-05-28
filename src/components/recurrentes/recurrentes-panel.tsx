"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  RotateCw,
  Calculator,
  PlusCircle,
  DollarSign,
  Box,
} from "lucide-react";
import { toast } from "sonner";
import { ProductFormModal } from "@/src/components/products/product-form-modal";

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
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";
import { Loader } from "@/src/components/ui/loader";
import { DiscountToggle } from "@/src/components/ui/discount-toggle";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { ClientFormModal } from "@/src/components/clients/client-form-modal";
import { confirmAction } from "@/src/lib/confirm";
import { motion, AnimatePresence } from "framer-motion";

interface RecurrenteDetalleDraft {
  id_producto?: number;
  codigo: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: string;
  tipo_descuento: "PORCENTAJE" | "VALOR";
  codigo_iva: string;
  porcentaje_iva: number;
}

interface RecurrenteFormDraft {
  id_cliente: number;
  id_punto_emision: number;
  descripcion: string;
  frecuencia: FrecuenciaRecurrente;
  dia_emision: number;
  proxima_facturacion: string;
  forma_pago: string;
  detalles: RecurrenteDetalleDraft[];
}

const initialDetail = (): RecurrenteDetalleDraft => ({
  codigo: "",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  descuento: "",
  tipo_descuento: "PORCENTAJE",
  codigo_iva: "2",
  porcentaje_iva: 12,
});

const initialForm: RecurrenteFormDraft = {
  id_cliente: 0,
  id_punto_emision: 0,
  descripcion: "",
  frecuencia: "MENSUAL",
  dia_emision: 1,
  proxima_facturacion: new Date().toISOString().split("T")[0],
  forma_pago: "01",
  detalles: [initialDetail()],
};

const frecuencias: { value: FrecuenciaRecurrente; label: string }[] = [
  { value: "DIARIA", label: "Diaria" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINCENAL", label: "Quincenal" },
  { value: "MENSUAL", label: "Mensual" },
  { value: "ANUAL", label: "Anual" },
];

const formasPago = [
  { value: "01", label: "01 - Efectivo" },
  { value: "19", label: "19 - Tarjeta" },
  { value: "20", label: "20 - Transferencia" },
];

interface RecurrentesPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

export function RecurrentesPanel({ showPanel = true, readOnly = false }: RecurrentesPanelProps) {
  const [recurrentes, setRecurrentes] = useState<RecurrenteItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<Cliente[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const clientSearchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [generarOpen, setGenerarOpen] = useState(false);
  const [editing, setEditing] = useState<RecurrenteItem | null>(null);
  const [viewing, setViewing] = useState<RecurrenteItem | null>(null);
  const [generando, setGenerando] = useState<RecurrenteItem | null>(null);
  const [form, setForm] = useState<RecurrenteFormDraft>(initialForm);
  const [generarForm, setGenerarForm] = useState<RecurrenteGenerarInput>({
    id_cliente: 0,
    id_punto_emision: 0,
    descripcion: "",
    frecuencia: "MENSUAL",
    dia_emision: 1,
    proxima_facturacion: new Date().toISOString().split("T")[0],
    forma_pago: "01",
    tipo_pago: "CONTADO",
    dias_plazo: 0,
    detalles: [{ id_producto: 0, cantidad: 1 }],
  });

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [productoQueries, setProductoQueries] = useState<Record<number, string>>({});
  const { setBreadcrumbs, setHeaderVisible } = useBreadcrumbs();
  const { setActiveSection } = useDashboardSection();

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "ACTIVO": return "bg-emerald-100 text-emerald-700";
      case "INACTIVO": return "bg-rose-100 text-rose-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

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
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getEstadoClasses(row.original.estado || "")}`}>{row.original.estado}</span>
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
      cell: ({ row }) => <span className="font-medium text-slate-700">{formatCurrency(row.original.total_estimado || 0)}</span>,
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
                {!readOnly && (r.estado === "ACTIVO" || r.estado === "INACTIVO") && <DropdownMenuItem onClick={() => openEdit(r)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>}
                {!readOnly && r.estado === "ACTIVO" && <DropdownMenuItem onClick={() => openGenerar(r)} className="text-emerald-700 focus:text-emerald-700"><RefreshCw size={14} className="mr-2" /> Generar Factura</DropdownMenuItem>}
                {!readOnly && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleToggleEstado(r)} className={r.estado === "ACTIVO" ? "text-orange-600 focus:text-orange-600" : "text-emerald-600 focus:text-emerald-600"}><Power size={14} className="mr-2" /> {r.estado === "ACTIVO" ? "Desactivar" : "Activar"}</DropdownMenuItem>
                    {(r.estado === "ACTIVO" || r.estado === "INACTIVO") && <DropdownMenuItem onClick={() => handleDelete(r)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem>}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [clientes, readOnly]);

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

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [puntosData, clientesData, productosData, ivaData] = await Promise.all([
          emissionPointService.listPuntos("ACTIVO"),
          clientService.listClientes("ACTIVO"),
          productService.listProductos("ACTIVO"),
          ivaService.listCodigos(true),
        ]);
        setPuntos(puntosData);
        setClientes(clientesData);
        setProductos(productosData);
        setCodigosIva(ivaData);
      } catch {
        toast.error("Error al cargar catálogos");
      } finally {
        setLoadingCatalogs(false);
      }
    };

    void loadCatalogs();
  }, []);

  useEffect(() => {
    const loadData = async () => {
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

    void loadData();
  }, [filterEstado]);

  useEffect(() => {
    if (editorOpen) {
      const navigateTo = (section: string) => {
        closeEditor();
        setActiveSection(section);
      };

      setHeaderVisible(false);
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Facturación Recurrente", onClick: () => navigateTo("recurrentes") },
        { label: editing ? "Editar recurrente" : "Nueva recurrente" },
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
    if (readOnly) return;
    setEditing(null);
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
    });
    setEditorOpen(true);
  };

  const openEdit = (rec: RecurrenteItem) => {
    if (readOnly) return;
    setEditing(rec);
    const mapped = toRecurrenteFormState(rec);
    setForm({
      id_cliente: mapped.id_cliente,
      id_punto_emision: mapped.id_punto_emision,
      descripcion: mapped.descripcion,
      frecuencia: mapped.frecuencia,
      dia_emision: mapped.dia_emision,
      proxima_facturacion: mapped.proxima_facturacion,
      forma_pago: mapped.forma_pago,
      detalles: mapped.detalles.map((d) => ({
        id_producto: d.id_producto,
        codigo: d.codigo || "",
        descripcion: d.descripcion || "",
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        descuento: d.descuento.toString(),
        tipo_descuento: "VALOR" as const,
        codigo_iva: d.codigo_iva || "2",
        porcentaje_iva: d.porcentaje_iva || 0,
      })),
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(initialForm);
    setClienteQuery("");
  };

  const openDetail = (rec: RecurrenteItem) => {
    setViewing(rec);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setViewing(null);
  };

  const openGenerar = (rec: RecurrenteItem) => {
    if (readOnly) return;
    setGenerando(rec);
    setGenerarForm({
      id_cliente: rec.id_cliente,
      id_punto_emision: rec.id_punto_emision,
      descripcion: rec.descripcion,
      frecuencia: rec.frecuencia,
      dia_emision: rec.dia_emision,
      proxima_facturacion: rec.proxima_facturacion,
      forma_pago: rec.forma_pago,
      tipo_pago: "CONTADO",
      dias_plazo: 0,
      detalles: (rec.detalles || []).map((d) => ({
        id_producto: d.id_producto || 0,
        cantidad: d.cantidad,
      })),
    });
    setGenerarOpen(true);
  };

  const closeGenerar = () => {
    setGenerarOpen(false);
    setGenerando(null);
  };

  const resetForm = () => {
    setForm({
      ...initialForm,
      id_punto_emision: getDefaultPuntoId(),
    });
    setClienteQuery("");
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
    setForm((prev) => ({ ...prev, id_cliente: cliente.id }));
    setClienteQuery("");
    setClientSearchResults([]);
  };

  const addDetalle = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [...prev.detalles, initialDetail()],
    }));
  };

  const removeDetalle = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== idx),
    }));
  };

  const updateDetalle = (idx: number, updates: Partial<RecurrenteDetalleDraft>) => {
    setForm((prev) => {
      const detalles = [...prev.detalles];
      detalles[idx] = { ...detalles[idx], ...updates };
      return { ...prev, detalles };
    });
  };

  const getProductoById = (productoId?: number) => {
    if (!productoId) return undefined;
    return productos.find((item) => item.id === productoId);
  };

  const handleProductoChange = (idx: number, productoId: number) => {
    const producto = getProductoById(productoId);
    if (!producto) return;
    const iva = codigosIva.find((i) => i.id === producto.id_iva);
    updateDetalle(idx, {
      id_producto: productoId,
      codigo: producto.codigo || "",
      descripcion: producto.descripcion || "",
      precio_unitario: producto.precio || 0,
      codigo_iva: iva?.codigo || "2",
      porcentaje_iva: iva?.porcentaje || 0,
    });
  };

  const getDescuentoValor = (d: RecurrenteDetalleDraft) => {
    const cantidad = Number(d.cantidad) || 0;
    const precio = d.precio_unitario || 0;
    const raw = Math.max(Number(d.descuento) || 0, 0);
    if (d.tipo_descuento === "PORCENTAJE") {
      return (cantidad * precio) * (raw / 100);
    }
    return raw;
  };

  const totales = form.detalles.reduce<{ subtotal: number; descuento: number; iva: number; ice: number; irbpnr: number; icePcts: number[]; irbpnrValues: number[]; ivaPcts: number[]; total: number }>(
    (acc, d) => {
      const sub = d.cantidad * d.precio_unitario;
      const dto = getDescuentoValor(d);
      const base = sub - dto;
      const producto = getProductoById(d.id_producto);
      const icePct = producto?.porcentaje_ice ?? 0;
      const ice = producto?.tiene_ice ? (base * icePct) / 100 : 0;
      const baseImponibleIva = base + ice;
      const ivaPct = d.porcentaje_iva;
      const iva = (baseImponibleIva * ivaPct) / 100;
      const irbpnrVal = producto?.valor_unitario_irbpnr ?? 0;
      const irbpnr = producto?.tiene_irbpnr ? d.cantidad * irbpnrVal : 0;
      const total = base + ice + iva + irbpnr;
      return {
        subtotal: acc.subtotal + sub,
        descuento: acc.descuento + dto,
        iva: acc.iva + iva,
        ice: acc.ice + ice,
        irbpnr: acc.irbpnr + irbpnr,
        icePcts: producto?.tiene_ice ? (acc.icePcts.includes(icePct) ? acc.icePcts : [...acc.icePcts, icePct]) : acc.icePcts,
        irbpnrValues: producto?.tiene_irbpnr ? (acc.irbpnrValues.includes(irbpnrVal) ? acc.irbpnrValues : [...acc.irbpnrValues, irbpnrVal]) : acc.irbpnrValues,
        ivaPcts: acc.ivaPcts.includes(ivaPct) ? acc.ivaPcts : [...acc.ivaPcts, ivaPct],
        total: acc.total + total,
      };
    },
    { subtotal: 0, descuento: 0, iva: 0, ice: 0, irbpnr: 0, icePcts: [], irbpnrValues: [], ivaPcts: [], total: 0 }
  );

  const getClienteLabel = (id: number) => {
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.razon_social} (${c.identificacion})` : "-";
  };

  const getFrecuenciaLabel = (frec: FrecuenciaRecurrente) => {
    return frecuencias.find((f) => f.value === frec)?.label || frec;
  };

  const getIvaLabel = (codigo: string) => {
    const opt = codigosIva.find((i) => i.codigo === codigo);
    return opt?.nombre || codigo;
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "$0.00";
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
  };

  const getProductoQuery = (index: number) => productoQueries[index] ?? "";
  const setProductoQuery = (index: number, value: string) => {
    setProductoQueries((prev) => ({ ...prev, [index]: value }));
  };

  const getFilteredProductos = (index: number) => {
    const normalizedQuery = getProductoQuery(index).trim().toLowerCase();
    if (!normalizedQuery) return productos;
    return productos.filter((p) =>
      [p.descripcion, p.codigo]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(normalizedQuery))
    );
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

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...form,
      detalles: form.detalles.map((d) => {
        const sub = d.cantidad * d.precio_unitario;
        const raw = Math.max(Number(d.descuento) || 0, 0);
        const descuentoValor = d.tipo_descuento === "PORCENTAJE" ? sub * (raw / 100) : raw;
        return {
          id_producto: d.id_producto,
          codigo: d.codigo,
          descripcion: d.descripcion,
          cantidad: d.cantidad,
          precio_unitario: d.precio_unitario,
          descuento: parseFloat(descuentoValor.toFixed(2)),
          codigo_iva: d.codigo_iva,
          porcentaje_iva: d.porcentaje_iva,
        };
      }),
    };

    try {
      if (editing) {
        await recurrentesService.updateRecurrente(editing.id, payload);
        toast.success("Recurrente actualizado");
      } else {
        await recurrentesService.createRecurrente(payload);
        toast.success("Recurrente creado");
      }
      closeEditor();
      const data = await recurrentesService.listRecurrentes(filterEstado || undefined);
      setRecurrentes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async (rec: RecurrenteItem) => {
    if (!await confirmAction({ title: "Eliminar recurrente", message: `¿Estás seguro de que deseas eliminar el recurrente "${rec.descripcion}"? Esta acción no se puede deshacer.`, confirmText: "Eliminar", variant: "danger" })) return;
    try {
      await recurrentesService.deleteRecurrente(rec.id);
      toast.success("Recurrente eliminado");
      setRecurrentes((prev) => prev.filter((r) => r.id !== rec.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleToggleEstado = async (rec: RecurrenteItem) => {
    const nuevoEstado = rec.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const action = nuevoEstado === "ACTIVO" ? "activar" : "desactivar";
    if (!await confirmAction({ message: `¿Estás seguro de que deseas ${action} este recurrente?`, variant: action === "desactivar" ? "danger" : "success" })) return;
    try {
      await recurrentesService.cambiarEstado(rec.id, nuevoEstado);
      toast.success(`Recurrente ${nuevoEstado === "ACTIVO" ? "activado" : "desactivado"}`);
      const data = await recurrentesService.listRecurrentes(filterEstado || undefined);
      setRecurrentes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cambiar estado");
    }
  };

  const handleGenerar = async () => {
    if (!generando) return;
    const payload = {
      ...generarForm,
      ...(generarForm.tipo_pago === "CREDITO" && (generarForm.dias_plazo ?? 0) > 0
        ? { dias_plazo: generarForm.dias_plazo }
        : { dias_plazo: undefined }),
    };
    try {
      await recurrentesService.generarFactura(generando.id, payload);
      toast.success("Factura generada exitosamente");
      closeGenerar();
      const data = await recurrentesService.listRecurrentes(filterEstado || undefined);
      setRecurrentes(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar factura");
    }
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
                {editing ? "Editar facturación recurrente" : "Nueva facturación recurrente"}
              </p>
              <p className="text-xs text-slate-500">
                Configure una facturación automática para el cliente con los productos y frecuencia deseada.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" type="button" onClick={resetForm} className="h-9 px-3 text-xs">
              <RotateCw className="mr-1.5 h-3.5 w-3.5" />
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Punto de emisión *" htmlFor="rec-punto">
                    <SelectPrimitive.Root
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()}
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger id="rec-punto" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50">
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un punto de emisión..."} />
                        <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content className="z-50 min-w-[340px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                          <SelectPrimitive.Viewport className="p-1">
                            {puntos.map((p) => (
                              <SelectPrimitive.Item key={p.id} value={p.id.toString()} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>{p.codigo} - {p.descripcion}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

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

                <div className="grid gap-4 sm:grid-cols-4">
                  <Field label="Frecuencia *" htmlFor="rec-frec">
                    <SelectPrimitive.Root value={form.frecuencia} onValueChange={(val) => setForm((f) => ({ ...f, frecuencia: val as FrecuenciaRecurrente }))}>
                      <SelectPrimitive.Trigger id="rec-frec" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                        <SelectPrimitive.Value />
                        <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                          <SelectPrimitive.Viewport className="p-1">
                            {frecuencias.map((f) => (
                              <SelectPrimitive.Item key={f.value} value={f.value} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Día de emisión *" htmlFor="rec-dia">
                    <Input id="rec-dia" type="number" min={1} max={31} value={form.dia_emision} onChange={(event) => { const val = Math.min(31, Math.max(1, Number(event.target.value) || 1)); setForm((f) => ({ ...f, dia_emision: val })); }} className="bg-white shadow-none" />
                  </Field>

                  <Field label="Forma de pago *" htmlFor="rec-pago">
                    <SelectPrimitive.Root value={form.forma_pago} onValueChange={(val) => setForm((f) => ({ ...f, forma_pago: val }))}>
                      <SelectPrimitive.Trigger id="rec-pago" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                        <SelectPrimitive.Value />
                        <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                      </SelectPrimitive.Trigger>
                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                          <SelectPrimitive.Viewport className="p-1">
                            {formasPago.map((f) => (
                              <SelectPrimitive.Item key={f.value} value={f.value} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Próxima facturación *" htmlFor="rec-prox">
                    <Input id="rec-prox" type="date" value={form.proxima_facturacion} onChange={(event) => setForm((f) => ({ ...f, proxima_facturacion: event.target.value }))} className="bg-white shadow-none" />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Cliente */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                </div>

                <div>
                  {form.id_cliente > 0 && clientSearchResults.length === 0 && !clienteQuery.trim() ? (
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                        <span className="text-sm font-medium text-slate-800 truncate">{getClienteLabel(form.id_cliente)}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => { setForm((prev) => ({ ...prev, id_cliente: 0 })); setClienteQuery(""); setClientSearchResults([]); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors" title="Cambiar cliente">
                          <Search size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 min-w-0 relative">
                        <Field label="Buscar cliente *" htmlFor="cliente_search_rec">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input id="cliente_search_rec" type="text" value={clienteQuery} onChange={handleClientSearchChange} placeholder="Buscar por cédula, RUC o razón social..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
                            {clientSearching && <div className="absolute right-2.5 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" /></div>}
                          </div>
                        </Field>
                        {clientSearchResults.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                            {clientSearchResults.map((cliente) => (
                              <button key={cliente.id} type="button" onClick={() => selectClient(cliente)} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0">
                                <div className="font-medium text-slate-800">{cliente.razon_social}</div>
                                <div className="text-xs text-slate-500">{cliente.identificacion}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button type="button" variant="secondary" onClick={() => setClientModalOpen(true)} className="h-9 px-3 mb-0.5 shrink-0">
                        <Plus className="h-4 w-4 mr-1" /> Nuevo
                      </Button>
                    </div>
                  )}
                </div>
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
                    <Button type="button" variant="secondary" onClick={addDetalle} className="h-9 px-3">
                      <PlusCircle className="mr-1.5 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <div className="min-w-[960px]">
                    <div className="hidden lg:grid lg:grid-cols-[60px_minmax(180px,1fr)_60px_90px_62px_88px_72px_76px_80px_44px] lg:gap-3 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-700">
                      <span>Código</span>
                      <span>Descripción</span>
                      <span>Cant.</span>
                      <span>Precio</span>
                      <span>DESC.</span>
                      <span>IVA</span>
                      <span>ICE</span>
                      <span>IRBPNR</span>
                      <span>Subtotal</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-200">
                      {form.detalles.map((detalle, idx) => {
                        const producto = getProductoById(detalle.id_producto);
                        const sub = detalle.cantidad * detalle.precio_unitario;
                        const dto = getDescuentoValor(detalle);
                        const base = sub - dto;
                        const iceTotal = producto?.tiene_ice ? (base * (producto.porcentaje_ice ?? 0)) / 100 : 0;
                        const baseImponibleIva = base + iceTotal;
                        const ivaTotal = (baseImponibleIva * detalle.porcentaje_iva) / 100;
                        const irbpnrTotal = producto?.tiene_irbpnr ? detalle.cantidad * (producto.valor_unitario_irbpnr ?? 0) : 0;
                        const subtotalLinea = base;
                        return (
                          <div key={`det-${idx}`} className="grid items-center gap-3 bg-white px-3 py-2 lg:grid-cols-[60px_minmax(180px,1fr)_60px_90px_62px_88px_72px_76px_80px_44px]">
                            <span className="text-xs text-slate-500 truncate">{detalle.codigo || "-"}</span>

                            <SelectPrimitive.Root value={detalle.id_producto ? detalle.id_producto.toString() : undefined} onValueChange={(val) => handleProductoChange(idx, Number(val))}>
                              <SelectPrimitive.Trigger id={`prod-${idx}`} className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                                <SelectPrimitive.Value placeholder="Selecciona..." className="truncate" />
                                <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                              </SelectPrimitive.Trigger>
                              <SelectPrimitive.Portal>
                                <SelectPrimitive.Content className="z-50 w-[380px] max-h-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" side="bottom" align="start" sideOffset={4}>
                                  <div className="border-b border-slate-100 p-2">
                                    <Input value={getProductoQuery(idx)} onChange={(event) => setProductoQuery(idx, event.target.value)} placeholder="Buscar por nombre o código..." className="h-8 bg-white shadow-none w-full" onKeyDown={(event) => event.stopPropagation()} onPointerDown={(event) => event.stopPropagation()} />
                                  </div>
                                  <SelectPrimitive.Viewport className="p-1 max-h-56 overflow-y-auto">
                                    {getFilteredProductos(idx).length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-slate-500">Sin resultados.</div>
                                    ) : (
                                      getFilteredProductos(idx).map((item) => (
                                        <SelectPrimitive.Item key={item.id} value={item.id.toString()} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                          <SelectPrimitive.ItemText>{item.descripcion} · {item.codigo}</SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                      ))
                                    )}
                                  </SelectPrimitive.Viewport>
                                </SelectPrimitive.Content>
                              </SelectPrimitive.Portal>
                            </SelectPrimitive.Root>

                            <Input type="text" inputMode="decimal" value={detalle.cantidad === 0 ? "" : detalle.cantidad} onChange={(e) => { const raw = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); const cleaned = raw.includes(".") ? raw.slice(0, raw.indexOf(".") + 3) : raw; updateDetalle(idx, { cantidad: cleaned === "" ? 0 : parseFloat(cleaned) }); }} className="h-9 bg-white shadow-none text-xs" />

                            <span className="text-xs text-slate-700 font-medium">{detalle.precio_unitario > 0 ? (detalle.precio_unitario).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</span>

                            <Input type="text" inputMode="decimal" value={detalle.descuento} onChange={(e) => { let cleaned = e.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"); if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); } updateDetalle(idx, { descuento: cleaned }); }} className="h-9 bg-white shadow-none text-xs" />

                            <span className="text-xs text-slate-500">{getIvaLabel(detalle.codigo_iva)}</span>

                            <span className="text-xs text-amber-600 font-medium">{producto?.tiene_ice ? (iceTotal ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</span>

                            <span className="text-xs text-purple-600 font-medium">{producto?.tiene_irbpnr ? (irbpnrTotal ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}</span>

                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">{(subtotalLinea ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>

                            <button type="button" onClick={() => removeDetalle(idx)} disabled={form.detalles.length === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50" title="Eliminar"><Trash className="h-4 w-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                  <span className="font-medium text-slate-800">{formatCurrency(totales.subtotal)}</span>
                </div>
                {totales.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">Descuento:</span>
                    <span className="font-medium text-rose-600">{formatCurrency(totales.descuento)}</span>
                  </div>
                )}
                {totales.iva > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{totales.ivaPcts.length === 1 ? `IVA (${totales.ivaPcts[0]}%):` : "IVA:"}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totales.iva)}</span>
                  </div>
                )}
                {totales.ice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{totales.icePcts.length === 1 ? `ICE (${totales.icePcts[0]}%):` : "ICE:"}</span>
                    <span className="font-medium text-amber-600">{formatCurrency(totales.ice)}</span>
                  </div>
                )}
                {totales.irbpnr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">{totales.irbpnrValues.length === 1 ? `IRBPNR ($${totales.irbpnrValues[0].toFixed(2)}):` : "IRBPNR:"}</span>
                    <span className="font-medium text-purple-600">{formatCurrency(totales.irbpnr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-sky-700">{formatCurrency(totales.total)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" className="h-10 w-full">
                  {editing ? "Guardar cambios" : "Crear recurrente"}
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
            setForm((prev) => ({ ...prev, id_cliente: newClient.id }));
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
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="space-y-4"
    >
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
        {!readOnly && (
          <div className="ml-auto">
            <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" /> Nuevo Recurrente
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
        >
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
        </motion.div>
      )}
      </AnimatePresence>

      {loading ? (
        <div className="py-12"><Loader label="Cargando recurrentes..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay recurrentes para este filtro.</p>
          {!readOnly && <Button className="mt-3 h-9 shadow-none" onClick={openCreate}><Plus size={15} className="mr-1.5" /> Nuevo Recurrente</Button>}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
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
                <SelectPrimitive.Trigger className="inline-flex h-7 min-w-[60px] items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 hover:bg-slate-50 focus:outline-none"><SelectPrimitive.Value /><SelectPrimitive.Icon><ChevronDown size={12} className="text-slate-400" /></SelectPrimitive.Icon></SelectPrimitive.Trigger>
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
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
                  <Eye className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">{viewing?.descripcion}</Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">Información completa de la facturación recurrente.</Dialog.Description>
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
              {viewing && (
                <>
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2"><FileCheck className="h-3.5 w-3.5 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Información general</h3></div>
                    <div className="grid gap-3 text-sm sm:grid-cols-3">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Descripción</div><div className="font-semibold text-slate-800">{viewing.descripcion || "-"}</div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Estado</div><div><span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${getEstadoClasses(viewing.estado)}`}>{viewing.estado || "N/A"}</span></div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Frecuencia</div><div className="text-slate-800">{getFrecuenciaLabel(viewing.frecuencia)} - Día {viewing.dia_emision}</div></div>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Cliente y Configuración</h3></div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Razón Social</div><div className="text-sm font-medium text-slate-800">{viewing.cliente_nombre || getClienteLabel(viewing.id_cliente)}</div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Identificación</div><div className="text-sm text-slate-800">{viewing.cliente_identificacion || "-"}</div></div>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2"><Calculator className="h-3.5 w-3.5 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Resumen</h3></div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Facturas Generadas</div><div className="text-sm font-semibold text-slate-800">{viewing.total_facturas_generadas || 0}</div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Próxima Fact.</div><div className="text-sm text-slate-800">{viewing.proxima_facturacion || "-"}</div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Total Detalles</div><div className="text-sm text-slate-800">{viewing.total_detalles || 0}</div></div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200"><div className="text-xs text-slate-500 mb-0.5">Total Estimado</div><div className="text-sm font-semibold text-slate-800">{formatCurrency(viewing.total_estimado)}</div></div>
                    </div>
                  </div>

                  {viewing.detalles && viewing.detalles.length > 0 && (
                    <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-slate-500" /><h3 className="text-sm font-semibold text-slate-700">Detalles ({viewing.detalles.length})</h3></div>
                      <div className="space-y-2">
                        {viewing.detalles.map((d, idx) => (
                          <div key={idx} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3 items-center">
                            <div className="w-24 shrink-0"><div className="text-xs text-slate-500 mb-0.5">Código</div><div className="text-sm font-medium text-slate-800">{d.codigo || "-"}</div></div>
                            <div className="flex-1 min-w-0"><div className="text-xs text-slate-500 mb-0.5">Descripción</div><div className="text-sm text-slate-800">{d.descripcion || "-"}</div></div>
                            <div className="w-16 shrink-0 text-right"><div className="text-xs text-slate-500 mb-0.5">Cant.</div><div className="text-sm text-slate-800">{d.cantidad}</div></div>
                            <div className="w-24 shrink-0 text-right"><div className="text-xs text-slate-500 mb-0.5">P. Unit</div><div className="text-sm text-slate-800">{formatCurrency(d.precio_unitario)}</div></div>
                            <div className="w-24 shrink-0 text-right"><div className="text-xs text-slate-500 mb-0.5">Total</div><div className="text-sm font-semibold text-slate-800">{formatCurrency(d.total)}</div></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button variant="secondary" type="button" onClick={closeDetail} className="h-10 px-4">Cerrar</Button>
                  </div>
                </>
              )}
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal Generar Factura */}
      <Dialog.Root open={generarOpen} onOpenChange={setGenerarOpen}>
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,540px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
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
                  <RefreshCw className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">Generar Factura</Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Se generará una factura para el recurrente &quot;{generando?.descripcion}&quot;.
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

            <form onSubmit={(e) => { e.preventDefault(); handleGenerar(); }}>
              <div className="p-6 space-y-5">
                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Forma de pago *" htmlFor="gen-pago">
                      <SelectPrimitive.Root value={generarForm.forma_pago} onValueChange={(val) => setGenerarForm((f) => ({ ...f, forma_pago: val }))}>
                        <SelectPrimitive.Trigger id="gen-pago" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                          <SelectPrimitive.Value />
                          <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content className="z-50 min-w-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                            <SelectPrimitive.Viewport className="p-1">
                              {formasPago.map((f) => (
                                <SelectPrimitive.Item key={f.value} value={f.value} className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                  <SelectPrimitive.ItemText>{f.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>

                    <Field label="Tipo de pago *" htmlFor="gen-tipo">
                      <SelectPrimitive.Root value={generarForm.tipo_pago || "CONTADO"} onValueChange={(val) => setGenerarForm((f) => ({ ...f, tipo_pago: val as "CONTADO" | "CREDITO", dias_plazo: val === "CONTADO" ? 0 : f.dias_plazo }))}>
                        <SelectPrimitive.Trigger id="gen-tipo" className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                          <SelectPrimitive.Value />
                          <SelectPrimitive.Icon><ChevronDown className="h-4 w-4 text-slate-400" /></SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
                            <SelectPrimitive.Viewport className="p-1">
                              <SelectPrimitive.Item value="CONTADO" className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>Contado</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                              <SelectPrimitive.Item value="CREDITO" className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                                <SelectPrimitive.ItemText>Crédito</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Fecha de emisión *" htmlFor="gen-fecha">
                      <Input id="gen-fecha" type="date" value={generarForm.proxima_facturacion} onChange={(event) => setGenerarForm((f) => ({ ...f, proxima_facturacion: event.target.value }))} className="bg-white shadow-none" />
                    </Field>

                    {generarForm.tipo_pago === "CREDITO" && (
                      <Field label="Días de plazo" htmlFor="gen-dias">
                        <Input id="gen-dias" type="number" min={1} value={generarForm.dias_plazo ?? 0} onChange={(event) => setGenerarForm((f) => ({ ...f, dias_plazo: Math.max(1, Number(event.target.value) || 0) }))} className="bg-white shadow-none" placeholder="Ej: 30" />
                      </Field>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" type="button" onClick={closeGenerar} className="h-10 px-4">Cancelar</Button>
                  <Button type="submit" className="h-10 px-4">Generar Factura</Button>
                </div>
              </div>
            </form>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.section>
  );
}
