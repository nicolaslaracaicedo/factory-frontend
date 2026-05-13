"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { sriLogsService } from "@/src/modules/sri-logs/services/sri-logs.service";
import type {
  SriLogItem,
  SriLogDetalle,
  SriLogFilters,
  TipoDocumentoSRI,
  AccionSRI,
} from "@/src/modules/sri-logs/types/sri-logs.types";
import { tipoDocumentoLabels, accionesSRI } from "@/src/modules/sri-logs/types/sri-logs.types";
import { Loader } from "@/src/components/ui/loader";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Field } from "@/src/components/ui/field";
import { Card } from "@/src/components/ui/card";
import * as Dialog from "@radix-ui/react-dialog";
import { Eye, RefreshCw, Search, X, FileText, Calendar, ListFilter, ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, ChevronDown, Copy, Download, AlertCircle } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import * as SelectPrimitive from "@radix-ui/react-select";

const PAGE_SIZE = 20;

interface SriLogsPanelProps {
  showPanel: boolean;
}

export function SriLogsPanel({ showPanel }: SriLogsPanelProps) {
  const [logs, setLogs] = useState<SriLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<SriLogFilters>({
    limit: 20,
    offset: 0,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const [detailLog, setDetailLog] = useState<SriLogDetalle | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await sriLogsService.listLogs({
        ...filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setLogs(response.data);
      setTotal(response.total || response.data.length);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showPanel) {
      loadLogs();
    }
  }, [showPanel, page, filters.tipo_documento, filters.accion, filters.fecha_desde, filters.fecha_hasta]);

  const handleFilterChange = (key: keyof SriLogFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ limit: pageSize, offset: 0 });
    setPage(1);
    setSorting([]);
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const log = await sriLogsService.getLog(id);
      setDetailLog(log);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar detalle");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("es-EC");
  };

  const formatJson = (jsonStr?: string) => {
    if (!jsonStr) return "-";
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  };

  const formatSecuencial = (clave?: string) => {
    if (!clave || clave.length !== 49) return null;
    const estab = clave.substring(24, 27);
    const ptoEmi = clave.substring(27, 30);
    const sec = clave.substring(30, 39);
    return `${estab}-${ptoEmi}-${sec}`;
  };

  const handleDownloadXml = (xml: string, type: 'request' | 'response', id: number) => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_${id}_${type}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = (xml: string) => {
    navigator.clipboard.writeText(xml);
    toast.success("XML copiado al portapapeles");
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const columns = useMemo<ColumnDef<SriLogItem>[]>(() => [
    {
      accessorKey: "id",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ID <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.id}</span>,
    },
    {
      accessorKey: "clave_acceso",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Comprobante <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const clave = row.original.clave_acceso;
        const secuencial = formatSecuencial(clave);
        return (
          <div className="flex flex-col">
            {secuencial ? (
              <>
                <span className="font-semibold text-slate-900">{secuencial}</span>
                <span className="text-[10px] text-slate-500 break-all">{clave}</span>
              </>
            ) : (
              <span className="font-medium text-slate-800 break-all text-[10px] sm:text-xs">
                {clave || `#${row.original.id_documento}`}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "tipo_documento",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Tipo <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800">
          {tipoDocumentoLabels[row.original.tipo_documento] || row.original.tipo_documento}
        </span>
      ),
    },
    {
      accessorKey: "accion",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Acción <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const log = row.original;
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              log.accion === "AUTORIZACION"
                ? "bg-emerald-100 text-emerald-800"
                : log.accion === "RECHAZO"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            {log.accion}
          </span>
        );
      },
    },
    {
      accessorKey: "estado",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Estado SRI <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const log = row.original;
        if (!log.estado) return <span className="text-slate-400">-</span>;
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              log.estado === "AUTORIZADO"
                ? "bg-emerald-100 text-emerald-800"
                : log.estado === "RECHAZADO" || log.estado === "NO AUTORIZADO" || log.estado === "DEVUELTA"
                  ? "bg-rose-100 text-rose-800"
                  : "bg-slate-100 text-slate-800"
            }`}
          >
            {log.estado}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Fecha Evento <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{formatDate(row.original.created_at || "")}</span>,
    },
    {
      id: "acciones",
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button variant="secondary" className="h-8 px-2.5 shadow-none" onClick={() => openDetail(row.original.id)}>
            <Eye size={16} className="mr-1.5 text-slate-500" />
            <span className="hidden sm:inline">Ver</span>
          </Button>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: logs,
    columns,
    pageCount: totalPages,
    state: { pagination: { pageIndex: page - 1, pageSize }, sorting },
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const [showFilters, setShowFilters] = useState(false);

  if (!showPanel) return null;

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" onClick={loadLogs} disabled={loading} className="h-9 shadow-none">
            <RefreshCw size={15} className="mr-1.5" />
            Actualizar
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg">
          <div className="text-xs font-medium text-slate-500">Filtrar por:</div>
          
          <SelectPrimitive.Root value={filters.tipo_documento || "TODOS"} onValueChange={(val) => handleFilterChange("tipo_documento", val === "TODOS" ? undefined : val)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value placeholder="Tipo de Documento" />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="TODOS" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Todos los documentos</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  {Object.entries(tipoDocumentoLabels).map(([key, label]) => (
                    <SelectPrimitive.Item key={key} value={key} className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                      <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>

          <SelectPrimitive.Root value={filters.accion || "TODAS"} onValueChange={(val) => handleFilterChange("accion", val === "TODAS" ? undefined : val)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value placeholder="Acción" />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="TODAS" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Todas las acciones</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  {accionesSRI.map((accion) => (
                    <SelectPrimitive.Item key={accion} value={accion} className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                      <SelectPrimitive.ItemText>{accion}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  ))}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>

          <div className="flex items-center gap-2">
            <input type="date" value={filters.fecha_desde || ""} onChange={(e) => handleFilterChange("fecha_desde", e.target.value || undefined)} className="h-8 rounded-md border border-slate-200 px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200" title="Fecha Desde" />
            <span className="text-slate-300">-</span>
            <input type="date" value={filters.fecha_hasta || ""} onChange={(e) => handleFilterChange("fecha_hasta", e.target.value || undefined)} className="h-8 rounded-md border border-slate-200 px-3 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200" title="Fecha Hasta" />
          </div>

          <SelectPrimitive.Root value={sorting.length ? `${sorting[0].id}|${sorting[0].desc ? 'desc' : 'asc'}` : "created_at|desc"} onValueChange={(val) => {
            const [id, dir] = val.split("|");
            setSorting([{ id, desc: dir === "desc" }]);
          }}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value placeholder="Ordenar por" />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[140px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  <SelectPrimitive.Item value="created_at|desc" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Más recientes</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                  <SelectPrimitive.Item value="created_at|asc" className="flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-2 text-xs font-medium text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white">
                    <SelectPrimitive.ItemText>Más antiguos</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>

          {(filters.tipo_documento || filters.accion || filters.fecha_desde || filters.fecha_hasta) && (
            <Button variant="ghost" onClick={clearFilters} className="h-8 px-2 text-xs text-slate-500 hover:text-slate-800">
              <X size={14} className="mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="py-12"><Loader label="Cargando logs..." /></div>
      ) : table.getRowModel().rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay logs para este filtro.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                    {row.getVisibleCells().map((cell) => <td key={cell.id} className="px-4 py-3 align-middle">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Filas:</span>
              <SelectPrimitive.Root value={pageSize.toString()} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
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
              <span className="font-medium text-slate-600">Total: {total} registros</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
              <span className="px-2 text-xs text-slate-500 font-medium">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,900px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Detalle del Log #{detailLog?.id}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" className="px-2 py-1">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>

            {detailLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader />
              </div>
            ) : detailLog ? (
              <div className="space-y-4">
                {/* Error/Mensaje Prioritario */}
                {detailLog.mensaje && (
                  <div className={`flex items-start gap-3 rounded-lg p-3 ${
                    detailLog.estado === 'RECHAZADO' || detailLog.estado === 'NO AUTORIZADO' || detailLog.estado === 'DEVUELTA'
                      ? 'bg-rose-50 border border-rose-200 text-rose-800'
                      : 'bg-amber-50 border border-amber-200 text-amber-800'
                  }`}>
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <h4 className="text-sm font-semibold">Mensaje del SRI</h4>
                      <p className="mt-1 text-xs">{detailLog.mensaje}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <Card className="p-3">
                    <div className="text-xs text-slate-500">Tipo Documento</div>
                    <div className="font-medium">
                      {tipoDocumentoLabels[detailLog.tipo_documento] || detailLog.tipo_documento}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-slate-500">Documento / Clave</div>
                    <div className="font-medium break-all text-[11px] sm:text-sm">
                      {formatSecuencial(detailLog.clave_acceso) ? (
                        <>
                          <div className="font-semibold text-slate-900 text-sm">{formatSecuencial(detailLog.clave_acceso)}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{detailLog.clave_acceso}</div>
                        </>
                      ) : (
                        detailLog.clave_acceso || `#${detailLog.id_documento}`
                      )}
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-slate-500">Acción</div>
                    <div className="font-medium">{detailLog.accion}</div>
                  </Card>
                  <Card className="p-3">
                    <div className="text-xs text-slate-500">Estado SRI</div>
                    <div className="font-medium">{detailLog.estado || "-"}</div>
                  </Card>
                </div>

                {/* XML Accordions */}
                <div className="space-y-3 pt-2">
                  {detailLog.request_xml && (
                    <details className="group rounded-lg border border-slate-200 bg-white [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer items-center justify-between p-3 font-medium text-slate-700 hover:bg-slate-50">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-slate-400" />
                          Estructura técnica: Request XML (Envío)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" className="h-7 px-2 text-xs shadow-none" onClick={(e) => { e.preventDefault(); handleCopyXml(detailLog.request_xml!); }}>
                            <Copy className="mr-1.5 h-3 w-3" /> Copiar
                          </Button>
                          <Button variant="secondary" className="h-7 px-2 text-xs shadow-none" onClick={(e) => { e.preventDefault(); handleDownloadXml(detailLog.request_xml!, 'request', detailLog.id); }}>
                            <Download className="mr-1.5 h-3 w-3" /> Descargar
                          </Button>
                          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 ml-2" />
                        </div>
                      </summary>
                      <div className="border-t border-slate-100 p-3 bg-slate-900 rounded-b-lg">
                        <pre className="max-h-64 overflow-auto text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                          {detailLog.request_xml}
                        </pre>
                      </div>
                    </details>
                  )}

                  {detailLog.response_xml && (
                    <details className="group rounded-lg border border-slate-200 bg-white [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex cursor-pointer items-center justify-between p-3 font-medium text-slate-700 hover:bg-slate-50">
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-slate-400" />
                          Estructura técnica: Response XML (Respuesta)
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" className="h-7 px-2 text-xs shadow-none" onClick={(e) => { e.preventDefault(); handleCopyXml(detailLog.response_xml!); }}>
                            <Copy className="mr-1.5 h-3 w-3" /> Copiar
                          </Button>
                          <Button variant="secondary" className="h-7 px-2 text-xs shadow-none" onClick={(e) => { e.preventDefault(); handleDownloadXml(detailLog.response_xml!, 'response', detailLog.id); }}>
                            <Download className="mr-1.5 h-3 w-3" /> Descargar
                          </Button>
                          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180 ml-2" />
                        </div>
                      </summary>
                      <div className="border-t border-slate-100 p-3 bg-slate-900 rounded-b-lg">
                        <pre className="max-h-64 overflow-auto text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                          {detailLog.response_xml}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-4 w-4" />
                  Fecha del evento: {formatDate(detailLog.created_at || "")}
                </div>
              </div>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
