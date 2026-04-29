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
  Producto,
  ProductoFormInput,
  ProductoUpdateInput,
} from "@/src/modules/products/types/product.types";
import { toProductoFormInput } from "@/src/modules/products/utils/product-payload.utils";
import { productService } from "@/src/modules/products/services/product.service";
import { productGroupService } from "@/src/modules/product-groups/services/product-group.service";
import type { GrupoProducto } from "@/src/modules/product-groups/types/product-group.types";
import { ivaService } from "@/src/modules/iva/services/iva.service";
import type { CodigoIva } from "@/src/modules/iva/types/iva.types";

const initialForm: ProductoFormInput = {
  codigo: "",
  descripcion: "",
  tipo: "PRODUCTO",
  id_grupo: 0,
  id_iva: 0,
  unidad_medida: "",
  precio: 0,
  tiene_ice: false,
  porcentaje_ice: 0,
};

const estadoFilters = ["TODOS", "ACTIVO", "INACTIVO"] as const;
const tipoOptions = ["PRODUCTO", "SERVICIO"] as const;

const unidadOptions = ["UND", "KG", "LT", "CAJ", "PAQ"] as const;

type EstadoFiltro = (typeof estadoFilters)[number];

type TipoProducto = (typeof tipoOptions)[number];

type UnidadMedida = (typeof unidadOptions)[number];

interface ProductsPanelProps {
  showPanel?: boolean;
}

