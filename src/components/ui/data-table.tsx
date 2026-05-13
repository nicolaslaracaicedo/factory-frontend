"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Search, ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { Button } from "./button";
import { Select } from "./select";
import { Loader } from "./loader";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  onCreate?: () => void;
  createLabel?: string;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  filterComponent?: React.ReactNode;
  initialPageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  loading = false,
  onCreate,
  createLabel = "Nuevo",
  searchPlaceholder = "Buscar...",
  emptyTitle = "Sin registros",
  emptyDescription = "No hay registros para mostrar.",
  emptyIcon,
  filterComponent,
  initialPageSize = 10,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
  });

  if (loading) {
    return <Loader label="Cargando..." className="mt-8" />;
  }

  const filteredRows = table.getFilteredRowModel().rows;

  if (filteredRows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
        {emptyIcon || (
          <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Search size={24} className="text-slate-400" />
          </div>
        )}
        <p className="text-sm font-medium text-slate-900">{emptyTitle}</p>
        <p className="text-sm text-slate-500 mt-1">{emptyDescription}</p>
        {onCreate && (
          <Button className="mt-4" onClick={onCreate}>
            <Plus size={18} className="mr-1.5" />
            {createLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Búsqueda y filtros */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {filterComponent}
          {onCreate && (
            <Button onClick={onCreate} className="whitespace-nowrap">
              <Plus size={18} className="mr-1.5" />
              {createLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 font-semibold whitespace-nowrap"
                  >
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
                  <td key={cell.id} className="px-4 py-3.5 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span>Mostrar:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition cursor-pointer"
          >
            {[10, 20, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span className="hidden sm:inline">
            {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} páginas
          </span>
          <span className="text-slate-400">|</span>
          <span className="font-medium text-slate-800">
            Total: {filteredRows.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-3"
          >
            <ChevronLeft size={18} className="mr-1" />
            Anterior
          </Button>
          <span className="px-2 text-sm text-slate-600 sm:hidden">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="secondary"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3"
          >
            Siguiente
            <ChevronRight size={18} className="ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
