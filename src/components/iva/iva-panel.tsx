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
import { Edit, PlusCircle, Power, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, Percent, Hash, Tag, Receipt } from "lucide-react";
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
import { confirmAction } from "@/src/lib/confirm";
import type {
  CodigoIva,
  CodigoIvaFormInput,
  CodigoIvaUpdateInput,
} from "@/src/modules/iva/types/iva.types";
import { toCodigoIvaFormInput } from "@/src/modules/iva/utils/iva-payload.utils";
import { ivaService } from "@/src/modules/iva/services/iva.service";

const initialForm: CodigoIvaFormInput = {
  codigo: "",
  nombre: "",
  porcentaje: 0,
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface IvaPanelProps {
  showPanel?: boolean;
}

export function IvaPanel({ showPanel = true }: IvaPanelProps) {
  const [codigos, setCodigos] = useState<CodigoIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CodigoIva | null>(null);
  const [form, setForm] = useState<CodigoIvaFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadCodigos = async () => {
      setLoading(true);
      try {
        const activo = filter === "TODOS" ? undefined : filter === "ACTIVO";
        const data = await ivaService.listCodigos(activo);
        setCodigos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los codigos IVA.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadCodigos();
  }, [filter]);

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

  const columns = useMemo<ColumnDef<CodigoIva>[]>(() => [
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
        <span className="font-semibold text-slate-800">{row.original.codigo}</span>
      ),
    },
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-slate-700">{row.original.nombre}</span>
      ),
    },
    {
      accessorKey: "porcentaje",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Porcentaje
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-slate-700">{row.original.porcentaje.toFixed(2)}%</span>
      ),
    },
    {
      accessorKey: "activo",
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
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.original.activo === false
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {row.original.activo === false ? "INACTIVO" : "ACTIVO"}
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
              <DropdownMenuItem onClick={() => openEdit(row.original)}>
                <Edit size={14} className="mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleActivo(row.original)}>
                <Power size={14} className="mr-2" />
                {row.original.activo === false ? "Activar" : "Desactivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: codigos,
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
    setModalOpen(true);
  };

  const openEdit = (codigo: CodigoIva) => {
    setEditing(codigo);
    setForm(toCodigoIvaFormInput(codigo));
    setModalOpen(true);
  };

  const updateField = (name: keyof CodigoIvaFormInput, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        const payload: CodigoIvaUpdateInput = {
          codigo: form.codigo,
          nombre: form.nombre,
          porcentaje: form.porcentaje,
        };
        await ivaService.updateCodigo(editing.id, payload);
        toast.success("Codigo IVA actualizado.");
      } else {
        await ivaService.createCodigo(form);
        toast.success("Codigo IVA creado.");
      }

      const activo = filter === "TODOS" ? undefined : filter === "ACTIVO";
      const data = await ivaService.listCodigos(activo);
      setCodigos(data);
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el codigo IVA.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (codigo: CodigoIva) => {
    if (!await confirmAction("¿Estás seguro de que deseas cambiar el estado de este código de IVA?")) return;
    try {
      await ivaService.toggleActivo(codigo.id);
      const activo = filter === "TODOS" ? undefined : filter === "ACTIVO";
      const data = await ivaService.listCodigos(activo);
      setCodigos(data);
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
              placeholder="Buscar código IVA..."
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
            Nuevo código
          </Button>
        </div>
      </div>

      {/* Panel de Filtros Expandible */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg animate-in slide-in-from-top-2 fade-in duration-200">
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
        <p className="mt-4 text-sm text-slate-500">Cargando códigos...</p>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No hay códigos para este filtro.</p>
          <Button onClick={openCreate} className="mt-3 h-9 shadow-none">
            <Plus size={15} className="mr-1.5" /> Crear código
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-none overflow-hidden">
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
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
          <Dialog.Content 
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Receipt className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar código IVA" : "Crear nuevo código IVA"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Actualiza los datos del código de IVA existente."
                      : "Registra un nuevo código de IVA con su porcentaje correspondiente para aplicar en facturas."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
              {/* SECCIÓN: Información del código IVA */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información del código IVA</h3>
                </div>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Código" htmlFor="codigo">
                      <Input
                        id="codigo"
                        value={form.codigo}
                        onChange={(event) => updateField("codigo", event.target.value)}
                        disabled={Boolean(editing)}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: 2, 3, 4"
                      />
                    </Field>

                    <Field label="Porcentaje" htmlFor="porcentaje">
                      <Input
                        id="porcentaje"
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.porcentaje}
                        onChange={(event) => updateField("porcentaje", Number(event.target.value))}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: 12, 0, 15"
                      />
                    </Field>
                  </div>

                  <Field label="Nombre" htmlFor="nombre">
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(event) => updateField("nombre", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ej: IVA 12%, No objeto de IVA, IVA 0%"
                    />
                  </Field>
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
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear código IVA"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