export function ProductsPanel({ showPanel = true }: ProductsPanelProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [grupos, setGrupos] = useState<GrupoProducto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [loadingIva, setLoadingIva] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("ACTIVO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [form, setForm] = useState<ProductoFormInput>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLabel = useMemo(() => {
    if (filter === "TODOS") return "Todos";
    if (filter === "ACTIVO") return "Activos";
    return "Inactivos";
  }, [filter]);

  const filteredProductos = useMemo(() => {
    let result = productos;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.descripcion?.toLowerCase().includes(lower) || 
        p.codigo?.toLowerCase().includes(lower) ||
        getGrupoNombre(p.id_grupo)?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [productos, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage) || 1;
  const paginatedProductos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProductos.slice(start, start + itemsPerPage);
  }, [filteredProductos, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    const loadGrupos = async () => {
      setLoadingGrupos(true);
      try {
        const data = await productGroupService.listGrupos("ACTIVO");
        setGrupos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los grupos.";
        toast.error(message);
      } finally {
        setLoadingGrupos(false);
      }
    };

    void loadGrupos();
  }, []);

  useEffect(() => {
    const loadIva = async () => {
      setLoadingIva(true);
      try {
        const data = await ivaService.listCodigos(true);
        setCodigosIva(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los codigos IVA.";
        toast.error(message);
      } finally {
        setLoadingIva(false);
      }
    };

    void loadIva();
  }, []);

  useEffect(() => {
    const loadProductos = async () => {
      setLoading(true);
      try {
        const estado = filter === "TODOS" ? undefined : filter;
        const data = await productService.listProductos(estado);
        setProductos(data);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar los productos.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadProductos();
  }, [filter]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_grupo: grupos[0]?.id ?? 0,
      id_iva: codigosIva[0]?.id ?? 0,
    });
    setModalOpen(true);
  };

  const openEdit = (producto: Producto) => {
    setEditing(producto);
    setForm(toProductoFormInput(producto));
    setModalOpen(true);
  };

  const updateField = (name: keyof ProductoFormInput, value: string | number | boolean) => {
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
        const payload: ProductoUpdateInput = {
          codigo: form.codigo,
          descripcion: form.descripcion,
          tipo: form.tipo,
          id_grupo: form.id_grupo,
          id_iva: form.id_iva,
          unidad_medida: form.unidad_medida,
          precio: form.precio,
          tiene_ice: form.tiene_ice,
          porcentaje_ice: form.porcentaje_ice,
        };
        await productService.updateProducto(editing.id, payload);
        toast.success("Producto actualizado.");
      } else {
        await productService.createProducto({
          codigo: form.codigo,
          descripcion: form.descripcion,
          tipo: form.tipo,
          id_grupo: form.id_grupo,
          id_iva: form.id_iva,
          unidad_medida: form.unidad_medida,
          precio: form.precio,
          tiene_ice: form.tiene_ice,
        });
        toast.success("Producto creado.");
      }

      const estado = filter === "TODOS" ? undefined : filter;
      const data = await productService.listProductos(estado);
      setProductos(data);
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el producto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (producto: Producto) => {
    try {
      await productService.toggleProductoActivo(producto.id);
      const estado = filter === "TODOS" ? undefined : filter;
      const data = await productService.listProductos(estado);
      setProductos(data);
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const getGrupoNombre = (id: number) => {
    return grupos.find((grupo) => grupo.id === id)?.nombre ?? "-";
  };

  const getIvaNombre = (id: number) => {
    const codigo = codigosIva.find((item) => item.id === id);
    if (!codigo) return "-";
    const porcentaje = `${codigo.porcentaje.toFixed(2)}%`;
    return codigo.nombre ? `${codigo.nombre} (${porcentaje})` : porcentaje;
  };

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar producto..."
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
            Nuevo producto
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando productos...</p>
      ) : filteredProductos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay productos para este filtro.</p>
          <Button className="mt-3" onClick={openCreate}>
            Registrar producto
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Grupo</th>
                <th className="px-4 py-3">IVA</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProductos.map((producto) => (
                <tr key={producto.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{producto.descripcion}</p>
                    <p className="text-xs text-slate-500">{producto.codigo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{getGrupoNombre(producto.id_grupo)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{getIvaNombre(producto.id_iva)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{producto.precio.toFixed(2)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      producto.estado === "INACTIVO"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {producto.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openEdit(producto)}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="ghost" onClick={() => toggleActivo(producto)}>
                        <Power className="mr-1 h-4 w-4" />
                        {producto.estado === "INACTIVO" ? "Activar" : "Desactivar"}
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
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar producto" : "Nuevo producto"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              {editing
                ? "Actualiza los datos del producto."
                : "Registra un nuevo producto para tu catálogo."}
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

                <Field label="Tipo" htmlFor="tipo">
                  <Select
                    id="tipo"
                    value={form.tipo as TipoProducto}
                    onChange={(event) => updateField("tipo", event.target.value)}
                  >
                    {tipoOptions.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Grupo" htmlFor="id_grupo">
                  <Select
                    id="id_grupo"
                    value={String(form.id_grupo)}
                    onChange={(event) => updateField("id_grupo", Number(event.target.value))}
                    disabled={loadingGrupos}
                  >
                    {loadingGrupos ? (
                      <option value="0">Cargando...</option>
                    ) : (
                      grupos.map((grupo) => (
                        <option key={grupo.id} value={grupo.id}>
                          {grupo.nombre}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="IVA" htmlFor="id_iva">
                  <Select
                    id="id_iva"
                    value={String(form.id_iva)}
                    onChange={(event) => updateField("id_iva", Number(event.target.value))}
                    disabled={loadingIva}
                  >
                    {loadingIva ? (
                      <option value="0">Cargando...</option>
                    ) : (
                      codigosIva.map((codigo) => (
                        <option key={codigo.id} value={codigo.id}>
                          {codigo.nombre
                            ? `${codigo.nombre} (${codigo.porcentaje.toFixed(2)}%)`
                            : `${codigo.porcentaje.toFixed(2)}%`}
                        </option>
                      ))
                    )}
                  </Select>
                </Field>

                <Field label="Unidad de medida" htmlFor="unidad_medida">
                  <Select
                    id="unidad_medida"
                    value={form.unidad_medida as UnidadMedida}
                    onChange={(event) => updateField("unidad_medida", event.target.value)}
                  >
                    <option value="">Selecciona unidad</option>
                    {unidadOptions.map((unidad) => (
                      <option key={unidad} value={unidad}>
                        {unidad}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Precio" htmlFor="precio">
                  <Input
                    id="precio"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.precio}
                    onChange={(event) => updateField("precio", Number(event.target.value))}
                  />
                </Field>

                <Field label="Descripción" htmlFor="descripcion">
                  <Textarea
                    id="descripcion"
                    value={form.descripcion}
                    onChange={(event) => updateField("descripcion", event.target.value)}
                  />
                </Field>

                <div className="space-y-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-sky-700"
                      checked={form.tiene_ice}
                      onChange={(event) => updateField("tiene_ice", event.target.checked)}
                    />
                    <span className="font-medium text-slate-700">Tiene ICE</span>
                  </label>

                  <Field label="Porcentaje ICE" htmlFor="porcentaje_ice">
                    <Input
                      id="porcentaje_ice"
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.porcentaje_ice}
                      onChange={(event) => updateField("porcentaje_ice", Number(event.target.value))}
                      disabled={!form.tiene_ice}
                    />
                  </Field>
                </div>
              </section>

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
