"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, PlusCircle, Power, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import type {
  GrupoProducto,
  GrupoProductoFormInput,
  GrupoProductoUpdateInput,
} from "@/src/modules/product-groups/types/product-group.types";
import { toGrupoFormInput } from "@/src/modules/product-groups/utils/product-group-payload.utils";
import { productGroupService } from "@/src/modules/product-groups/services/product-group.service";

const initialForm: GrupoProductoFormInput = {
  nombre: "",
  descripcion: "",
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface ProductGroupsPanelProps {
  showPanel?: boolean;
}

export function ProductGroupsPanel({ showPanel = true }: ProductGroupsPanelProps) {
  const [grupos, setGrupos] = useState<GrupoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GrupoProducto | null>(null);
  const [form, setForm] = useState<GrupoProductoFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadGrupos = async () => {
      setLoading(true);
      try {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await productGroupService.listGrupos(estado);
        setGrupos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los grupos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadGrupos();
  }, [filter]);

  const filteredGrupos = useMemo(() => {
    let result = grupos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g =>
        g.nombre?.toLowerCase().includes(lower) ||
        g.descripcion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [grupos, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage) || 1;
  const paginatedGrupos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredGrupos.slice(start, start + itemsPerPage);
  }, [filteredGrupos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (grupo: GrupoProducto) => {
    setEditing(grupo);
    setForm(toGrupoFormInput(grupo));
    setModalOpen(true);
  };

  const updateField = (name: keyof GrupoProductoFormInput, value: string) => {
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
        const payload: GrupoProductoUpdateInput = {
          nombre: form.nombre,
          descripcion: form.descripcion,
        };
        await productGroupService.updateGrupo(editing.id, payload);
        toast.success("Grupo actualizado.");
      } else {
        await productGroupService.createGrupo(form);
        toast.success("Grupo creado.");
      }

      const estado = filter === "TODOS" ? undefined : filter;
      const data = await productGroupService.listGrupos(estado);
      setGrupos(data);
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el grupo.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (grupo: GrupoProducto) => {
    try {
      await productGroupService.toggleGrupoEstado(grupo.id);
      const estado = filter === "TODOS" ? undefined : filter;
      const data = await productGroupService.listGrupos(estado);
      setGrupos(data);
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
            placeholder="Buscar grupo..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[180px]">
            <Select
              value={filter}
              onChange={(event) => setFilter(event.target.value as EstadoFiltro)}
            >
              {estadoFilters.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "TODOS" ? "Todos" : estado}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo grupo
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando grupos...</p>
      ) : filteredGrupos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay grupos para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Crear grupo
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedGrupos.map((grupo) => (
                <tr key={grupo.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{grupo.nombre}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{grupo.descripcion || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      grupo.estado === "INACTIVO"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {grupo.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(grupo)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(grupo)}>
                        <Power className="mr-1 h-4 w-4" />
                        {grupo.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredGrupos.length)} de {filteredGrupos.length}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar grupo" : "Nuevo grupo"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza los datos del grupo de productos."
                : "Registra un nuevo grupo para organizar tu catálogo."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                />
              </Field>

              <Field label="Descripción" htmlFor="descripcion">
                <Textarea
                  id="descripcion"
                  value={form.descripcion}
                  onChange={(event) => updateField("descripcion", event.target.value)}
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
