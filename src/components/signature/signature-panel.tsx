"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, PlusCircle, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import type {
  FirmaElectronica,
  FirmaUploadInput,
} from "@/src/modules/signature/types/signature.types";
import { signatureService } from "@/src/modules/signature/services/signature.service";

interface SignaturePanelProps {
  showPanel?: boolean;
}

const emptyForm: FirmaUploadInput = {
  firma: undefined as unknown as File,
  password: "",
  nombre: "",
};

export function SignaturePanel({ showPanel = true }: SignaturePanelProps) {
  const [firmas, setFirmas] = useState<FirmaElectronica[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<FirmaElectronica | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<FirmaElectronica | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FirmaUploadInput>(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredFirmas = useMemo(() => {
    let result = firmas;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.nombre?.toLowerCase().includes(lower) || 
        f.archivo?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [firmas, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredFirmas.length / itemsPerPage) || 1;
  const paginatedFirmas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFirmas.slice(start, start + itemsPerPage);
  }, [filteredFirmas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
    setModalOpen(true);
  };

  const openReplace = (firma: FirmaElectronica) => {
    setReplaceTarget(firma);
    setForm({
      firma: undefined as unknown as File,
      password: "",
      nombre: firma.nombre || "",
    });
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
    setForm((prev) => ({
      ...prev,
      [name]: value ?? "",
    }));
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.firma) {
      toast.warning("Selecciona un archivo de firma.");
      return;
    }

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
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar firma..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Subir firma
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando firmas...</p>
      ) : filteredFirmas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay firmas registradas.</p>
          <Button className="mt-3" onClick={openCreate}>
            Subir firma
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFirmas.map((firma) => (
                <tr key={firma.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{firma.nombre}</p>
                    <p className="text-xs text-slate-500">{firma.archivo || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${firma.activo === false
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                      }`}>
                      {firma.activo === false ? "INACTIVA" : "ACTIVA"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openDetail(firma)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Button>
                      <Button variant="secondary" onClick={() => openReplace(firma)}>
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Reemplazar
                      </Button>
                      <Button variant="ghost" onClick={() => activateFirma(firma)}>
                        <CheckCircle2 className="mr-1 h-4 w-4" />
                        Activar
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredFirmas.length)} de {filteredFirmas.length}
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
              {replaceTarget ? "Reemplazar firma" : "Subir nueva firma"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {replaceTarget
                ? "Selecciona el nuevo archivo y la contrase&ntilde;a del certificado."
                : "Carga el archivo .p12 junto con la contrase&ntilde;a."}
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <Field label="Archivo" htmlFor="firma">
                <Input
                  id="firma"
                  type="file"
                  accept=".p12,.pfx"
                  onChange={(event) =>
                    updateField("firma", event.target.files?.[0] ?? null)
                  }
                />
              </Field>

              <Field label="Nombre" htmlFor="nombre">
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(event) => updateField("nombre", event.target.value)}
                />
              </Field>

              <Field label="Contrase&ntilde;a" htmlFor="password">
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
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

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,620px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Detalle de firma
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Informaci&oacute;n del certificado y estado.
            </Dialog.Description>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Nombre:</span> {detail?.nombre || "-"}
              </p>
              <p>
                <span className="font-semibold">Archivo:</span> {detail?.archivo || "-"}
              </p>
              <p>
                <span className="font-semibold">Estado:</span>{" "}
                {detail?.activo === false ? "INACTIVA" : "ACTIVA"}
              </p>
              <p>
                <span className="font-semibold">Estado certificado:</span>{" "}
                {detail?.estado_certificado || "-"}
              </p>
              <p>
                <span className="font-semibold">Expiraci&oacute;n:</span>{" "}
                {detail?.fecha_expiracion || "-"}
              </p>
              <p>
                <span className="font-semibold">Titular:</span>{" "}
                {certificado?.titular || "-"}
              </p>
              <p>
                <span className="font-semibold">Organizaci&oacute;n:</span>{" "}
                {certificado?.organizacion || "-"}
              </p>
              <p>
                <span className="font-semibold">Unidad:</span> {certificado?.unidad || "-"}
              </p>
              <p>
                <span className="font-semibold">Pa&iacute;s:</span> {certificado?.pais || "-"}
              </p>
              <p>
                <span className="font-semibold">V&aacute;lido desde:</span>{" "}
                {certificado?.valido_desde || "-"}
              </p>
              <p>
                <span className="font-semibold">V&aacute;lido hasta:</span>{" "}
                {certificado?.valido_hasta || "-"}
              </p>
              <p>
                <span className="font-semibold">Emisor:</span> {certificado?.emisor || "-"}
              </p>
              <p>
                <span className="font-semibold">Serial:</span> {certificado?.serial || "-"}
              </p>
            </div>

            <div className="mt-5 flex justify-end">
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
