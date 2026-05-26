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
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
  FileCheck,
  Trash,
  Calendar,
  DollarSign,
  Percent,
  Tag,
  Calculator,
  Package,
  RefreshCw,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  LiquidacionCompraFormState,
  LiquidacionCompraItem,
} from "@/src/modules/liquidaciones-compra/types/liquidaciones-compra.types";
import { liquidacionesCompraService } from "@/src/modules/liquidaciones-compra/services/liquidaciones-compra.service";
import { toLiquidacionFormState } from "@/src/modules/liquidaciones-compra/utils/liquidaciones-compra-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { providerService } from "@/src/modules/providers/services/provider.service";
import type { Proveedor } from "@/src/modules/providers/types/provider.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { Loader } from "@/src/components/ui/loader";
import { confirmAction } from "@/src/lib/confirm";

interface LiquidacionesCompraPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

const initialDetail = (): LiquidacionCompraFormState["detalles"][0] => ({
  id_producto: 0,
  codigo: "",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  descuento: "0",
  tipo_descuento: "PORCENTAJE",
  codigo_iva: "4",
  porcentaje_iva: 15,
});

const initialFormState: LiquidacionCompraFormState = {
  id_punto_emision: 0,
  fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
  id_proveedor: 0,
  detalles: [initialDetail()],
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

export function LiquidacionesCompraPanel({ showPanel = true, readOnly = false }: LiquidacionesCompraPanelProps) {
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionCompraItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<LiquidacionCompraItem | null>(null);
  const [viewing, setViewing] = useState<LiquidacionCompraItem | null>(null);
  const [form, setForm] = useState<LiquidacionCompraFormState>(initialFormState);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [productoQueries, setProductoQueries] = useState<Record<number, string>>({});
  const [productoFocus, setProductoFocus] = useState<Record<number, boolean>>({});

  const { setBreadcrumbs, setHeaderVisible } = useBreadcrumbs();
  const { setActiveSection } = useDashboardSection();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailItem, setEmailItem] = useState<LiquidacionCompraItem | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const getProductoQuery = (index: number) => productoQueries[index] ?? "";
  const setProductoQuery = (index: number, value: string) => {
    setProductoQueries((prev) => ({ ...prev, [index]: value }));
  };

  const getFilteredProductos = (index: number) => {
    const query = getProductoQuery(index).trim().toLowerCase();
    if (!query) return productos.slice(0, 50);
    return productos.filter((p) => 
      (p.descripcion?.toLowerCase().includes(query) || p.codigo?.toLowerCase().includes(query))
    ).slice(0, 50);
  };

  useEffect(() => {
    if (editorOpen) {
      const navigateTo = (section: string) => {
        closeEditor();
        setActiveSection(section);
      };

      setHeaderVisible(false);
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Liquidaciones de Compra", onClick: () => navigateTo("liquidaciones-compra") },
        { label: editing ? "Editar liquidación" : "Nueva liquidación" },
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
    loadLiquidaciones();
    loadCatalogs();
  }, []);

  const loadLiquidaciones = async () => {
    setLoading(true);
    try {
      const data = await liquidacionesCompraService.listLiquidaciones();
      setLiquidaciones(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar liquidaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const [puntosData, proveedoresData, productosData] = await Promise.all([
        emissionPointService.listPuntos(),
        providerService.listProveedores(),
        productService.listProductos()
      ]);
      setPuntos(puntosData);
      setProveedores(proveedoresData);
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
    if (!filterEstado) return liquidaciones;
    return liquidaciones.filter((l) => l.estado === filterEstado);
  }, [liquidaciones, filterEstado]);

  const columns = useMemo<ColumnDef<LiquidacionCompraItem>[]>(() => [
    {
      accessorKey: "numero_comprobante",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Número <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-slate-800">{row.original.numero_comprobante || row.original.numero || "-"}</div>
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
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getEstadoClasses(row.original.estado || "")}`}>{row.original.estado}</span>
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
          <div className="font-medium text-slate-800">{row.original.proveedor_nombre || getProveedorLabel(row.original.id_proveedor || 0)}</div>
          <div className="text-xs text-slate-500">{row.original.proveedor_identificacion || ""}</div>
        </div>
      ),
    },
    {
      accessorKey: "fecha_emision",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.fecha_emision}</span>,
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
        const l = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none">
                  <MoreVertical size={16} strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openDetail(l)}><Eye size={14} className="mr-2" /> Ver detalle</DropdownMenuItem>
                {!readOnly && canEdit(l) && <DropdownMenuItem onClick={() => openEdit(l)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>}
                {l.estado?.toUpperCase() === "AUTORIZADO" && (
                  <>
                    <DropdownMenuItem onClick={() => window.open(`/api/liquidaciones-compra/${l.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                      <FileText size={14} className="mr-2" />
                      Descargar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEmailDialog(l)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium">
                      <Mail size={14} className="mr-2" />
                      Enviar por correo
                    </DropdownMenuItem>
                  </>
                )}
                {!readOnly && canEmitir(l) && <DropdownMenuItem onClick={() => handleEmitir(l)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium"><Send size={14} className="mr-2" /> Emitir al SRI</DropdownMenuItem>}
                {!readOnly && (l.estado?.toUpperCase() === "AUTORIZADO" || canDelete(l)) && (
                  <>
                    <DropdownMenuSeparator />
                    {l.estado?.toUpperCase() === "AUTORIZADO" && (
                      <DropdownMenuItem onClick={() => handleAnular(l)} className="text-orange-600 focus:bg-orange-50 focus:text-orange-700 font-medium">
                        <X size={14} className="mr-2" /> Anular
                      </DropdownMenuItem>
                    )}
                    {canDelete(l) && <DropdownMenuItem onClick={() => handleDelete(l)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem>}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [proveedores, readOnly]);

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

  const canEdit = (liq: LiquidacionCompraItem) =>
    liq.estado === "BORRADOR" || liq.estado === "RECHAZADA";
  const canDelete = (liq: LiquidacionCompraItem) => liq.estado === "BORRADOR";
  const canEmitir = (liq: LiquidacionCompraItem) =>
    liq.estado === "BORRADOR" || liq.estado === "RECHAZADA";

  const openCreate = () => {
    if (readOnly) return;
    setEditing(null);
    setForm(initialFormState);
    setProductoQueries({});
    setProductoFocus({});
    setEditorOpen(true);
  };

  const openEdit = (liq: LiquidacionCompraItem) => {
    if (readOnly) return;
    setEditing(liq);
    setForm(toLiquidacionFormState(liq));
    setProductoQueries({});
    setProductoFocus({});
    setEditorOpen(true);
  };

  const openDetail = (liq: LiquidacionCompraItem) => {
    setViewing(liq);
    setDetailOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm({ ...initialFormState, detalles: [initialDetail()] });
    setProductoQueries({});
    setProductoFocus({});
  };

  const resetForm = () => {
    setForm({
      ...initialFormState,
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
      detalles: [initialDetail()],
    });
    setProductoQueries({});
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
    if (!form.id_proveedor) {
      toast.error("Seleccione un proveedor");
      return false;
    }
    if (!form.fecha_emision) {
      toast.error("Ingrese la fecha de emisión");
      return false;
    }
    if (form.detalles.length === 0 || form.detalles.every((d) => !d.descripcion)) {
      toast.error("Agregue al menos un detalle a la liquidación");
      return false;
    }
    const invalidDetalle = form.detalles.find((d) => !d.descripcion || Number(d.cantidad) <= 0);
    if (invalidDetalle) {
      toast.error("Todos los detalles deben tener descripción y cantidad mayor a 0");
      return false;
    }
    return true;
  };

  const buildPayload = () => {
    const detalles = form.detalles.map((item) => {
      return {
        codigo: item.codigo,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        descuento: getDescuentoValor(item),
        codigo_iva: item.codigo_iva,
        porcentaje_iva: item.porcentaje_iva,
      };
    });

    return {
      id_punto_emision: form.id_punto_emision,
      fecha_emision: form.fecha_emision,
      id_proveedor: form.id_proveedor,
      detalles,
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = buildPayload();

    try {
      if (editing) {
        await liquidacionesCompraService.updateLiquidacion(editing.id, payload);
        toast.success("Liquidación actualizada");
      } else {
        await liquidacionesCompraService.createLiquidacion(payload);
        toast.success("Liquidación creada");
      }
      closeEditor();
      loadLiquidaciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  };

  const handleDelete = async (liq: LiquidacionCompraItem) => {
    if (!await confirmAction({ title: "Eliminar liquidación", message: `¿Estás seguro de que deseas eliminar la liquidación ${liq.numero_comprobante || liq.id}? Esta acción no se puede deshacer.`, confirmText: "Eliminar", variant: "danger" })) return;
    try {
      await liquidacionesCompraService.deleteLiquidacion(liq.id);
      toast.success("Liquidación eliminada");
      loadLiquidaciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleAnular = async (liq: LiquidacionCompraItem) => {
    if (!await confirmAction({ title: "Anular", message: "Esta acción cambiará el estado a Anulado en el sistema. Asegúrate de haber realizado la anulación también en el portal del SRI en Línea.\n\nEsta acción es irreversible.", confirmText: "Anular", variant: "danger" })) return;
    try {
      await liquidacionesCompraService.cambiarEstado(liq.id, "ANULADA");
      toast.success("Liquidación anulada");
      loadLiquidaciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al anular");
    }
  };

  const handleEmitir = async (liq: LiquidacionCompraItem) => {
    if (!await confirmAction({ title: "Emitir al SRI", message: `¿Estás seguro de que deseas emitir la liquidación ${liq.numero_comprobante || liq.id} al SRI?`, confirmText: "Emitir", variant: "info" })) return;
    try {
      await liquidacionesCompraService.emitirLiquidacion(liq.id);
      toast.success("Liquidación emitida al SRI");
      loadLiquidaciones();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al emitir");
    }
  };

  const openEmailDialog = (item: LiquidacionCompraItem) => {
    setEmailItem(item);
    let proveedor = proveedores.find((p) => p.id === item.id_proveedor);
    if (!proveedor && item.proveedor_identificacion) {
      proveedor = proveedores.find((p) => p.identificacion === item.proveedor_identificacion);
    }
    setEmailAddress(proveedor?.email || "");
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailItem || emailSending) return;

    const email = emailAddress.trim();
    if (!email) return toast.error("Ingresa un correo de destino.");

    setEmailSending(true);
    try {
      await liquidacionesCompraService.enviarCorreo(emailItem.id, email);
      toast.success("Correo enviado correctamente.");
      setEmailDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el correo.");
    } finally {
      setEmailSending(false);
    }
  };

  const updateDetail = (index: number, field: keyof LiquidacionCompraFormState["detalles"][0], value: string | number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addDetalle = () => {
    setForm((f) => ({
      ...f,
      detalles: [...f.detalles, initialDetail()],
    }));
  };

  const removeDetalle = (idx: number) => {
    setForm((f) => ({
      ...f,
      detalles: f.detalles.filter((_, i) => i !== idx),
    }));
  };

  const updateDetalle = (idx: number, updates: Partial<LiquidacionCompraFormState["detalles"][0]>) => {
    setForm((f) => {
      const nuevos = [...f.detalles];
      nuevos[idx] = { ...nuevos[idx], ...updates };
      return { ...f, detalles: nuevos };
    });
  };

  const handleIvaChange = (idx: number, codigo: string) => {
    const ivaOption = codigosIva.find((i) => i.value === codigo);
    updateDetalle(idx, { codigo_iva: codigo, porcentaje_iva: ivaOption?.porcentaje || 0 });
  };

  const getProductoById = (productoId?: number) => {
    if (!productoId) return undefined;
    return productos.find((item) => item.id === productoId);
  };

  const getDescuentoValor = (detalle: LiquidacionCompraFormState["detalles"][0]) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const precio = detalle.precio_unitario;
    const raw = Math.max(Number(detalle.descuento) || 0, 0);
    if (detalle.tipo_descuento === "PORCENTAJE") {
      return (cantidad * precio) * (raw / 100);
    }
    return raw;
  };

  const getDetalleSubtotal = (detalle: LiquidacionCompraFormState["detalles"][0]) => {
    const cantidad = Number(detalle.cantidad) || 0;
    const precio = detalle.precio_unitario;
    const descuentoValor = getDescuentoValor(detalle);
    const subtotal = cantidad * precio - descuentoValor;
    return subtotal < 0 ? 0 : subtotal;
  };

  const getDetalleTotal = (detalle: LiquidacionCompraFormState["detalles"][0]) => {
    const base = getDetalleSubtotal(detalle);
    const ivaPct = detalle.porcentaje_iva;
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

  const calcularTotales = () => {
    return form.detalles.reduce(
      (acc, d) => {
        const producto = getProductoById(d.id_producto);
        const descuento = getDescuentoValor(d);
        const base = getDetalleSubtotal(d);
        const ivaPct = d.porcentaje_iva;
        const iva = (base * ivaPct) / 100;
        const cantidad = Number(d.cantidad) || 0;
        const icePct = producto?.porcentaje_ice ?? 0;
        const irbpnrVal = producto?.valor_unitario_irbpnr ?? 0;
        const ice = producto?.tiene_ice ? (base * icePct) / 100 : 0;
        const irbpnr = producto?.tiene_irbpnr ? cantidad * irbpnrVal : 0;
        const total = base + iva + ice + irbpnr;
        return {
          subtotal: acc.subtotal + base,
          descuento: acc.descuento + descuento,
          iva: acc.iva + iva,
          ice: acc.ice + ice,
          irbpnr: acc.irbpnr + irbpnr,
          icePcts: producto?.tiene_ice
            ? acc.icePcts.includes(icePct) ? acc.icePcts : [...acc.icePcts, icePct]
            : acc.icePcts,
          irbpnrValues: producto?.tiene_irbpnr
            ? acc.irbpnrValues.includes(irbpnrVal) ? acc.irbpnrValues : [...acc.irbpnrValues, irbpnrVal]
            : acc.irbpnrValues,
          total: acc.total + total,
        };
      },
      { subtotal: 0, descuento: 0, iva: 0, ice: 0, irbpnr: 0, icePcts: [] as number[], irbpnrValues: [] as number[], total: 0 }
    );
  };

  const getEstadoClasses = (estado: string) => {
    switch (estado) {
      case "AUTORIZADO":
        return "bg-emerald-100 text-emerald-700";
      case "BORRADOR":
        return "bg-amber-100 text-amber-700";
      case "ENVIADO":
        return "bg-blue-100 text-blue-700";
      case "RECHAZADA":
        return "bg-rose-100 text-rose-700";
      case "ANULADA":
        return "bg-slate-100 text-slate-600";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getProveedorLabel = (id: number) => {
    const p = proveedores.find((x) => x.id === id);
    return p ? `${p.razon_social} (${p.identificacion})` : "-";
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return "$0.00";
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
  };

  if (!showPanel) return null;

  const totales = calcularTotales();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <section className="space-y-4">
      {!editorOpen && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar liquidación..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        {!readOnly && (
          <div className="ml-auto">
            <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" /> Nueva Liquidación
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
                  {["TODOS", "BORRADOR", "ENVIADO", "AUTORIZADO", "RECHAZADA", "ANULADA"].map((e) => (
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
        <div className="py-12"><Loader label="Cargando liquidaciones..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay liquidaciones para este filtro.</p>
          {!readOnly && <Button className="mt-3 h-9 shadow-none" onClick={openCreate}><Plus size={15} className="mr-1.5" /> Nueva Liquidación</Button>}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
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
                  <tr key={row.id} className={`hover:bg-slate-50/60 transition-colors${row.original.estado?.toUpperCase() === "ANULADA" ? " bg-slate-50" : ""}`}>
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
        </motion.div>
      )}

        </>
      )}

      {editorOpen && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-4"
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
                  {editing ? "Editar liquidación de compra" : "Nueva liquidación de compra"}
                </p>
                <p className="text-xs text-slate-500">
                  Completa los datos y agrega los detalles antes de guardar.
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04, ease: [0.25, 0.1, 0.25, 1] }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          >
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-6">
              {/* SECCIÓN: Información general */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Punto de emisión *" htmlFor="liq-punto">
                    <SelectPrimitive.Root 
                      value={form.id_punto_emision === 0 ? undefined : form.id_punto_emision.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_punto_emision: Number(val) }))}
                      disabled={Boolean(editing) || loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="liq-punto"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un punto..."} />
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

                  <Field label="Proveedor *" htmlFor="liq-proveedor">
                    <SelectPrimitive.Root 
                      value={form.id_proveedor === 0 ? undefined : form.id_proveedor.toString()} 
                      onValueChange={(val) => setForm((f) => ({ ...f, id_proveedor: Number(val) }))}
                      disabled={loadingCatalogs}
                    >
                      <SelectPrimitive.Trigger 
                        id="liq-proveedor"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingCatalogs ? "Cargando..." : "Selecciona un proveedor..."} className="truncate" />
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
                            {proveedores.map((prov) => (
                              <SelectPrimitive.Item 
                                key={prov.id}
                                value={prov.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{prov.razon_social} ({prov.identificacion})</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Fecha de emisión *" htmlFor="liq-fecha">
                    <Input
                      id="liq-fecha"
                      type="date"
                      value={form.fecha_emision}
                      onChange={(event) => setForm((f) => ({ ...f, fecha_emision: event.target.value }))}
                      className="bg-white shadow-none"
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Detalles */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Servicios/Productos</h3>
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
                    <Button type="button" variant="secondary" className="h-9 px-3" onClick={addDetalle}>
                      <Plus className="mr-1.5 h-4 w-4" />
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
                      {form.detalles.map((detalle, idx) => {
                        const producto = getProductoById(detalle.id_producto);
                        const base = getDetalleSubtotal(detalle);
                        const subtotalLinea = base;
                        const cantidad = Number(detalle.cantidad) || 0;
                        return (
                          <div
                            key={idx}
                            className="grid items-center gap-3 bg-white px-3 py-2 lg:grid-cols-[60px_minmax(180px,1fr)_60px_90px_88px_72px_76px_62px_80px_44px]"
                          >
                            {/* Código (read-only, from product catalog) */}
                            <span className="text-xs text-slate-500 truncate">
                              {producto?.codigo || detalle.codigo || "-"}
                            </span>

                            {/* Descripción (Select product from catalog) */}
                            <SelectPrimitive.Root
                              value={detalle.id_producto === 0 ? undefined : detalle.id_producto.toString()}
                              onValueChange={(val) => {
                                const p = productos.find((item) => item.id === Number(val));
                                if (p) {
                                  const ivaCodigo = p.iva_codigo || String(p.id_iva);
                                  const ivaPorcentaje = p.iva_porcentaje ?? p.porcentaje_iva ?? codigosIva.find((i) => i.value === ivaCodigo)?.porcentaje ?? 15;
                                  updateDetalle(idx, {
                                    id_producto: p.id,
                                    codigo: p.codigo || "",
                                    descripcion: p.descripcion || "",
                                    precio_unitario: p.precio || 0,
                                    codigo_iva: ivaCodigo,
                                    porcentaje_iva: ivaPorcentaje,
                                  });
                                }
                                setProductoQuery(idx, "");
                              }}
                              disabled={loadingCatalogs}
                            >
                              <SelectPrimitive.Trigger
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
                                      value={getProductoQuery(idx)}
                                      onChange={(event) => setProductoQuery(idx, event.target.value)}
                                      placeholder="Buscar por nombre o código..."
                                      className="h-8 bg-white shadow-none w-full"
                                      onKeyDown={(event) => event.stopPropagation()}
                                      onPointerDown={(event) => event.stopPropagation()}
                                    />
                                  </div>
                                  <SelectPrimitive.Viewport className="p-1 max-h-56 overflow-y-auto">
                                    {getFilteredProductos(idx).length === 0 ? (
                                      <div className="px-3 py-2 text-xs text-slate-500">Sin resultados.</div>
                                    ) : (
                                      getFilteredProductos(idx).map((item) => (
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

                            {/* Cantidad */}
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={detalle.cantidad}
                              onChange={(event) => {
                                let cleaned = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); }
                                updateDetail(idx, "cantidad", cleaned === "" ? 0 : Number(cleaned));
                              }}
                              placeholder="Cant."
                              className="h-9 bg-white shadow-none"
                            />

                            {/* Precio (read-only, from catalog) */}
                            <span className="text-sm text-slate-700">
                              {formatCurrency(detalle.precio_unitario)}
                            </span>

                            {/* IVA (read-only, from product) */}
                            <span className="text-xs text-slate-500">
                              {detalle.porcentaje_iva}%
                            </span>

                            {/* ICE (read-only, calculated from product) */}
                            <span className="text-xs text-amber-600 font-medium">
                              {producto?.tiene_ice ? `${producto.porcentaje_ice}% · ${formatCurrency(base * ((producto.porcentaje_ice ?? 0) / 100))}` : "-"}
                            </span>

                            {/* IRBPNR (read-only, calculated from product) */}
                            <span className="text-xs text-purple-600 font-medium">
                              {producto?.tiene_irbpnr ? formatCurrency(cantidad * (producto.valor_unitario_irbpnr ?? 0)) : "-"}
                            </span>

                            {/* Descuento (user-editable) */}
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={detalle.descuento}
                              onChange={(event) => {
                                let cleaned = event.target.value.replace(/,/g, ".").replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
                                if (cleaned.includes(".")) { const [int, dec] = cleaned.split("."); cleaned = int + "." + dec.slice(0, 2); }
                                updateDetail(idx, "descuento", cleaned);
                              }}
                              className="h-9 bg-white shadow-none"
                            />

                            {/* Total (calculated) */}
                            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                              {formatCurrency(subtotalLinea)}
                            </span>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => removeDetalle(idx)}
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
                    <span className="text-slate-700">IVA:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(totales.iva)}</span>
                  </div>
                )}
                {totales.ice > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {totales.icePcts.length === 1 ? `ICE (${totales.icePcts[0]}%):` : "ICE:"}
                    </span>
                    <span className="font-medium text-amber-600">{formatCurrency(totales.ice)}</span>
                  </div>
                )}
                {totales.irbpnr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-700">
                      {totales.irbpnrValues.length === 1 ? `IRBPNR ($${totales.irbpnrValues[0].toFixed(2)}):` : "IRBPNR:"}
                    </span>
                    <span className="font-medium text-purple-600">{formatCurrency(totales.irbpnr)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span className="text-sm font-bold text-slate-800">Total:</span>
                  <span className="text-xl font-extrabold text-sky-700">{formatCurrency(totales.total)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button onClick={handleSubmit} className="h-10 w-full">
                  {editing ? "Guardar cambios" : "Crear liquidación"}
                </Button>
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
            />
          </Dialog.Overlay>
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Header con icono y título */}
              <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                    <Eye className="h-6 w-6 text-app-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      Liquidación {viewing?.numero_comprobante || viewing?.numero}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Información completa de la liquidación de compra registrada.
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
                {viewing && (
                  <>
                  {viewing.estado?.toUpperCase() === "ANULADA" && (
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

                  {/* SECCIÓN: Proveedor */}
                  <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Proveedor</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Razón Social</div>
                        <div className="text-sm font-medium text-slate-800">{viewing.proveedor_nombre || getProveedorLabel(viewing.id_proveedor)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-200">
                        <div className="text-xs text-slate-500 mb-0.5">Identificación</div>
                        <div className="text-sm text-slate-800">{viewing.proveedor_identificacion || "-"}</div>
                      </div>
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
                  <div className="flex justify-end pt-2 gap-2">
                    {viewing?.estado?.toUpperCase() === "AUTORIZADO" && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          closeDetail();
                          openEmailDialog(viewing);
                        }}
                        className="h-10 px-4 gap-2"
                      >
                        <Mail size={14} />
                        Enviar por correo
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
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
            />
          </Dialog.Overlay>
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                    <Mail className="h-6 w-6 text-app-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-xl font-semibold text-slate-900">
                      Enviar liquidación por correo
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
                    <dt className="text-xs font-semibold text-slate-500">Proveedor</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-800">
                      {emailItem ? (proveedores.find((p) => p.id === emailItem.id_proveedor || (emailItem.proveedor_identificacion && p.identificacion === emailItem.proveedor_identificacion))?.razon_social || emailItem.proveedor_nombre || "Proveedor") : "-"}
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
      </section>
    </motion.div>
  );
}
