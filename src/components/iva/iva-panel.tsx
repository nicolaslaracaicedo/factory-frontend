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

  const filteredCodigos = useMemo(() => {
    let result = codigos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.codigo?.toLowerCase().includes(lower) || 
        c.nombre?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [codigos, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCodigos.length / itemsPerPage) || 1;
  const paginatedCodigos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCodigos.slice(start, start + itemsPerPage);
  }, [filteredCodigos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar código IVA..."
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
            Nuevo codigo
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando códigos...</p>
      ) : filteredCodigos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay códigos para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Crear codigo
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Codigo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Porcentaje</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCodigos.map((codigo) => (
                <tr key={codigo.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{codigo.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{codigo.nombre}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{codigo.porcentaje.toFixed(2)}%</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${codigo.activo === false
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {codigo.activo === false ? "INACTIVO" : "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(codigo)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleActivo(codigo)}>
                        <Power className="mr-1 h-4 w-4" />
                        {codigo.activo === false ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCodigos.length)} de {filteredCodigos.length}
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
              {editing ? "Editar código IVA" : "Nuevo código IVA"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza los datos del código de IVA."
                : "Registra un nuevo código para el catálogo de IVA."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <Field label="Código" htmlFor="codigo">
                <Input
                  id="codigo"
                  value={form.codigo}
                  onChange={(event) => updateField("codigo", event.target.value)}
                />
              </Field>

              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
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
