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
  PuntoEmision,
  PuntoEmisionFormInput,
  PuntoEmisionUpdateInput,
} from "@/src/modules/emission-points/types/emission-point.types";
import { toPuntoFormInput } from "@/src/modules/emission-points/utils/emission-point-payload.utils";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import { establishmentService } from "@/src/modules/establishments/services/establishment.service";
import type { Establecimiento } from "@/src/modules/establishments/types/establishment.types";

const initialForm: PuntoEmisionFormInput = {
  id_establecimiento: 0,
  codigo: "",
  descripcion: "",
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface EmissionPointsPanelProps {
  showPanel?: boolean;
}

export function EmissionPointsPanel({ showPanel = true }: EmissionPointsPanelProps) {
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [establecimientos, setEstablecimientos] = useState<Establecimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEst, setLoadingEst] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PuntoEmision | null>(null);
  const [form, setForm] = useState<PuntoEmisionFormInput>(initialForm);
  const [estFilter, setEstFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  useEffect(() => {
    const loadEstablecimientos = async () => {
      setLoadingEst(true);
      try {
        const data = await establishmentService.listEstablecimientos("ACTIVO");
        setEstablecimientos(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los establecimientos.";
        toast.error(message);
      } finally {
        setLoadingEst(false);
      }
    };

    void loadEstablecimientos();
  }, []);

  useEffect(() => {
    const loadPuntos = async () => {
      setLoading(true);
      try {
        let data: PuntoEmision[] = [];
        if (estFilter > 0) {
          data = await emissionPointService.listByEstablecimiento(estFilter);
        } else {
          const estado = filter === "TODOS" ? undefined : filter;
          data = await emissionPointService.listPuntos(estado);
        }
        setPuntos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los puntos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadPuntos();
  }, [filter, estFilter]);

  const filteredPuntos = useMemo(() => {
    let result = puntos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.descripcion?.toLowerCase().includes(lower) || 
        p.codigo?.toLowerCase().includes(lower) ||
        getEstNombre(p.id_establecimiento)?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [puntos, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredPuntos.length / itemsPerPage) || 1;
  const paginatedPuntos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPuntos.slice(start, start + itemsPerPage);
  }, [filteredPuntos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, estFilter, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_establecimiento: establecimientos[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const openEdit = (punto: PuntoEmision) => {
    setEditing(punto);
    setForm(toPuntoFormInput(punto));
    setModalOpen(true);
  };

  const updateField = (name: keyof PuntoEmisionFormInput, value: string | number) => {
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
        const payload: PuntoEmisionUpdateInput = {
          descripcion: form.descripcion,
        };
        await emissionPointService.updatePunto(editing.id, payload);
        toast.success("Punto actualizado.");
      } else {
        await emissionPointService.createPunto(form);
        toast.success("Punto creado.");
      }

      if (estFilter > 0) {
        const data = await emissionPointService.listByEstablecimiento(estFilter);
        setPuntos(data);
      } else {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await emissionPointService.listPuntos(estado);
        setPuntos(data);
      }
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el punto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (punto: PuntoEmision) => {
    try {
      await emissionPointService.toggleEstado(punto.id);
      if (estFilter > 0) {
        const data = await emissionPointService.listByEstablecimiento(estFilter);
        setPuntos(data);
      } else {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await emissionPointService.listPuntos(estado);
        setPuntos(data);
      }
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const getEstNombre = (id: number) => {
    return establecimientos.find((item) => item.id === id)?.nombre ?? "-";
  };

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar punto de emisión..."
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
          <div className="min-w-[200px]">
            <Select
              value={String(estFilter)}
              onChange={(event) => setEstFilter(Number(event.target.value))}
              disabled={loadingEst}
            >
              <option value="0">Todos los establecimientos</option>
              {establecimientos.map((est) => (
                <option key={est.id} value={est.id}>
                  {est.codigo} - {est.nombre}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo punto
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando puntos...</p>
      ) : filteredPuntos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay puntos para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Crear punto
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Punto</th>
                <th className="px-4 py-3">Establecimiento</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPuntos.map((punto) => (
                <tr key={punto.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{punto.descripcion}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{getEstNombre(punto.id_establecimiento)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{punto.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${punto.estado === "INACTIVO"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {punto.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(punto)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(punto)}>
                        <Power className="mr-1 h-4 w-4" />
                        {punto.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPuntos.length)} de {filteredPuntos.length}
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
              {editing ? "Editar punto" : "Nuevo punto"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza la descripcion del punto de emisión."
                : "Registra un nuevo punto de emisión para un establecimiento."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 sm:grid-cols-2">
                <Field label="Establecimiento" htmlFor="id_establecimiento">
                  <Select
                    id="id_establecimiento"
                    value={String(form.id_establecimiento)}
                    onChange={(event) => updateField("id_establecimiento", Number(event.target.value))}
                    disabled={Boolean(editing) || loadingEst}
                  >
                    {loadingEst ? (
                      <option value="0">Cargando...</option>
                    ) : (
                      establecimientos.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.codigo} - {est.nombre}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="Código" htmlFor="codigo">
                  <Input
                    id="codigo"
                    value={form.codigo}
                    onChange={(event) => updateField("codigo", event.target.value)}
                    disabled={Boolean(editing)}
                  />
                </Field>
              </section>

              <Field label="Descripción" htmlFor="descripcion">
                <Input
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
