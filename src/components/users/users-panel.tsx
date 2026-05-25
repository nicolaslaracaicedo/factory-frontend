"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  type SortingState,
} from "@tanstack/react-table";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  Users,
  UserCog,
  Edit3,
  Edit,
  Plus,
  PlusCircle,
  Power,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ListFilter,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  X,
  Shield,
  Lock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";
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
  UsuarioFormInput,
  UsuarioItem,
  UsuarioUpdateInput,
} from "@/src/modules/users/types/user.types";
import { toUsuarioFormInput } from "@/src/modules/users/utils/user-payload.utils";
import { userService } from "@/src/modules/users/services/user.service";
import { roleIdToName } from "@/src/modules/auth/utils/role.utils";
import { Loader } from "@/src/components/ui/loader";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { confirmAction } from "@/src/lib/confirm";

const initialForm: UsuarioFormInput = {
  id_rol: 0,
  tipo_identificacion: "05",
  identificacion: "",
  nombre: "",
  apellido: "",
  email: "",
  password: "",
  telefono: "",
  direccion: "",
  id_punto_emision_default: 0,
};

const tipoIdentificacionOptions = [
  { value: "05", label: "Cedula" },
  { value: "04", label: "RUC" },
  { value: "06", label: "Pasaporte" },
];

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;
type EstadoFiltro = (typeof estadoFilters)[number];

interface UsersPanelProps {
  showPanel?: boolean;
}

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function PasswordField({ id, label, value, onChange, placeholder }: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field label={label} htmlFor={id}>
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="bg-white shadow-none pr-10 placeholder:text-slate-300"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </Field>
  );
}

