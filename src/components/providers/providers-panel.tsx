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
  Proveedor,
  ProveedorFormInput,
  ProveedorUpdateInput,
  TipoIdentificacion,
} from "@/src/modules/providers/types/provider.types";
import { toProveedorFormInput } from "@/src/modules/providers/utils/provider-payload.utils";
import { providerService } from "@/src/modules/providers/services/provider.service";

const initialForm: ProveedorFormInput = {
  tipo_identificacion: "",
  identificacion: "",
  razon_social: "",
  direccion: "",
  telefono: "",
  email: "",
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface ProvidersPanelProps {
  showPanel?: boolean;
}

export function ProvidersPanel({ showPanel = true }: ProvidersPanelProps) {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<
    TipoIdentificacion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [form, setForm] = useState<ProveedorFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  const filteredProveedores = useMemo(() => {
    let result = proveedores;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.razon_social?.toLowerCase().includes(lower) || 
        p.identificacion?.toLowerCase().includes(lower) ||
        p.email?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [proveedores, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProveedores.length / itemsPerPage) || 1;
  const paginatedProveedores = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProveedores.slice(start, start + itemsPerPage);
  }, [filteredProveedores, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  const getTipoLabel = (codigo: string) => {
    const tipo = tiposIdentificacion.find((item) => item.codigo === codigo);
    if (!tipo) return codigo || "-";
    return tipo.nombre || tipo.codigo || "-";
  };

  useEffect(() => {
    const loadTipos = async () => {
      setLoadingTipos(true);
      try {
        const data = await providerService.listTiposIdentificacion();
        setTiposIdentificacion(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los tipos de identificacion.";
        toast.error(message);
      } finally {
        setLoadingTipos(false);
      }
    };

    void loadTipos();
  }, []);

  useEffect(() => {
    const loadProveedores = async () => {
      setLoading(true);
      try {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await providerService.listProveedores(estado);
        setProveedores(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los proveedores.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProveedores();
  }, [filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      tipo_identificacion:
        tiposIdentificacion[0]?.codigo || initialForm.tipo_identificacion,
    });
    setModalOpen(true);
  };

  const openEdit = (proveedor: Proveedor) => {
    setEditing(proveedor);
    setForm(toProveedorFormInput(proveedor));
    setModalOpen(true);
  };

  const updateField = (name: keyof ProveedorFormInput, value: string) => {
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
        const payload: ProveedorUpdateInput = {
          razon_social: form.razon_social,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
        };
        await providerService.updateProveedor(editing.id, payload);
        toast.success("Proveedor actualizado.");
      } else {
        await providerService.createProveedor(form);
        toast.success("Proveedor creado.");
      }

      const estado = filter === "TODOS" ? undefined : filter;
      const data = await providerService.listProveedores(estado);
      setProveedores(data);
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el proveedor.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (proveedor: Proveedor) => {
    try {
      await providerService.toggleProveedorEstado(proveedor.id);
      const estado = filter === "TODOS" ? undefined : filter;
      const data = await providerService.listProveedores(estado);
      setProveedores(data);
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado.";
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
            placeholder="Buscar proveedor..."
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
            Nuevo proveedor
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando proveedores...</p>
      ) : filteredProveedores.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay proveedores para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Registrar proveedor
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Proveedor</th>
                <th className="px-4 py-3">Identificacion</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProveedores.map((proveedor) => (
                <tr key={proveedor.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{proveedor.razon_social}</p>
                    <p className="text-xs text-slate-500">{proveedor.direccion || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{proveedor.identificacion}</p>
                    <p className="text-xs text-slate-500">
                      {getTipoLabel(proveedor.tipo_identificacion)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{proveedor.email || "-"}</p>
                    <p className="text-xs text-slate-500">{proveedor.telefono || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      proveedor.estado === "INACTIVO"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {proveedor.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(proveedor)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(proveedor)}>
                        <Power className="mr-1 h-4 w-4" />
                        {proveedor.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProveedores.length)} de {filteredProveedores.length}
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
              {editing ? "Editar proveedor" : "Nuevo proveedor"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza los datos comerciales del proveedor."
                : "Registra un nuevo proveedor para tus compras."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo identificacion" htmlFor="tipo_identificacion">
                  <Select
                    id="tipo_identificacion"
                    value={form.tipo_identificacion}
                    onChange={(event) => updateField("tipo_identificacion", event.target.value)}
                    disabled={loadingTipos}
                  >
                    {loadingTipos ? (
                      <option value="">Cargando...</option>
                    ) : (
                      tiposIdentificacion.map((option) => (
                        <option key={option.codigo} value={option.codigo}>
                          {option.nombre || option.codigo}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="Identificacion" htmlFor="identificacion">
                  <Input
                    id="identificacion"
                    inputMode="numeric"
                    value={form.identificacion}
                    onChange={(event) => updateField("identificacion", event.target.value)}
                    disabled={Boolean(editing)}
                  />
                </Field>

                <Field label="Razon social" htmlFor="razon_social">
                  <Input
                    id="razon_social"
                    value={form.razon_social}
                    onChange={(event) => updateField("razon_social", event.target.value)}
                  />
                </Field>

                <Field label="Telefono" htmlFor="telefono">
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(event) => updateField("telefono", event.target.value)}
                  />
                </Field>

                <Field label="Correo electronico" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                  />
                </Field>
              </section>

              <Field label="Direccion" htmlFor="direccion">
                <Textarea
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
