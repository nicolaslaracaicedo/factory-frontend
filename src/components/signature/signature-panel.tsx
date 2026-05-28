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
import { CheckCircle2, Eye, PlusCircle, RefreshCw, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ChevronsUpDown, ChevronDown, ListFilter, MoreVertical, FileText, Plus, X, Signature, Lock, Upload, File, Building2 } from "lucide-react";
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
  FirmaElectronica,
  FirmaUploadInput,
} from "@/src/modules/signature/types/signature.types";
import { signatureService } from "@/src/modules/signature/services/signature.service";
import { Loader } from "@/src/components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";

interface SignaturePanelProps {
  showPanel?: boolean;
  readOnly?: boolean;
}

const emptyForm: FirmaUploadInput = {
  firma: undefined as unknown as File,
  password: "",
  nombre: "",
};

export function SignaturePanel({ showPanel = true, readOnly = false }: SignaturePanelProps) {
  const [firmas, setFirmas] = useState<FirmaElectronica[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<FirmaElectronica | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<FirmaElectronica | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FirmaUploadInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const formatDate = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" }).format(parsed);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsed);
  };

  function SortIcon({ column }: { column: any }) {
    const sorted = column.getIsSorted();
    if (sorted === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (sorted === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  const columns = useMemo<ColumnDef<FirmaElectronica>[]>(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Firma
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.nombre}</div>
          {row.original.archivo ? (
            <div className="text-slate-500 text-xs">{row.original.archivo}</div>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "fecha_registro",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Registrado
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.original.fecha_registro;
        if (!value) return <span className="text-slate-400">-</span>;
        return <span className="text-slate-700">{new Date(value).toLocaleDateString("es-EC")}</span>;
      },
    },
    {
      accessorKey: "fecha_expiracion",
      header: ({ column }) => (
        <button
          className="group inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expiración
          <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => {
        const value = row.original.fecha_expiracion;
        if (!value) return <span className="text-slate-400">-</span>;
        return <span className="text-slate-700">{new Date(value).toLocaleDateString("es-EC")}</span>;
      },
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
        <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${row.original.activo === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
          {row.original.activo === false ? "INACTIVA" : "ACTIVA"}
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
                  <DropdownMenuItem onClick={() => openReplace(row.original)}>
                    <RefreshCw size={14} className="mr-2" />
                    Reemplazar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => activateFirma(row.original)} className="text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                    <CheckCircle2 size={14} className="mr-2" />
                    Activar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: firmas,
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
    const loadFirmas = async () => {
      setLoading(true);
      try {
        const data = await signatureService.listFirmas();
        setFirmas(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar las firmas.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadFirmas();
  }, []);

  const refresh = async () => {
    try {
      const data = await signatureService.listFirmas();
      setFirmas(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las firmas.";
      toast.error(message);
    }
  };

  const openCreate = () => {
    setReplaceTarget(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openReplace = (firma: FirmaElectronica) => {
    setReplaceTarget(firma);
    setForm({
      firma: undefined as unknown as File,
      password: "",
      nombre: firma.nombre || "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDetail = async (firma: FirmaElectronica) => {
    try {
      const detailData = await signatureService.getFirma(firma.id);
      setDetail(detailData);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof FirmaUploadInput, value: string | File | null) => {
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setForm((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const validateForm = (): boolean => {
    const next: Record<string, string> = {};
    const nombre = form.nombre.trim();

    if (!form.firma) next.firma = "Selecciona un archivo de firma.";
    if (!nombre) next.nombre = "El nombre identificativo es obligatorio.";
    else if (nombre.length > 100) next.nombre = "No debe exceder 100 caracteres.";
    else if (/^\d+$/.test(nombre)) next.nombre = "Debe contener al menos una letra.";

    if (!form.password) next.password = "La contraseña del certificado es obligatoria.";

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
      if (replaceTarget) {
        await signatureService.replaceFirma(replaceTarget.id, form);
        toast.success("Firma reemplazada.");
      } else {
        await signatureService.uploadFirma(form);
        toast.success("Firma subida.");
      }
      await refresh();
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la firma.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const activateFirma = async (firma: FirmaElectronica) => {
    try {
      await signatureService.activateFirma(firma.id);
      await refresh();
      toast.success("Firma activada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo activar la firma.";
      toast.error(message);
    }
  };

  if (!showPanel) return null;

  const certificado = detail?.certificado;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
    <div className="space-y-4">
      {/* Toolbar Principal */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda global */}
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Buscar firma..."
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
        </div>

        {!readOnly && (
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
              <Plus size={15} className="mr-1.5" />
              Subir firma
            </Button>
          </div>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <Loader label="Cargando firmas" className="mt-8" />
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
          <p className="text-sm text-slate-600">No hay firmas registradas.</p>
          {!readOnly && (
            <Button onClick={openCreate} className="mt-3 h-9 shadow-none">
              <Plus size={15} className="mr-1.5" /> Subir firma
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
                  <Signature className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {replaceTarget ? "Reemplazar firma" : "Subir nueva firma"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {replaceTarget
                      ? "Selecciona el nuevo archivo .p12 y la contraseña del certificado digital."
                      : "Carga tu certificado digital .p12 o .pfx junto con la contraseña para firmar documentos electrónicamente."}
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
              {/* SECCIÓN: Certificado */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <File className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Certificado digital</h3>
                </div>
                <div className="space-y-3">
                  <Field label="Archivo (.p12)" htmlFor="firma" error={errors.firma}>
                    <div className="relative">
                      <Input
                        id="firma"
                        type="file"
                        accept=".p12"
                        onChange={(event) =>
                          updateField("firma", event.target.files?.[0] ?? null)
                        }
                        className={`bg-white shadow-none file:hidden h-28 py-0 px-0 border-dashed border-2 ${errors.firma ? "border-rose-300" : "border-slate-300"} hover:border-app-primary/50 transition-colors cursor-pointer rounded-lg`}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 pointer-events-none px-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-primary/10">
                          <Upload className="h-4 w-4 text-app-primary" />
                        </div>
                        <div className="text-center">
                          {form.firma?.name ? (
                            <>
                              <p className="text-xs font-medium text-slate-700 truncate max-w-[240px]">
                                {form.firma.name}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Archivo listo
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-medium text-slate-600">
                                Arrastra o haz clic para seleccionar
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Solo archivos .p12
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </Field>

                  <Field label="Nombre identificativo" htmlFor="nombre" error={errors.nombre}>
                    <div className="relative">
                      <Input
                        id="nombre"
                        value={form.nombre}
                        onChange={(event) => updateField("nombre", event.target.value)}
                        maxLength={100}
                        className="bg-white shadow-none placeholder:text-slate-300 pr-10"
                        placeholder="Ej: Firma Principal 2025"
                      />
                      <span className="absolute right-2 bottom-1/2 translate-y-1/2 text-[10px] text-slate-400 pointer-events-none select-none">
                        {form.nombre.length}/100
                      </span>
                    </div>
                  </Field>
                </div>
              </div>

              {/* SECCIÓN: Credenciales */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Credenciales</h3>
                </div>
                <div className="space-y-3">
                  <Field label="Contraseña del certificado" htmlFor="password" error={errors.password}>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ingresa la contraseña del archivo .p12"
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
                  {saving ? "Guardando..." : replaceTarget ? "Reemplazar firma" : "Subir firma"}
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
                  <Signature className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Detalle de firma
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Información del certificado y estado.
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
                    <Signature className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Datos de la firma</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Nombre</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {detail?.nombre || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Estado</dt>
                      <dd className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                            detail?.activo === false
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {detail?.activo === false ? "INACTIVA" : "ACTIVA"}
                        </span>
                      </dd>
                    </div>
                    {detail?.archivo ? (
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Archivo</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.archivo}
                        </dd>
                      </div>
                    ) : null}
                    {detail?.estado_certificado ? (
                      <div className="rounded-lg bg-white/80 px-3 py-2">
                        <dt className="text-xs font-semibold text-slate-500">Estado certificado</dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-800">
                          {detail.estado_certificado}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Vigencia</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Vencimiento</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {formatDate(detail?.fecha_expiracion)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Registrado en</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {formatDateTime(detail?.fecha_registro)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Válido desde</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {formatDate(certificado?.valido_desde)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Válido hasta</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {formatDate(certificado?.valido_hasta)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Titular y entidad</h3>
                  </div>
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-lg bg-white/80 px-3 py-2 sm:col-span-2">
                      <dt className="text-xs font-semibold text-slate-500">Titular</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {certificado?.titular || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Organización</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {certificado?.organizacion || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Unidad</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {certificado?.unidad || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">País</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800">
                        {certificado?.pais || "-"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-700">Detalles del certificado</h3>
                  </div>
                  <dl className="grid gap-4 text-sm">
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Emisor</dt>
                      <dd className="mt-2 text-sm font-semibold text-slate-800 break-words">
                        {certificado?.emisor || "-"}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-white/80 px-3 py-2">
                      <dt className="text-xs font-semibold text-slate-500">Serial</dt>
                      <dd className="mt-2 font-mono text-xs text-slate-700 break-words">
                        {certificado?.serial || "-"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                  Cancelar
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
