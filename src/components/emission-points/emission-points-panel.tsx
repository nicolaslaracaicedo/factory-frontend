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
import { Edit, PlusCircle, Power, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, MapPinHouse, Building2, Tag, Hash, Eye } from "lucide-react";
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
  PuntoEmision,
  PuntoEmisionFormInput,
  PuntoEmisionUpdateInput,
} from "@/src/modules/emission-points/types/emission-point.types";
import { toPuntoFormInput } from "@/src/modules/emission-points/utils/emission-point-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import { establishmentService } from "@/src/modules/establishments/services/establishment.service";
import type { Establecimiento } from "@/src/modules/establishments/types/establishment.types";
import { Loader } from "@/src/components/ui/loader";
import { confirmAction } from "@/src/lib/confirm";
import { motion, AnimatePresence } from "framer-motion";

const initialForm: PuntoEmisionFormInput = {
  id_establecimiento: 0,
  codigo: "",
  descripcion: "",
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface EmissionPointsPanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

export function EmissionPointsPanel({ showPanel = true, readOnly = false }: EmissionPointsPanelProps) {
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEst, setLoadingEst] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<PuntoEmision | null>(null);
  const [editing, setEditing] = useState<PuntoEmision | null>(null);
  const [form, setForm] = useState<PuntoEmisionFormInput>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estFilter, setEstFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadEstablecimientos = async () => {
      setLoadingEst(true);
      try {
        const data = await establishmentService.listEstablecimientos("ACTIVO");
        setEstablecimientos(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los establecimientos.";
        toast.error(message);
      } finally {
        setLoadingEst(false);
      }
    };

    void loadEstablecimientos();
  }, []);

  useEffect(() => {
    const loadPuntos = async () => {
      setLoading(true);
      try {
        let data: PuntoEmision[] = [];
        if (estFilter > 0) {
          data = await emissionPointService.listByEstablecimiento(estFilter);
        } else {
          const estado = filter === "TODOS" ? undefined : filter;
          data = await emissionPointService.listPuntos(estado);
        }
        setPuntos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los puntos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadPuntos();
  }, [filter, estFilter]);

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showFilters, setShowFilters] = useState(false);

  const getEstNombre = (id: number) => {
    return establecimientos.find((item) => item.id === id)?.nombre ?? "-";
  };

  function SortIcon({ column }: { column: any }) {
    const sorted = column.getIsSorted();
    if (sorted === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (sorted === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const columns = useMemo<ColumnDef<PuntoEmision>[]>(() => [
    {
      accessorKey: "descripcion",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Punto
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-slate-800">{row.original.descripcion}</span>
      ),
    },
    {
      id: "establecimiento",
      accessorFn: (row) => getEstNombre(row.id_establecimiento),
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Establecimiento
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-slate-700">{getEstNombre(row.original.id_establecimiento)}</span>
      ),
    },
    {
      accessorKey: "codigo",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-slate-700">{row.original.codigo}</span>
      ),
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
        <span
          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
            row.original.estado === "INACTIVO"
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
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
              {!readOnly && (
                <>
                  <DropdownMenuItem onClick={() => openEdit(row.original)}>
                    <Edit size={14} className="mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => toggleEstado(row.original)} className={row.original.estado === "INACTIVO" ? "text-emerald-600 focus:text-emerald-600" : "text-orange-600 focus:text-orange-600"}>
                    <Power size={14} className="mr-2" />
                    {row.original.estado === "INACTIVO" ? "Activar" : "Desactivar"}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], [establecimientos]);

  const table = useReactTable({
    data: puntos,
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

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (punto: PuntoEmision) => {
    setEditing(punto);
    setForm(toPuntoFormInput(punto));
    setErrors({});
    setModalOpen(true);
  };

  const openDetail = async (punto: PuntoEmision) => {
    try {
      const data = await emissionPointService.getPunto(punto.id);
      setDetailData(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo obtener el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof PuntoEmisionFormInput, value: string | number) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};
    const codigo = form.codigo.trim();
    const descripcion = form.descripcion.trim();

    if (form.id_establecimiento === 0) next.id_establecimiento = "Debe seleccionar un establecimiento.";

    if (!codigo) next.codigo = "El código es obligatorio.";
    else if (!/^\d+$/.test(codigo)) next.codigo = "Solo se permiten dígitos.";
    else if (codigo.length !== 3) next.codigo = "Debe tener exactamente 3 dígitos (ej. 001).";

    if (!descripcion) next.descripcion = "La descripción es obligatoria.";
    else if (descripcion.length < 3) next.descripcion = "Debe tener al menos 3 caracteres.";
    else if (descripcion.length > 100) next.descripcion = "No debe exceder 100 caracteres.";

    setErrors(next);
    const firstError = Object.values(next).find(Boolean);
    if (firstError) {
      toast.warning(firstError);
      return false;
    }
    return true;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSaving(true);

    try {
      if (editing) {
        const payload: PuntoEmisionUpdateInput = {
          descripcion: form.descripcion,
        };
        await emissionPointService.updatePunto(editing.id, payload);
        toast.success("Punto actualizado.");
      } else {
        await emissionPointService.createPunto(form);
        toast.success("Punto creado.");
      }

      if (estFilter > 0) {
        const data = await emissionPointService.listByEstablecimiento(estFilter);
        setPuntos(data);
      } else {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await emissionPointService.listPuntos(estado);
        setPuntos(data);
      }
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el punto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (punto: PuntoEmision) => {
    if (!await confirmAction({ message: "¿Estás seguro de que deseas cambiar el estado de este punto de emisión?", variant: "warning" })) return;
    try {
      await emissionPointService.toggleEstado(punto.id);
      if (estFilter > 0) {
        const data = await emissionPointService.listByEstablecimiento(estFilter);
        setPuntos(data);
      } else {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await emissionPointService.listPuntos(estado);
        setPuntos(data);
      }
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };



  if (!showPanel) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
              placeholder="Buscar punto de emisión..."
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
            <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" />
              Nuevo punto
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
          
          {/* Filtro estado (API) */}
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

          {/* Filtro Establecimiento (API) */}
          <SelectPrimitive.Root value={String(estFilter)} onValueChange={(val) => setEstFilter(Number(val))}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[180px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-none transition-all hover:bg-slate-50 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200 data-[state=open]:border-sky-400 data-[state=open]:ring-2 data-[state=open]:ring-sky-200">
              <SelectPrimitive.Value placeholder="Todos los establecimientos" />
              <SelectPrimitive.Icon>
                <ChevronDown size={14} className="text-slate-400" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="relative z-50 min-w-[180px] max-h-60 overflow-y-auto overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="0" className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Todos los establecimientos</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  {establecimientos.map((est) => (
                    <SelectPrimitive.Item key={est.id} value={String(est.id)} className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                      <SelectPrimitive.ItemText>{est.codigo} - {est.nombre}</SelectPrimitive.ItemText>
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
        <Loader label="Cargando puntos de emisión" className="mt-8" />
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay puntos para este filtro.</p>
          {!readOnly && (
            <Button onClick={openCreate} className="mt-3 h-9 shadow-none">
              <Plus size={15} className="mr-1.5" /> Crear punto
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden"
        >
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

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
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
                <MapPinHouse className="h-6 w-6 text-app-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {editing ? "Editar punto de emisión" : "Crear nuevo punto de emisión"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza la información del punto de emisión existente."
                      : "Registra un nuevo punto de emisión vinculado a un establecimiento para emitir documentos electrónicos."}
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

            {/* Formulario */}
            <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
              {/* SECCIÓN: Información del punto */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información del punto</h3>
                </div>
                <div className="space-y-3">
                  <Field label="Establecimiento" htmlFor="id_establecimiento" error={errors.id_establecimiento}>
                    <SelectPrimitive.Root 
                      value={form.id_establecimiento === 0 ? undefined : form.id_establecimiento.toString()} 
                      onValueChange={(val) => updateField("id_establecimiento", Number(val))}
                      disabled={Boolean(editing) || loadingEst}
                    >
                      <SelectPrimitive.Trigger 
                        id="id_establecimiento"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                      >
                        <SelectPrimitive.Value placeholder={loadingEst ? "Cargando..." : "Selecciona un establecimiento..."} />
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
                            {establecimientos.map((est) => (
                              <SelectPrimitive.Item 
                                key={est.id}
                                value={est.id.toString()}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>{est.codigo} - {est.nombre}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Código" htmlFor="codigo" error={errors.codigo}>
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(event) => {
                          const val = event.target.value.replace(/\D/g, "").slice(0, 3);
                          updateField("codigo", val);
                        }}
                        disabled={Boolean(editing)}
                        maxLength={3}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: 001, 002"
                      />
                    </Field>

                    <Field label="Descripción" htmlFor="descripcion" error={errors.descripcion}>
                      <div className="relative">
                        <Input
                          id="descripcion"
                          value={form.descripcion}
                          onChange={(event) => updateField("descripcion", event.target.value)}
                          maxLength={100}
                          className="bg-white shadow-none placeholder:text-slate-300 pr-10"
                          placeholder="Ej: Principal, Bodega"
                        />
                        <span className="absolute right-2 bottom-1/2 translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
                          {form.descripcion.length}/100
                        </span>
                      </div>
                    </Field>
                  </div>
                </div>
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
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear punto"}
                </Button>
              </div>
            </form>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
            onEscapeKeyDown={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                <MapPinHouse className="h-6 w-6 text-app-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  Detalle del punto de emisión
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información registrada del punto de emisión.
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
              <div className="space-y-4">
                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPinHouse className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Información del punto</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
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
                      <dt className="text-xs font-semibold text-slate-500">Establecimiento</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {getEstNombre(detailData?.id_establecimiento ?? 0)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Estado</dt>
                      <dd className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                            detailData?.estado === "INACTIVO"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {detailData?.estado || "ACTIVO"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>

                {detailData?.created_at && (
                  <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <h3 className="text-sm font-semibold text-slate-700">Auditoría</h3>
                    </div>
                    <dl className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Creado</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detailData.created_at
                            ? new Date(detailData.created_at).toLocaleDateString("es-EC", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </dd>
                      </div>
                      {detailData.updated_at && (
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
                      )}
                    </dl>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
    </motion.div>
  );
}
