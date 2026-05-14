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
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Package, Search, ChevronLeft, ChevronRight, Edit3, Power, Plus, X, ChevronsUpDown, ArrowUp, ArrowDown, ChevronDown, ListFilter, MoreVertical, Tag, Layers, DollarSign, Percent, FileText, Box, Eye } from "lucide-react";
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
import { Switch } from "@/src/components/ui/switch";
import type {
  Producto,
  ProductoFormInput,
  ProductoUpdateInput,
} from "@/src/modules/products/types/product.types";
import { toProductoFormInput } from "@/src/modules/products/utils/product-payload.utils";
import { productService } from "@/src/modules/products/services/product.service";
import { productGroupService } from "@/src/modules/product-groups/services/product-group.service";
import type { GrupoProducto } from "@/src/modules/product-groups/types/product-group.types";
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";
import { Loader } from "@/src/components/ui/loader";

const initialForm: ProductoFormInput = {
  codigo: "",
  descripcion: "",
  tipo: "",
  id_grupo: 0,
  id_iva: 0,
  unidad_medida: "",
  precio: 0,
  tiene_ice: false,
  porcentaje_ice: 0,
  codigo_ice: "",
  tiene_irbpnr: false,
  valor_unitario_irbpnr: 0.02,
};

const iceSRIMap: Record<string, number> = {
  "3021": 15,
  "3031": 15,
  "3041": 15,
  "3072": 10,
  "3073": 10,
  "3081": 15,
  "3091": 10,
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;
type EstadoFiltro = (typeof estadoFilters)[number];

interface ProductsPanelProps {
  showPanel?: boolean;
}

function SortIcon({ column }: { column: Column<Producto> }) {
  const sorted = column.getIsSorted();
  if (sorted === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
  if (sorted === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
  return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
}

export function ProductsPanel({ showPanel = true }: ProductsPanelProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [grupos, setGrupos] = useState<GrupoProducto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [loadingIva, setLoadingIva] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<Producto | null>(null);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoFormInput>(initialForm);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [unidadSearch, setUnidadSearch] = useState("");
  const [grupoSearch, setGrupoSearch] = useState("");

  const unidadesMedida = useMemo(
    () => [
      { value: "UNIDAD", label: "Unidad" },
      { value: "KG", label: "Kilogramo (kg)" },
      { value: "GR", label: "Gramo (g)" },
      { value: "LT", label: "Litro (lt)" },
      { value: "ML", label: "Mililitro (ml)" },
      { value: "M", label: "Metro (m)" },
      { value: "CM", label: "Centimetro (cm)" },
      { value: "M2", label: "Metro cuadrado (m²)" },
      { value: "M3", label: "Metro cubico (m³)" },
      { value: "HORA", label: "Hora" },
      { value: "CAJA", label: "Caja" },
      { value: "PAQUETE", label: "Paquete" },
      { value: "DOCENA", label: "Docena" },
      { value: "BULTO", label: "Bulto" },
      { value: "BARRIL", label: "Barril" },
      { value: "GALON", label: "Galon" },
    ],
    []
  );

  const unidadesFiltradas = useMemo(() => {
    const query = unidadSearch.trim().toLowerCase();
    if (!query) return unidadesMedida;
    return unidadesMedida.filter((unidad) =>
      `${unidad.label} ${unidad.value}`.toLowerCase().includes(query)
    );
  }, [unidadSearch, unidadesMedida]);

  const gruposFiltrados = useMemo(() => {
    const query = grupoSearch.trim().toLowerCase();
    if (!query) return grupos;
    return grupos.filter((grupo) => grupo.nombre.toLowerCase().includes(query));
  }, [grupoSearch, grupos]);

  const getGrupoNombre = (id: number) => {
    return grupos.find((grupo) => grupo.id === id)?.nombre ?? "-";
  };

  const groupColors = [
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-purple-100 text-purple-700",
    "bg-amber-100 text-amber-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
    "bg-indigo-100 text-indigo-700",
    "bg-cyan-100 text-cyan-700",
    "bg-rose-100 text-rose-700",
    "bg-lime-100 text-lime-700",
  ];

  const getGrupoColor = (id: number) => {
    return groupColors[id % groupColors.length];
  };

  const getIvaNombre = (id: number) => {
    const codigo = codigosIva.find((item) => item.id === id);
    if (!codigo) return "-";
    const porcentaje = `${codigo.porcentaje.toFixed(2)}%`;
    return codigo.nombre ? `${codigo.nombre} (${porcentaje})` : porcentaje;
  };

  const columns = useMemo<ColumnDef<Producto>[]>(() => [
    {
      accessorKey: "descripcion",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Producto
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.descripcion}</div>
          <div className="text-slate-500 text-xs">{row.original.codigo}</div>
        </div>
      ),
    },
    {
      accessorKey: "id_grupo",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Grupo
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getGrupoColor(row.original.id_grupo)}`}>
          {getGrupoNombre(row.original.id_grupo)}
        </span>
      ),
    },
    {
      accessorKey: "id_iva",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          IVA
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{getIvaNombre(row.original.id_iva)}</span>,
    },
    {
      accessorKey: "precio",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Precio
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="font-medium text-slate-800">${row.original.precio.toFixed(2)}</span>,
    },
    {
      id: "precio_iva",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Precio + IVA
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const porcentaje = row.original.porcentaje_iva ?? 0;
        const total = row.original.precio * (1 + porcentaje / 100);
        return <span className="font-medium text-sky-700">${total.toFixed(2)}</span>;
      },
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${row.getValue("estado") === "INACTIVO" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
          }`}>
          {row.getValue("estado") || "ACTIVO"}
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
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Edit3 size={14} className="mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleActivo(row.original)}>
                <Power size={14} className="mr-2" />
                {row.original.estado === "INACTIVO" ? "Activar" : "Desactivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [grupos, codigosIva]);

  const table = useReactTable({
    data: productos,
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
    const loadGrupos = async () => {
      setLoadingGrupos(true);
      try {
        const data = await productGroupService.listGrupos("ACTIVO");
        setGrupos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los grupos.";
        toast.error(message);
      } finally {
        setLoadingGrupos(false);
      }
    };

    void loadGrupos();
  }, []);

  useEffect(() => {
    const loadIva = async () => {
      setLoadingIva(true);
      try {
        const data = await ivaService.listCodigos(true);
        setCodigosIva(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los codigos IVA.";
        toast.error(message);
      } finally {
        setLoadingIva(false);
      }
    };

    void loadIva();
  }, []);

  useEffect(() => {
    const loadProductos = async () => {
      setLoading(true);
      try {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await productService.listProductos(estado);
        setProductos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los productos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProductos();
  }, [filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_grupo: grupos[0]?.id ?? 0,
      id_iva: codigosIva[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const openEdit = async (producto: Producto) => {
    try {
      const detail = await productService.getProducto(producto.id);
      setEditing(detail);
      setForm(toProductoFormInput(detail));
      setModalOpen(true);
    } catch (error) {
      toast.error("No se pudieron cargar los detalles del producto.");
      setEditing(producto);
      setForm(toProductoFormInput(producto));
      setModalOpen(true);
    }
  };

  const openDetail = async (producto: Producto) => {
    try {
      const data = await productService.getProducto(producto.id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo obtener el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof ProductoFormInput, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizeDecimal = (value: number, fallback: number) => {
    return Number.isFinite(value) ? value : fallback;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const normalizedIce = form.tiene_ice
      ? normalizeDecimal(form.porcentaje_ice, 0)
      : 0;
    const normalizedIrbpnr = form.tiene_irbpnr
      ? normalizeDecimal(form.valor_unitario_irbpnr, 0.02)
      : 0;

    try {
      if (editing) {
        const payload: ProductoUpdateInput = {
          // codigo no se incluye: el backend no permite actualizarlo
          descripcion: form.descripcion,
          tipo: form.tipo,
          id_grupo: form.id_grupo,
          id_iva: form.id_iva,
          unidad_medida: form.unidad_medida,
          precio: form.precio,
          tiene_ice: form.tiene_ice,
          porcentaje_ice: normalizedIce,
          codigo_ice: form.codigo_ice,
          tiene_irbpnr: form.tiene_irbpnr,
          valor_unitario_irbpnr: normalizedIrbpnr,
        };
        await productService.updateProducto(editing.id, payload);
        // Obtener datos frescos del backend via detalle para reflejo inmediato y preciso
        const fresh = await productService.getProducto(editing.id);
        setProductos((prev) =>
          prev.map((p) => (p.id === fresh.id ? fresh : p))
        );
        toast.success("Producto actualizado.");
      } else {
        await productService.createProducto({
          codigo: form.codigo,
          descripcion: form.descripcion,
          tipo: form.tipo,
          id_grupo: form.id_grupo,
          id_iva: form.id_iva,
          unidad_medida: form.unidad_medida,
          precio: form.precio,
          tiene_ice: form.tiene_ice,
          porcentaje_ice: normalizedIce,
          codigo_ice: form.codigo_ice,
          tiene_irbpnr: form.tiene_irbpnr,
          valor_unitario_irbpnr: normalizedIrbpnr,
        });
        // Recarga completa en creación para incluir el nuevo producto
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await productService.listProductos(estado);
        setProductos(data);
        toast.success("Producto creado.");
      }

      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el producto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (producto: Producto) => {
    try {
      await productService.toggleProductoActivo(producto.id, producto.estado ?? "ACTIVO");
      const estado = filter === "TODOS" ? undefined : filter;
      const data = await productService.listProductos(estado);
      setProductos(data);
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  if (!showPanel) return null;

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
              placeholder="Buscar producto..."
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
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
            <Plus size={15} className="mr-1.5" />
            Nuevo producto
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
                  <SelectPrimitive.Item value="descripcion" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Producto</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="precio" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Precio</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        </div>
      )}

      {/* Estado vacío o Tabla */}
      {loading || loadingGrupos || loadingIva ? (
        <Loader label="Cargando productos" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Package size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay productos para este filtro.</p>
          <Button onClick={openCreate} className="mt-3 h-9 shadow-none">
            <Plus size={15} className="mr-1.5" />
            Registrar producto
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden">
          {/* Tabla con react-table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 whitespace-nowrap text-xs text-slate-500"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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

          {/* Footer Minimalista (Paginación) */}
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

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
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
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Box className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar producto" : "Crear nuevo producto"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos del producto existente en tu catálogo."
                      : "Registra un nuevo producto o servicio con sus datos de clasificación y precios."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
              {/* SECCIÓN: Identificación */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Identificación</h3>
                </div>
                {/* Modo CREAR: codigo + tipo en fila 1, descripcion en fila 2 (span-2) */}
                {/* Modo EDITAR: tipo + descripcion en la misma fila (2 columnas) */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {!editing && (
                    <Field label="Código" htmlFor="codigo">
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(event) => updateField("codigo", event.target.value)}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: PROD-001"
                        required
                      />
                    </Field>
                  )}

                  <Field label="Tipo" htmlFor="tipo">
                    <SelectPrimitive.Root
                      value={form.tipo || undefined}
                      onValueChange={(val) => updateField("tipo", val)}
                    >
                      <SelectPrimitive.Trigger
                        id="tipo"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value placeholder="Selecciona un tipo..." />
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
                            <SelectPrimitive.Item
                              value="PRODUCTO"
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>Producto</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                            <SelectPrimitive.Item
                              value="SERVICIO"
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>Servicio</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  {/* Descripcion: col-span-2 al crear (bajo codigo+tipo), col-span-1 al editar (junto a tipo) */}
                  <div className={editing ? "" : "sm:col-span-2"}>
                    <Field label="Descripción" htmlFor="descripcion">
                      <Input
                        id="descripcion"
                        value={form.descripcion}
                        onChange={(event) => updateField("descripcion", event.target.value)}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Nombre o descripción del producto/servicio"
                        required
                      />
                  </Field>
                </div>
              </div>
            </div>

            {/* SECCIÓN: Clasificación */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Clasificación</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Grupo" htmlFor="id_grupo">
                    <SelectPrimitive.Root
                      value={form.id_grupo === 0 ? undefined : form.id_grupo.toString()}
                      onValueChange={(val) => updateField("id_grupo", Number(val))}
                      onOpenChange={(open) => {
                        if (!open) setGrupoSearch("");
                      }}
                      disabled={loadingGrupos}
                    >
                      <SelectPrimitive.Trigger
                        id="id_grupo"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingGrupos ? "Cargando..." : "Selecciona un grupo..."} />
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
                          <div className="p-2">
                            <input
                              type="search"
                              value={grupoSearch}
                              onChange={(event) => setGrupoSearch(event.target.value)}
                              placeholder="Buscar grupo..."
                              className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                              disabled={loadingGrupos}
                            />
                          </div>
                          <SelectPrimitive.Viewport className="max-h-56 overflow-y-auto p-1">
                            {gruposFiltrados.map((grupo) => (
                              <SelectPrimitive.Item
                                key={grupo.id}
                                value={grupo.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{grupo.nombre}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                            {gruposFiltrados.length === 0 && !loadingGrupos && (
                              <div className="px-3 py-2 text-xs text-slate-400">
                                Sin resultados.
                              </div>
                            )}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="IVA" htmlFor="id_iva">
                    <SelectPrimitive.Root
                      value={form.id_iva === 0 ? undefined : form.id_iva.toString()}
                      onValueChange={(val) => updateField("id_iva", Number(val))}
                      disabled={loadingIva}
                    >
                      <SelectPrimitive.Trigger
                        id="id_iva"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingIva ? "Cargando..." : "Selecciona IVA..."} />
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
                            {codigosIva.map((iva) => (
                              <SelectPrimitive.Item
                                key={iva.id}
                                value={iva.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{iva.nombre} ({iva.porcentaje}%)</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Precio y Unidad */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Precio y Unidad</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Unidad de Medida" htmlFor="unidad_medida">
                    <SelectPrimitive.Root
                      value={form.unidad_medida || undefined}
                      onValueChange={(val) => updateField("unidad_medida", val)}
                      onOpenChange={(open) => {
                        if (!open) setUnidadSearch("");
                      }}
                    >
                      <SelectPrimitive.Trigger
                        id="unidad_medida"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value placeholder="Selecciona una unidad..." />
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
                          <div className="p-2">
                            <input
                              type="search"
                              value={unidadSearch}
                              onChange={(event) => setUnidadSearch(event.target.value)}
                              placeholder="Buscar unidad..."
                              className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            />
                          </div>
                          <SelectPrimitive.Viewport className="max-h-56 overflow-y-auto p-1">
                            {unidadesFiltradas.map((unidad) => (
                              <SelectPrimitive.Item
                                key={unidad.value}
                                value={unidad.value}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{unidad.label}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                            {unidadesFiltradas.length === 0 && (
                              <div className="px-3 py-2 text-xs text-slate-400">
                                Sin resultados.
                              </div>
                            )}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <Field label="Precio" htmlFor="precio">
                    <Input
                      id="precio"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.precio}
                      onChange={(event) => updateField("precio", Number(event.target.value))}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="0.00"
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Configuración ICE */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-700">¿Aplica ICE?</span>
                    <span className="text-xs text-slate-500">Impuesto a los Consumos Especiales</span>
                  </div>
                  <Switch
                    checked={form.tiene_ice}
                    onCheckedChange={(checked) => updateField("tiene_ice", checked)}
                  />
                </div>

                {form.tiene_ice && (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Porcentaje ICE" htmlFor="porcentaje_ice">
                        <Input
                          id="porcentaje_ice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.porcentaje_ice ?? ""}
                          onChange={(event) => updateField("porcentaje_ice", Number(event.target.value))}
                          className="bg-white shadow-none placeholder:text-slate-300"
                          placeholder="Ej: 5, 10, 15"
                        />
                      </Field>
                      <Field label="Código SRI ICE" htmlFor="codigo_ice">
                        <SelectPrimitive.Root
                          value={form.codigo_ice || undefined}
                          onValueChange={(val) => {
                            updateField("codigo_ice", val);
                            updateField("porcentaje_ice", iceSRIMap[val] ?? 0);
                          }}
                        >
                          <SelectPrimitive.Trigger
                            id="codigo_ice"
                            className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                          >
                            <SelectPrimitive.Value placeholder="Selecciona un código SRI..." />
                            <SelectPrimitive.Icon>
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            </SelectPrimitive.Icon>
                          </SelectPrimitive.Trigger>
                          <SelectPrimitive.Portal>
                            <SelectPrimitive.Content
                              className="z-50 min-w-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                              position="popper"
                              sideOffset={4}
                            >
                              <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                                {[
                                  { value: "3021", label: "3021 - Vehículos Motorizados" },
                                  { value: "3031", label: "3031 - Videojuegos" },
                                  { value: "3041", label: "3041 - Servicios Telefonía Móvil" },
                                  { value: "3072", label: "3072 - Bebidas Energizantes" },
                                  { value: "3073", label: "3073 - Bebidas Gaseosas" },
                                  { value: "3081", label: "3081 - Perfumes" },
                                  { value: "3091", label: "3091 - Productos Plásticos" },
                                ].map((option) => (
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
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN: Configuración IRBPNR */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-slate-700">¿Aplica IRBPNR?</span>
                    <span className="text-xs text-slate-500">Impuesto Redimible a las Botellas Plásticas No Retornables</span>
                  </div>
                  <Switch
                    checked={form.tiene_irbpnr}
                    onCheckedChange={(checked) => updateField("tiene_irbpnr", checked)}
                  />
                </div>

                {form.tiene_irbpnr && (
                  <Field label="Valor Unitario IRBPNR" htmlFor="valor_unitario_irbpnr">
                    <Input
                      id="valor_unitario_irbpnr"
                      type="number"
                      step="0.0001"
                      min="0"
                      value={form.valor_unitario_irbpnr ?? ""}
                      onChange={(event) => updateField("valor_unitario_irbpnr", Number(event.target.value))}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ej: 0.02"
                    />
                  </Field>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-4"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-4"
                >
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
                </Button>
              </div>
            </form>
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
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Package className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Detalle del producto
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información registrada del producto.
                  </Dialog.Description>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                      <dt className="text-xs font-semibold text-slate-500">Descripción</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detailData?.descripcion || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Código</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detailData?.codigo || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Tipo</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detailData?.tipo || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Unidad medida</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detailData?.unidad_medida || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Estado</dt>
                      <dd className="mt-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          detailData?.estado === "INACTIVO"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {detailData?.estado || "ACTIVO"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Precios</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Precio</dt>
                      <dd className="mt-2 text-lg font-bold text-slate-800">
                        ${detailData?.precio.toFixed(2) ?? "0.00"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Precio + IVA</dt>
                      <dd className="mt-2 text-lg font-bold text-sky-700">
                        ${(() => {
                          const p = detailData?.precio ?? 0;
                          const iva = detailData?.porcentaje_iva ?? 0;
                          return (p * (1 + iva / 100)).toFixed(2);
                        })()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Clasificación</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Grupo</dt>
                      <dd className="mt-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getGrupoColor(detailData?.id_grupo ?? 0)}`}>
                          {getGrupoNombre(detailData?.id_grupo ?? 0)}
                        </span>
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Código IVA</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detailData?.iva_nombre || getIvaNombre(detailData?.id_iva ?? 0)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {detailData?.created_at ? (
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Auditoría</h3>
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Creado</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {new Date(detailData.created_at).toLocaleDateString("es-EC", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </dd>
                      </div>
                      {detailData.updated_at ? (
                        <div className="rounded-lg bg-white/80 px-3 py-2">
                          <dt className="text-xs font-semibold text-slate-500">Actualizado</dt>
                          <dd className="mt-2 text-sm font-semibold text-slate-800">
                            {new Date(detailData.updated_at).toLocaleDateString("es-EC", {
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
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
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
