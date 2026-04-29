"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { ambienteService } from "@/src/modules/ambiente/services/ambiente.service";
import type { AmbienteItem } from "@/src/modules/ambiente/types/ambiente.types";

interface AmbientePanelProps {
  showPanel?: boolean;
}

export function AmbientePanel({ showPanel = true }: AmbientePanelProps) {
  const [ambientes, setAmbientes] = useState<AmbienteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAmbientes = useMemo(() => {
    let result = ambientes;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(a => 
        a.nombre?.toLowerCase().includes(lower) || 
        a.codigo?.toLowerCase().includes(lower) ||
        a.descripcion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [ambientes, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAmbientes.length / itemsPerPage) || 1;
  const paginatedAmbientes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAmbientes.slice(start, start + itemsPerPage);
  }, [filteredAmbientes, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const loadAmbientes = async () => {
      setLoading(true);
      try {
        const data = await ambienteService.listAmbientes();
        setAmbientes(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los ambientes.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadAmbientes();
  }, []);

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar ambiente..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando ambientes...</p>
      ) : filteredAmbientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay ambientes registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAmbientes.map((ambiente) => (
                <tr key={ambiente.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">
                      {ambiente.codigo || String(ambiente.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-700">{ambiente.nombre || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600">{ambiente.descripcion || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAmbientes.length)} de {filteredAmbientes.length}
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
    </div>
  );
}
