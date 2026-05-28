"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as Popover from "@radix-ui/react-popover";
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
  Trash,
  RefreshCw
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
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { useDashboardSection } from "@/src/components/dashboard/dashboard-section-context";
import { useAuthStore } from "@/src/modules/auth/store/auth.store";
import { confirmAction } from "@/src/lib/confirm";
import { motion, AnimatePresence } from "framer-motion";

interface GuiasRemisionPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

const initialFormState: GuiaFormState = {
  id_punto_emision: 0,
  fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0],
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

export function GuiasRemisionPanel({ showPanel = true, readOnly = false }: GuiasRemisionPanelProps) {
  const [guias, setGuias] = useState<GuiaRemisionItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<GuiaRemisionItem | null>(null);
  const [viewing, setViewing] = useState<GuiaRemisionItem | null>(null);
  const [form, setForm] = useState<GuiaFormState>(initialFormState);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteSearchResults, setClienteSearchResults] = useState<Cliente[]>([]);
  const [clienteSearching, setClienteSearching] = useState(false);
  const clienteSearchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [productoQueries, setProductoQueries] = useState<Record<number, string>>({});
  const [productoFocus, setProductoFocus] = useState<Record<number, boolean>>({});

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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [puntoSearch, setPuntoSearch] = useState("");
  const { setBreadcrumbs, setHeaderVisible } = useBreadcrumbs();
  const { setActiveSection } = useDashboardSection();

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const filteredPuntos = useMemo(() => puntos.filter((p) => !puntoSearch || p.codigo.toLowerCase().includes(puntoSearch.toLowerCase()) || p.descripcion.toLowerCase().includes(puntoSearch.toLowerCase())), [puntos, puntoSearch]);

  const filteredByEstado = useMemo(() => {
    if (filterEstado === "TODOS") return guias;
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
        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getEstadoClasses(row.original.estado)}`}>
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
                {!readOnly && canEdit(g) && <DropdownMenuItem onClick={() => openEdit(g)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>}
                {g.estado?.toUpperCase() === "AUTORIZADO" && (
                  <DropdownMenuItem onClick={() => window.open(`/api/guias-remision/${g.id}/pdf`, '_blank')} className="text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 font-medium">
                    <FileText size={14} className="mr-2" />
                    Descargar PDF
                  </DropdownMenuItem>
                )}
                {!readOnly && canEmitir(g) && <DropdownMenuItem onClick={() => handleEmitir(g)} className="text-sky-600 focus:bg-sky-50 focus:text-sky-700 font-medium"><Send size={14} className="mr-2" /> Emitir al SRI</DropdownMenuItem>}
                {!readOnly && (g.estado?.toUpperCase() === "AUTORIZADO" || canDelete(g)) && (
                  <>
                    <DropdownMenuSeparator />
                    {g.estado?.toUpperCase() === "AUTORIZADO" && (
                      <DropdownMenuItem onClick={() => handleAnular(g)} className="text-orange-600 focus:bg-orange-50 focus:text-orange-700 font-medium">
                        <X size={14} className="mr-2" /> Anular
                      </DropdownMenuItem>
                    )}
                    {canDelete(g) && <DropdownMenuItem onClick={() => handleDelete(g)} className="text-rose-600 focus:text-rose-600"><Trash2 size={14} className="mr-2" /> Eliminar</DropdownMenuItem>}
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

  const navigateTo = (section: string) => {
    setActiveSection(section);
  };

  useEffect(() => {
    if (editorOpen) {
      setHeaderVisible(false);
      setBreadcrumbs([
        { label: "Inicio", onClick: () => navigateTo("dashboard") },
        { label: "Guías de remisión", onClick: () => navigateTo("guias-remision") },
        { label: editing ? `Guía #${editing.numero_comprobante || editing.numero || editing.id}` : "Nueva guía" },
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
    return n > 0 && puntos.some((p) => p.id === n) ? n : (puntos[0]?.id ?? 0);
  };

  const canEdit = (guia: GuiaRemisionItem) =>
    guia.estado === "BORRADOR" || guia.estado === "RECHAZADA";
  const canDelete = (guia: GuiaRemisionItem) => guia.estado === "BORRADOR";
  const canEmitir = (guia: GuiaRemisionItem) =>
    guia.estado === "BORRADOR" || guia.estado === "RECHAZADA";

  const openCreate = () => {
    if (readOnly) return;
    setEditing(null);
    setClienteQuery("");
    setClienteSearchResults([]);
    setForm({
      ...initialFormState,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      detalles: [{ id_producto: 0, codigo: "", descripcion: "", cantidad: 1 }],
    });
    setProductoQueries({});
    setProductoFocus({});
    setEditorOpen(true);
  };

  const openEdit = (guia: GuiaRemisionItem) => {
    if (readOnly) return;
    setEditing(guia);
    setForm(toGuiaFormState(guia));
    setClienteQuery("");
    setClienteSearchResults([]);
    setProductoQueries({});
    setProductoFocus({});
    setEditorOpen(true);
  };

  const openDetail = (guia: GuiaRemisionItem) => {
    setViewing(guia);
    setDetailOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(initialFormState);
    setClienteQuery("");
    setClienteSearchResults([]);
    setProductoQueries({});
    setProductoFocus({});
  };

  const resetForm = () => {
    setForm({
      ...initialFormState,
      id_punto_emision: getDefaultPuntoId(),
      fecha_emision: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
      detalles: [{ id_producto: 0, codigo: "", descripcion: "", cantidad: 1 }],
    });
    setClienteQuery("");
    setClienteSearchResults([]);
    setProductoQueries({});
    setProductoFocus({});
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

  const handleClienteSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setClienteQuery(value);
    if (clienteSearchTimerRef.current) clearTimeout(clienteSearchTimerRef.current);
    if (!value.trim()) {
      setClienteSearchResults([]);
      return;
    }
    clienteSearchTimerRef.current = setTimeout(async () => {
      setClienteSearching(true);
      try {
        const results = await clientService.listClientes("ACTIVO", value.trim());
        setClienteSearchResults(results);
      } catch {
        // ignore
      } finally {
        setClienteSearching(false);
      }
    }, 300);
  };

  const selectCliente = (cliente: Cliente) => {
    setForm((f) => ({ ...f, id_cliente: cliente.id }));
    setClienteQuery("");
    setClienteSearchResults([]);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
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
      await loadGuias();
      closeEditor();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guia: GuiaRemisionItem) => {
    if (!await confirmAction({ title: "Eliminar guía de remisión", message: `¿Estás seguro de que deseas eliminar la guía ${guia.numero_comprobante || guia.id}? Esta acción no se puede deshacer.`, confirmText: "Eliminar", variant: "danger" })) return;
    try {
      await guiasRemisionService.deleteGuia(guia.id);
      toast.success("Guía eliminada");
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  };

  const handleAnular = async (guia: GuiaRemisionItem) => {
    if (!await confirmAction({ title: "Anular", message: "Esta acción cambiará el estado a Anulado en el sistema. Asegúrate de haber realizado la anulación también en el portal del SRI en Línea.\n\nEsta acción es irreversible.", confirmText: "Anular", variant: "danger" })) return;
    try {
      await guiasRemisionService.cambiarEstado(guia.id, "ANULADA");
      toast.success("Guía anulada");
      loadGuias();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al anular");
    }
  };

  const handleEmitir = async (guia: GuiaRemisionItem) => {
    if (!await confirmAction({ title: "Emitir al SRI", message: `¿Estás seguro de que deseas emitir la guía ${guia.numero_comprobante || guia.id} al SRI?`, confirmText: "Emitir", variant: "info" })) return;
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

  const getClienteLabel = (id: number) => {
    const c = clientes.find((x) => x.id === id);
    return c ? `${c.razon_social} (${c.identificacion})` : "-";
  };

  useEffect(() => {
    loadGuias();
    loadCatalogs();
  }, []);

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
            <Button
              variant="ghost"
              type="button"
              onClick={closeEditor}
              className="h-10 w-10 p-0 text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-slate-900">
                {editing ? "Editar guía de remisión" : "Nueva guía de remisión"}
              </p>
              <p className="text-xs text-slate-500">
                Completa los datos y agrega los productos antes de guardar.
              </p>
            </div>
          </div>
          <Button variant="secondary" type="button" onClick={resetForm} className="h-9 px-3 text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Limpiar
          </Button>
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
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
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
                          <div className="border-b border-slate-100 p-2">
                            <Input value={puntoSearch} onChange={(e) => setPuntoSearch(e.target.value)} placeholder="Buscar punto..." className="h-8 bg-white shadow-none w-full" onKeyDown={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} />
                          </div>
                          <SelectPrimitive.Viewport className="p-1">
                            {filteredPuntos.map((p) => (
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

              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Cliente</h3>
                </div>

                {form.id_cliente > 0 && clienteSearchResults.length === 0 && !clienteQuery.trim() ? (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600 text-xs font-bold">✓</span>
                      <span className="text-sm font-medium text-slate-800 truncate">{getClienteLabel(form.id_cliente)}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, id_cliente: 0 }));
                          setClienteQuery("");
                          setClienteSearchResults([]);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        title="Cambiar cliente"
                      >
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
                            onChange={handleClienteSearchChange}
                            placeholder="Buscar por cédula, RUC o razón social..."
                            className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all"
                          />
                          {clienteSearching && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                            </div>
                          )}
                        </div>
                      </Field>
                      {clienteSearchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                          {clienteSearchResults.map((cliente) => (
                            <button
                              key={cliente.id}
                              type="button"
                              onClick={() => selectCliente(cliente)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
                            >
                              <div className="font-medium text-slate-800">{cliente.razon_social}</div>
                              <div className="text-xs text-slate-500">{cliente.identificacion}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos del transporte</h3>
                </div>

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

              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Destino</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Productos a transportar</h3>
                  </div>
                  <Button type="button" variant="secondary" className="h-9 px-3" onClick={addDetalle}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Agregar
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <div className="min-w-[700px]">
                    <div className="grid grid-cols-[minmax(250px,1fr)_120px_minmax(150px,1fr)_100px_50px] gap-3 bg-slate-50 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200">
                      <span>Buscar Producto</span>
                      <span>Código</span>
                      <span>Descripción</span>
                      <span className="text-center">Cant.</span>
                      <span />
                    </div>
                    <div className="divide-y divide-slate-100">
                      {form.detalles.map((detalle, idx) => (
                        <div key={idx} className="grid grid-cols-[minmax(250px,1fr)_120px_minmax(150px,1fr)_100px_50px] items-center gap-3 bg-white px-4 py-2">
                          {/* Buscar Producto */}
                          <div className="relative">
                            {detalle.id_producto > 0 ? (
                              <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
                                <span className="text-xs font-medium text-slate-800 truncate" title={detalle.descripcion}>{detalle.descripcion}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateDetalle(idx, { id_producto: 0, codigo: "", descripcion: "" });
                                    setProductoQuery(idx, "");
                                  }}
                                  className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <Popover.Root
                                  open={productoFocus[idx]}
                                  onOpenChange={(open) => setProductoFocus((prev) => ({ ...prev, [idx]: open }))}
                                >
                                  <Popover.Anchor asChild>
                                    <div className="relative">
                                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                      <input
                                        type="text"
                                        value={getProductoQuery(idx)}
                                        onChange={(e) => setProductoQuery(idx, e.target.value)}
                                        onFocus={() => setProductoFocus((prev) => ({ ...prev, [idx]: true }))}
                                        placeholder="Nombre o código..."
                                        className="w-full pl-8 pr-3 py-1.5 h-9 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all shadow-none"
                                      />
                                    </div>
                                  </Popover.Anchor>
                                  <Popover.Portal>
                                    <Popover.Content
                                      className="z-[100] w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg max-h-60 overflow-y-auto p-0"
                                      align="start"
                                      sideOffset={4}
                                      onOpenAutoFocus={(e) => e.preventDefault()}
                                      onCloseAutoFocus={(e) => e.preventDefault()}
                                    >
                                      {getFilteredProductos(idx).length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-slate-500">Sin resultados.</div>
                                      ) : (
                                        getFilteredProductos(idx).map((p) => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                              updateDetalle(idx, {
                                                id_producto: p.id,
                                                codigo: p.codigo || "",
                                                descripcion: p.descripcion || "",
                                              });
                                              setProductoQuery(idx, "");
                                              setProductoFocus((prev) => ({ ...prev, [idx]: false }));
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-b-0"
                                          >
                                            <span className="font-medium text-slate-800 truncate">{p.descripcion}</span>
                                          </button>
                                        ))
                                      )}
                                    </Popover.Content>
                                  </Popover.Portal>
                                </Popover.Root>
                              </>
                            )}
                          </div>

                          {/* Código */}
                          <div className="text-xs font-medium text-slate-700 truncate" title={detalle.codigo || "-"}>
                            {detalle.codigo || "-"}
                          </div>

                          {/* Descripción */}
                          <div className="text-xs font-medium text-slate-700 truncate" title={detalle.descripcion || "-"}>
                            {detalle.descripcion || "-"}
                          </div>

                          {/* Cantidad */}
                          <div>
                              <Input
                                type="number"
                                min={1}
                                value={detalle.cantidad}
                                onChange={(event) => updateDetalle(idx, { cantidad: Number(event.target.value) })}
                                className="h-9 bg-white shadow-none text-xs text-center"
                              />
                          </div>

                          {/* Delete */}
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => removeDetalle(idx)}
                              disabled={form.detalles.length === 1}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                              title="Eliminar"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <h4 className="text-sm font-semibold text-slate-700">Resumen</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Cliente</span>
                    <span className="font-medium text-slate-800">{form.id_cliente ? getClienteLabel(form.id_cliente) : "No seleccionado"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Destino</span>
                    <span className="font-medium text-slate-800 truncate" title={form.direccion_destino}>{form.direccion_destino || "-"}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500">Transportista</span>
                    <span className="font-medium text-slate-800">{form.razon_social_transportista || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-200 pt-3 mt-3">
                    <span className="text-slate-600 font-medium">Total Productos</span>
                    <span className="font-bold text-slate-800">{form.detalles.reduce((acc, d) => acc + (Number(d.cantidad) || 0), 0)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <Button type="submit" disabled={saving} className="h-10 w-full">
                  {saving ? "Guardando..." : editing ? "Guardar guía" : "Crear guía"}
                </Button>
              </div>
            </aside>
          </div>
        </motion.form>
      </motion.section>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        {!readOnly && (
          <div className="ml-auto">
            <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap" disabled={loadingCatalogs}>
              <Plus size={15} className="mr-1.5" /> Nueva Guía
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
            <SelectPrimitive.Root value={filterEstado} onValueChange={(val) => setFilterEstado(val)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value placeholder="Todos los estados" />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="TODOS" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
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
                  <SelectPrimitive.Item value="ENVIADO" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Enviado</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="ANULADA" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Anulada</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
          </motion.div>
      )}
      </AnimatePresence>

      {loading ? (
        <div className="py-12"><Loader label="Cargando guías..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <Truck size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay guías para este filtro.</p>
          {!readOnly && <Button className="mt-3 h-9 shadow-none" onClick={openCreate} disabled={loadingCatalogs}><Plus size={15} className="mr-1.5" /> Nueva Guía</Button>}
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
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
                      Guía de Remisión {viewing?.numero_comprobante || viewing?.numero}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                      Información completa de la guía de remisión registrada.
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
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </section>
    </motion.div>
  );
}
