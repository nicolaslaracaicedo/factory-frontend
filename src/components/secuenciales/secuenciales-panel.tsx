"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, PlusCircle, Power, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import type {
  SecuencialFormInput,
  SecuencialItem,
  TipoDocumentoItem,
} from "@/src/modules/secuenciales/types/secuenciales.types";
import { secuencialesService } from "@/src/modules/secuenciales/services/secuenciales.service";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { ambienteService } from "@/src/modules/ambiente/services/ambiente.service";
import type { AmbienteItem } from "@/src/modules/ambiente/types/ambiente.types";

const initialForm: SecuencialFormInput = {
  id_punto_emision: 0,
  tipo_documento: "",
  ambiente: 0,
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

interface SecuencialesPanelProps {
  showPanel?: boolean;
}

export function SecuencialesPanel({ showPanel = true }: SecuencialesPanelProps) {
  const [secuenciales, setSecuenciales] = useState<SecuencialItem[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoItem[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [ambientes, setAmbientes] = useState<AmbienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [puntoFilter, setPuntoFilter] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SecuencialItem | null>(null);
  const [detailPreview, setDetailPreview] = useState<SecuencialItem | null>(null);
  const [form, setForm] = useState<SecuencialFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  const canCreate =
    !loadingCatalogs &&
    puntos.length > 0 &&
    tiposDocumento.length > 0 &&
    ambientes.length > 0;

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [tipos, puntosList, ambientesList] = await Promise.all([
          secuencialesService.listTiposDocumento(),
          emissionPointService.listPuntos(),
          ambienteService.listAmbientes(),
        ]);
        setTiposDocumento(tipos);
        setPuntos(puntosList);
        setAmbientes(ambientesList);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los catálogos.";
        toast.error(message);
      } finally {
        setLoadingCatalogs(false);
      }
    };

    void loadCatalogs();
  }, []);

  useEffect(() => {
    const loadSecuenciales = async () => {
      setLoading(true);
      try {
        let data: SecuencialItem[] = [];
        if (puntoFilter > 0) {
          data = await secuencialesService.listByPunto(puntoFilter);
        } else {
          const estado = filter === "TODOS" ? undefined : filter;
          data = await secuencialesService.listSecuenciales(estado);
        }
        setSecuenciales(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los secuenciales.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadSecuenciales();
  }, [filter, puntoFilter]);

  const filteredSecuenciales = useMemo(() => {
    let result = secuenciales;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(s =>
        getPuntoLabel(s.id_punto_emision)?.toLowerCase().includes(lower) ||
        getTipoLabel(s.tipo_documento)?.toLowerCase().includes(lower) ||
        getAmbienteLabel(s.ambiente)?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [secuenciales, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredSecuenciales.length / itemsPerPage) || 1;
  const paginatedSecuenciales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSecuenciales.slice(start, start + itemsPerPage);
  }, [filteredSecuenciales, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, puntoFilter, searchTerm]);

  const openCreate = () => {
    if (!canCreate) {
      toast.error("No hay catálogos disponibles para crear un secuencial.");
      return;
    }
    setForm({
      id_punto_emision: puntos[0]?.id ?? 0,
      tipo_documento: tiposDocumento[0]?.codigo ?? "",
      ambiente: ambientes[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const updateField = (name: keyof SecuencialFormInput, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const reloadSecuenciales = async () => {
    if (puntoFilter > 0) {
      const data = await secuencialesService.listByPunto(puntoFilter);
      setSecuenciales(data);
      return;
    }
    const estado = filter === "TODOS" ? undefined : filter;
    const data = await secuencialesService.listSecuenciales(estado);
    setSecuenciales(data);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      await secuencialesService.createSecuencial(form);
      toast.success("Secuencial creado.");
      await reloadSecuenciales();
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el secuencial.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (item: SecuencialItem) => {
    try {
      await secuencialesService.toggleEstado(item.id);
      await reloadSecuenciales();
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const openDetail = async (item: SecuencialItem) => {
    setDetailPreview(item);
    setDetail(null);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await secuencialesService.getSecuencial(item.id);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo obtener el detalle.";
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const getPuntoLabel = (id: number) => {
    const punto = puntos.find((item) => item.id === id);
    if (!punto) return "-";
    return `${punto.codigo} - ${punto.descripcion}`;
  };

  const getTipoLabel = (codigo: string) => {
    const tipo = tiposDocumento.find((item) => item.codigo === codigo);
    if (!tipo) return codigo || "-";
    return tipo.nombre || tipo.descripcion || codigo;
  };

  const getAmbienteLabel = (id: number) => {
    const ambiente = ambientes.find((item) => item.id === id);
    if (!ambiente) return id ? String(id) : "-";
    return ambiente.nombre || ambiente.codigo || String(ambiente.id);
  };

  const detailData = detail ?? detailPreview;

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar secuencial..."
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
              value={String(puntoFilter)}
              onChange={(event) => setPuntoFilter(Number(event.target.value))}
              disabled={loadingCatalogs}
            >
              <option value="0">Todos los puntos</option>
              {puntos.map((punto) => (
                <option key={punto.id} value={punto.id}>
                  {punto.codigo} - {punto.descripcion}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate} disabled={!canCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo secuencial
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando secuenciales...</p>
      ) : filteredSecuenciales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay secuenciales para este filtro.</p>
          <Button className="mt-3" onClick={openCreate} disabled={!canCreate}>
            Crear secuencial
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Punto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Ambiente</th>
                <th className="px-4 py-3">Secuencial</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSecuenciales.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {getPuntoLabel(item.id_punto_emision)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{getTipoLabel(item.tipo_documento)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{getAmbienteLabel(item.ambiente)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{item.secuencial || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.estado === "INACTIVO"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openDetail(item)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Button>
                      <Button variant="ghost" onClick={() => toggleEstado(item)}>
                        <Power className="mr-1 h-4 w-4" />
                        {item.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSecuenciales.length)} de {filteredSecuenciales.length}
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
              Nuevo secuencial
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Configura el punto, el tipo de documento y el ambiente.
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <Field label="Punto de emisión" htmlFor="id_punto_emision">
                <Select
                  id="id_punto_emision"
                  value={String(form.id_punto_emision)}
                  onChange={(event) =>
                    updateField("id_punto_emision", Number(event.target.value))
                  }
                  disabled={loadingCatalogs}
                >
                  {puntos.map((punto) => (
                    <option key={punto.id} value={punto.id}>
                      {punto.codigo} - {punto.descripcion}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Tipo de documento" htmlFor="tipo_documento">
                <Select
                  id="tipo_documento"
                  value={form.tipo_documento}
                  onChange={(event) => updateField("tipo_documento", event.target.value)}
                  disabled={loadingCatalogs}
                >
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo.codigo} value={tipo.codigo}>
                      {tipo.nombre || tipo.descripcion || tipo.codigo}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Ambiente" htmlFor="ambiente">
                <Select
                  id="ambiente"
                  value={String(form.ambiente)}
                  onChange={(event) => updateField("ambiente", Number(event.target.value))}
                  disabled={loadingCatalogs}
                >
                  {ambientes.map((ambiente) => (
                    <option key={ambiente.id} value={ambiente.id}>
                      {ambiente.nombre || ambiente.codigo || ambiente.id}
                    </option>
                  ))}
                </Select>
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

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Detalle del secuencial
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Información registrada para este punto de emisión.
            </Dialog.Description>

            {detailLoading ? (
              <p className="mt-4 text-sm text-slate-500">Cargando detalle...</p>
            ) : detailData ? (
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Punto</dt>
                  <dd className="text-slate-800">
                    {getPuntoLabel(detailData.id_punto_emision)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Tipo de documento
                  </dt>
                  <dd className="text-slate-800">
                    {getTipoLabel(detailData.tipo_documento)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Ambiente</dt>
                  <dd className="text-slate-800">
                    {getAmbienteLabel(detailData.ambiente)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Secuencial</dt>
                  <dd className="text-slate-800">{detailData.secuencial || "-"}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Estado</dt>
                  <dd className="text-slate-800">{detailData.estado || "ACTIVO"}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                No hay información disponible.
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
