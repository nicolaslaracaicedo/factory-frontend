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
  Establecimiento,
  EstablecimientoFormInput,
  EstablecimientoUpdateInput,
} from "@/src/modules/establishments/types/establishment.types";
import { toEstablecimientoFormInput } from "@/src/modules/establishments/utils/establishment-payload.utils";
import { establishmentService } from "@/src/modules/establishments/services/establishment.service";

const initialForm: EstablecimientoFormInput = {
  codigo: "",
  nombre: "",
  direccion: "",
  es_matriz: false,
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface EstablishmentsPanelProps {
  showPanel?: boolean;
}

export function EstablishmentsPanel({ showPanel = true }: EstablishmentsPanelProps) {
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Establecimiento | null>(null);
  const [form, setForm] = useState<EstablecimientoFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadEstablecimientos = async () => {
      setLoading(true);
      try {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await establishmentService.listEstablecimientos(estado);
        setEstablecimientos(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los establecimientos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadEstablecimientos();
  }, [filter]);

  const filteredEstablecimientos = useMemo(() => {
    let result = establecimientos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.nombre?.toLowerCase().includes(lower) || 
        e.codigo?.toLowerCase().includes(lower) ||
        e.direccion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [establecimientos, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredEstablecimientos.length / itemsPerPage) || 1;
  const paginatedEstablecimientos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEstablecimientos.slice(start, start + itemsPerPage);
  }, [filteredEstablecimientos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (establecimiento: Establecimiento) => {
    setEditing(establecimiento);
    setForm(toEstablecimientoFormInput(establecimiento));
    setModalOpen(true);
  };

  const updateField = (name: keyof EstablecimientoFormInput, value: string | boolean) => {
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
        const payload: EstablecimientoUpdateInput = {
          nombre: form.nombre,
          direccion: form.direccion,
          es_matriz: form.es_matriz,
        };
        await establishmentService.updateEstablecimiento(editing.id, payload);
        toast.success("Establecimiento actualizado.");
      } else {
        await establishmentService.createEstablecimiento(form);
        toast.success("Establecimiento creado.");
      }

      const estado = filter === "TODOS" ? undefined : filter;
      const data = await establishmentService.listEstablecimientos(estado);
      setEstablecimientos(data);
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el establecimiento.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (establecimiento: Establecimiento) => {
    try {
      await establishmentService.toggleEstado(establecimiento.id);
      const estado = filter === "TODOS" ? undefined : filter;
      const data = await establishmentService.listEstablecimientos(estado);
      setEstablecimientos(data);
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
            placeholder="Buscar establecimiento..."
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
            Nuevo establecimiento
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando establecimientos...</p>
      ) : filteredEstablecimientos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay establecimientos para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Crear establecimiento
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Establecimiento</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Matriz</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEstablecimientos.map((establecimiento) => (
                <tr key={establecimiento.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{establecimiento.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {establecimiento.direccion || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{establecimiento.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${establecimiento.es_matriz
                        ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>
                      {establecimiento.es_matriz ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${establecimiento.estado === "INACTIVO"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {establecimiento.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(establecimiento)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(establecimiento)}>
                        <Power className="mr-1 h-4 w-4" />
                        {establecimiento.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredEstablecimientos.length)} de {filteredEstablecimientos.length}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,700px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar establecimiento" : "Nuevo establecimiento"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza los datos del establecimiento."
                : "Registra un nuevo establecimiento para tu empresa."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 sm:grid-cols-2">
                <Field label="Código" htmlFor="codigo">
                  <Input
                    id="codigo"
                    value={form.codigo}
                    onChange={(event) => updateField("codigo", event.target.value)}
                    disabled={Boolean(editing)}
                  />
                </Field>

                <Field label="Nombre" htmlFor="nombre">
                  <Input
                    id="nombre"
                    value={form.nombre}
                    onChange={(event) => updateField("nombre", event.target.value)}
                  />
                </Field>
              </section>

              <Field label="Dirección" htmlFor="direccion">
                <Textarea
                  id="direccion"
                  value={form.direccion}
                  onChange={(event) => updateField("direccion", event.target.value)}
                />
              </Field>

              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-sky-700"
                  checked={form.es_matriz}
                  onChange={(event) => updateField("es_matriz", event.target.checked)}
                />
                <span className="font-medium text-slate-700">Es matriz</span>
              </label>

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
