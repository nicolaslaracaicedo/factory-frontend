"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, PlusCircle, Power, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import type {
  UsuarioFormInput,
  UsuarioItem,
  UsuarioUpdateInput,
} from "@/src/modules/users/types/user.types";
import { toUsuarioFormInput } from "@/src/modules/users/utils/user-payload.utils";
import { userService } from "@/src/modules/users/services/user.service";

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

export function UsersPanel({ showPanel = true }: UsersPanelProps) {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UsuarioItem | null>(null);
  const [form, setForm] = useState<UsuarioFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadUsuarios = async () => {
      setLoading(true);
      try {
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los usuarios.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadUsuarios();
  }, [filter]);

  const filteredUsuarios = useMemo(() => {
    let result = usuarios;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nombre?.toLowerCase().includes(lower) || 
        u.apellido?.toLowerCase().includes(lower) ||
        u.email?.toLowerCase().includes(lower) ||
        u.identificacion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [usuarios, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage) || 1;
  const paginatedUsuarios = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsuarios.slice(start, start + itemsPerPage);
  }, [filteredUsuarios, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

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
      tipo_identificacion: form.tipo_identificacion,
      identificacion: form.identificacion,
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      telefono: form.telefono,
      direccion: form.direccion,
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
    try {
      const current = usuario.estado?.toLowerCase() === "inactivo" ? "inactivo" : "activo";
      const next = current === "activo" ? "inactivo" : "activo";
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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar usuario..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <Select value={filter} onChange={(event) => setFilter(event.target.value as EstadoFiltro)}>
              {estadoFilters.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "TODOS" ? "Todos" : estado}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando usuarios...</p>
      ) : filteredUsuarios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay usuarios para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Crear usuario
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsuarios.map((usuario) => (
                <tr key={usuario.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {usuario.nombre} {usuario.apellido}
                    </p>
                    <p className="text-xs text-slate-500">
                      {usuario.tipo_identificacion} {usuario.identificacion || ""}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{usuario.email}</p>
                    <p className="text-xs text-slate-500">{usuario.telefono || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">Rol #{usuario.id_rol}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${usuario.estado?.toLowerCase() === "inactivo"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                      {usuario.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(usuario)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(usuario)}>
                        <Power className="mr-1 h-4 w-4" />
                        {usuario.estado?.toLowerCase() === "inactivo" ? "Activar" : "Desactivar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredUsuarios.length)} de {filteredUsuarios.length}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar usuario" : "Nuevo usuario"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza la información del usuario."
                : "Registra un nuevo usuario en la empresa."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 sm:grid-cols-2">
                <Field label="Rol" htmlFor="id_rol">
                  <Input
                    id="id_rol"
                    type="number"
                    min={1}
                    value={form.id_rol}
                    onChange={(event) => updateField("id_rol", Number(event.target.value))}
                  />
                </Field>

                <Field label="Tipo identificación" htmlFor="tipo_identificacion">
                  <Select
                    id="tipo_identificacion"
                    value={form.tipo_identificacion}
                    onChange={(event) => updateField("tipo_identificacion", event.target.value)}
                  >
                    {tipoIdentificacionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Identificación" htmlFor="identificacion">
                  <Input
                    id="identificacion"
                    value={form.identificacion}
                    onChange={(event) => updateField("identificacion", event.target.value)}
                  />
                </Field>

                <Field label="Nombre" htmlFor="nombre">
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(event) => updateField("nombre", event.target.value)}
                  />
                </Field>

                <Field label="Apellido" htmlFor="apellido">
                  <Input
                    id="apellido"
                    value={form.apellido}
                    onChange={(event) => updateField("apellido", event.target.value)}
                  />
                </Field>

                <Field label="Correo" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </Field>

                <Field label="Contraseña" htmlFor="password">
                  <Input
                    id="password"
                    type="password"
                    placeholder={editing ? "Dejar en blanco para no cambiar" : ""}
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                  />
                </Field>

                <Field label="Teléfono" htmlFor="telefono">
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(event) => updateField("telefono", event.target.value)}
                  />
                </Field>
              </section>

              <Field label="Dirección" htmlFor="direccion">
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(event) => updateField("direccion", event.target.value)}
                />
              </Field>

              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