export function UsersPanel({ showPanel = true }: UsersPanelProps) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioItem | null>(null);
  const [form, setForm] = useState<UsuarioFormInput>(initialForm);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [loadingPuntos, setLoadingPuntos] = useState(true);

  function SortIcon({ column }: { column: any }) {
    const s = column.getIsSorted();
    if (s === "asc") return <ArrowUp size={11} className="ml-1 text-sky-500" />;
    if (s === "desc") return <ArrowDown size={11} className="ml-1 text-sky-500" />;
    return <ChevronsUpDown size={11} className="ml-1 text-slate-300" />;
  }

  // Columnas para react-table
  const columns = useMemo<ColumnDef<UsuarioItem>[]>(() => [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Usuario <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-slate-900">{row.original.nombre} {row.original.apellido}</div>
          <div className="text-slate-500 text-xs">{roleIdToName[row.original.id_rol] ?? `Rol #${row.original.id_rol}`}</div>
        </div>
      ),
    },
    {
      accessorKey: "identificacion",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Identificación <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => <span className="text-slate-700">{row.original.identificacion}</span>,
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <button className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Contacto <SortIcon column={column} />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <div className="text-slate-800">{row.original.email}</div>
          <div className="text-slate-500 text-xs">{row.original.telefono || "-"}</div>
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
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
          row.original.estado?.toLowerCase() === "inactivo"
            ? "bg-rose-100 text-rose-700"
            : "bg-emerald-100 text-emerald-700"
        }`}>
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
              <DropdownMenuItem onClick={() => openEdit(row.original)}><Edit size={14} className="mr-2" /> Editar</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleEstado(row.original)} className={row.original.estado?.toLowerCase() === "inactivo" ? "text-emerald-600 focus:text-emerald-600" : "text-orange-600 focus:text-orange-600"}>
                <Power size={14} className="mr-2" /> {row.original.estado?.toLowerCase() === "inactivo" ? "Activar" : "Desactivar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ], []);

  const table = useReactTable({
    data: usuarios,
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

  // Cargar usuarios
  useEffect(() => {
    const loadUsuarios = async () => {
      setLoading(true);
      try {
        const data = await userService.listUsuarios();
        const filtered = filter === "TODOS"
          ? data
          : data.filter((item) =>
            filter === "ACTIVO"
              ? item.estado?.toLowerCase() !== "inactivo"
              : item.estado?.toLowerCase() === "inactivo"
          );
        setUsuarios(filtered);
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron cargar los usuarios.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    void loadUsuarios();
  }, [filter]);

  useEffect(() => {
    const loadPuntos = async () => {
      setLoadingPuntos(true);
      try {
        const data = await emissionPointService.listPuntos("ACTIVO");
        setPuntos(data);
      } catch { /* ignore */ }
      finally { setLoadingPuntos(false); }
    };
    void loadPuntos();
  }, []);


  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (usuario: UsuarioItem) => {
    setEditing(usuario);
    setForm(toUsuarioFormInput(usuario));
    setModalOpen(true);
  };

  const updateField = (name: keyof UsuarioFormInput, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const refresh = async () => {
    const data = await userService.listUsuarios();
    const filtered =
      filter === "TODOS"
        ? data
        : data.filter((item) =>
          filter === "ACTIVO"
            ? item.estado?.toLowerCase() !== "inactivo"
            : item.estado?.toLowerCase() === "inactivo"
        );
    setUsuarios(filtered);
  };

  const buildUpdatePayload = (): UsuarioUpdateInput => {
    const payload: UsuarioUpdateInput = {
      id_rol: form.id_rol,
      tipo_identificacion: "05",
      identificacion: form.identificacion,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
      id_punto_emision_default: form.id_punto_emision_default > 0 ? form.id_punto_emision_default : undefined,
    };

    if (form.password.trim()) {
      payload.password = form.password;
    }

    return payload;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        await userService.updateUsuario(editing.id, buildUpdatePayload());
        toast.success("Usuario actualizado.");
      } else {
        await userService.createUsuario(form);
        toast.success("Usuario creado.");
      }
      await refresh();
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el usuario.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (usuario: UsuarioItem) => {
    const current = usuario.estado?.toUpperCase() === "INACTIVO" ? "INACTIVO" : "ACTIVO";
    const next = current === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    const action = next === "ACTIVO" ? "activar" : "desactivar";
    if (!await confirmAction({ message: `¿Estás seguro de que deseas ${action} este usuario?`, variant: action === "desactivar" ? "danger" : "success" })) return;
    try {
      await userService.toggleEstado(usuario.id, next);
      await refresh();
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
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 min-w-[280px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar usuario..." className="w-full pl-9 pr-8 py-2 h-9 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-400 transition-all" />
            {globalFilter && <button onClick={() => setGlobalFilter("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
          <Button variant="secondary" className={`h-9 shadow-none text-xs px-3 shrink-0 border-slate-200 ${showFilters ? "bg-slate-100" : "bg-white"}`} onClick={() => setShowFilters(!showFilters)}>
            <ListFilter size={15} className="mr-1.5" />{showFilters ? "Ocultar" : "Filtros"}
          </Button>
        </div>
        <div className="ml-auto">
          <Button onClick={openCreate} className="h-9 shadow-none whitespace-nowrap">
            <Plus size={15} className="mr-1.5" /> Nuevo Usuario
          </Button>
        </div>
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
          <SelectPrimitive.Root value={filter || "TODOS"} onValueChange={(val) => setFilter(val as EstadoFiltro)}>
            <SelectPrimitive.Trigger className="inline-flex h-8 min-w-[160px] items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-200">
              <SelectPrimitive.Value />
              <SelectPrimitive.Icon><ChevronDown size={14} className="text-slate-400" /></SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content className="z-50 min-w-[160px] overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm" position="popper" sideOffset={4}>
                <SelectPrimitive.Viewport className="p-1">
                  {estadoFilters.map((e) => (
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
        <div className="py-12"><Loader label="Cargando usuarios..." /></div>
      ) : table.getFilteredRowModel().rows.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center"
        >
          <Users size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-600">No hay usuarios para este filtro.</p>
          <Button className="mt-3 h-9 shadow-none" onClick={openCreate}><Plus size={15} className="mr-1.5" /> Nuevo Usuario</Button>
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
                  <UserCog className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    {editing ? "Editar usuario" : "Crear nuevo usuario"}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {editing
                      ? "Modifica los datos del usuario. La contraseña solo se actualizará si ingresas una nueva."
                      : "Completa todos los campos para registrar un nuevo usuario en el sistema y asignarle un rol de acceso."}
                  </Dialog.Description>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
              {/* SECCIÓN: Datos personales */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Datos personales</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nombre" htmlFor="nombre">
                    <Input
                      id="nombre"
                      value={form.nombre}
                      onChange={(event) => updateField("nombre", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ingresa el nombre"
                    />
                  </Field>

                  <Field label="Apellido" htmlFor="apellido">
                    <Input
                      id="apellido"
                      value={form.apellido}
                      onChange={(event) => updateField("apellido", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ingresa el apellido"
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Número de identificación" htmlFor="identificacion">
                      <Input
                        id="identificacion"
                        value={form.identificacion}
                        onChange={(event) => updateField("identificacion", event.target.value)}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: 1712345678"
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Credenciales de acceso */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Credenciales de acceso</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Correo electrónico" htmlFor="email">
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="usuario@empresa.com"
                    />
                  </Field>

                  <PasswordField 
                    id="password"
                    label="Contraseña"
                    value={form.password}
                    onChange={(val) => updateField("password", val)}
                    placeholder={editing ? "Dejar en blanco para mantener actual" : "Mínimo 8 caracteres"}
                  />

                  <div className="sm:col-span-2">
                    <Field label="Rol de usuario" htmlFor="id_rol">
                      <SelectPrimitive.Root 
                        value={form.id_rol === 0 ? undefined : form.id_rol.toString()} 
                        onValueChange={(val) => updateField("id_rol", Number(val))}
                      >
                        <SelectPrimitive.Trigger 
                          id="id_rol"
                          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        >
                          <SelectPrimitive.Value placeholder="Selecciona un rol..." />
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
                                value="1" 
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>Administrador - Control total del sistema</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                              <SelectPrimitive.Item 
                                value="2" 
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>Facturador - Emite comprobantes electrónicos</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                              <SelectPrimitive.Item 
                                value="3" 
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText>Contador - Revisa reportes y tributación</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: Punto de emisión por defecto */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Punto de emisión</h3>
                </div>
                <Field label="Punto de emisión por defecto" htmlFor="id_punto_emision_default">
                  <SelectPrimitive.Root 
                    value={form.id_punto_emision_default === 0 ? undefined : form.id_punto_emision_default.toString()} 
                    onValueChange={(val) => updateField("id_punto_emision_default", Number(val))}
                    disabled={loadingPuntos}
                  >
                    <SelectPrimitive.Trigger 
                      id="id_punto_emision_default"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                    >
                      <SelectPrimitive.Value placeholder={loadingPuntos ? "Cargando..." : "Selecciona un punto de emisión..."} />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content className="z-50 min-w-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg" position="popper" sideOffset={4}>
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
              </div>

              {/* SECCIÓN: Información de contacto */}
              <div className="bg-slate-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-700">Información de contacto</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Teléfono" htmlFor="telefono">
                    <Input
                      id="telefono"
                      value={form.telefono}
                      onChange={(event) => updateField("telefono", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="0991234567"
                    />
                  </Field>

                  <Field label="Dirección" htmlFor="direccion">
                    <Input
                      id="direccion"
                      value={form.direccion}
                      onChange={(event) => updateField("direccion", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Av. Principal 123, Ciudad"
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
                  className="h-10 px-6"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Guardando...
                    </span>
                  ) : (
                    editing ? "Guardar cambios" : "Crear usuario"
                  )}
                </Button>
              </div>
            </form>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
    </motion.div>
  );
}
