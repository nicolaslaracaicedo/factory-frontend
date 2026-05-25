"use client";

import { useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { toast } from "sonner";
import { Box, ChevronDown, DollarSign, Layers, Percent, Tag, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import type {
  Producto,
  ProductoFormInput,
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
  tipo: "",
  id_grupo: 0,
  id_iva: 0,
  unidad_medida: "",
  precio: 0,
  tiene_ice: false,
  porcentaje_ice: 0,
  codigo_ice: "",
  tiene_irbpnr: false,
  valor_unitario_irbpnr: 0.02,
};

const iceSRIMap: Record<string, number> = {
  "3021": 15,
  "3031": 15,
  "3041": 15,
  "3072": 10,
  "3073": 10,
  "3081": 15,
  "3091": 10,
};

const iceSRIOptions = [
  { value: "3021", label: "3021 - Vehículos Motorizados" },
  { value: "3031", label: "3031 - Videojuegos" },
  { value: "3041", label: "3041 - Servicios Telefonía Móvil" },
  { value: "3072", label: "3072 - Bebidas Energizantes" },
  { value: "3073", label: "3073 - Bebidas Gaseosas" },
  { value: "3081", label: "3081 - Perfumes" },
  { value: "3091", label: "3091 - Productos Plásticos" },
];

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (product: Producto) => void;
}

export function ProductFormModal({ open, onOpenChange, onSuccess }: ProductFormModalProps) {
  const [form, setForm] = useState<ProductoFormInput>(initialForm);
  const [grupos, setGrupos] = useState<GrupoProducto[]>([]);
  const [codigosIva, setCodigosIva] = useState<CodigoIva[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [loadingIva, setLoadingIva] = useState(true);
  const [unidadSearch, setUnidadSearch] = useState("");
  const [grupoSearch, setGrupoSearch] = useState("");

  const unidadesMedida = useMemo(
    () => [
      { value: "UNIDAD", label: "Unidad" },
      { value: "KG", label: "Kilogramo (kg)" },
      { value: "GR", label: "Gramo (g)" },
      { value: "LT", label: "Litro (lt)" },
      { value: "ML", label: "Mililitro (ml)" },
      { value: "M", label: "Metro (m)" },
      { value: "CM", label: "Centimetro (cm)" },
      { value: "M2", label: "Metro cuadrado (m²)" },
      { value: "M3", label: "Metro cubico (m³)" },
      { value: "HORA", label: "Hora" },
      { value: "CAJA", label: "Caja" },
      { value: "PAQUETE", label: "Paquete" },
      { value: "DOCENA", label: "Docena" },
      { value: "BULTO", label: "Bulto" },
      { value: "BARRIL", label: "Barril" },
      { value: "GALON", label: "Galon" },
    ],
    []
  );

  const unidadesFiltradas = useMemo(() => {
    const query = unidadSearch.trim().toLowerCase();
    if (!query) return unidadesMedida;
    return unidadesMedida.filter((unidad) =>
      `${unidad.label} ${unidad.value}`.toLowerCase().includes(query)
    );
  }, [unidadSearch, unidadesMedida]);

  const gruposFiltrados = useMemo(() => {
    const query = grupoSearch.trim().toLowerCase();
    if (!query) return grupos;
    return grupos.filter((grupo) => grupo.nombre.toLowerCase().includes(query));
  }, [grupoSearch, grupos]);

  const updateField = (name: keyof ProductoFormInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const normalizeDecimal = (value: number, fallback: number) => {
    return Number.isFinite(value) ? value : fallback;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    const normalizedIce = form.tiene_ice
      ? normalizeDecimal(form.porcentaje_ice, 0)
      : 0;
    const normalizedIrbpnr = form.tiene_irbpnr
      ? normalizeDecimal(form.valor_unitario_irbpnr, 0.02)
      : 0;

    try {
      const result = await productService.createProducto({
        codigo: form.codigo,
        descripcion: form.descripcion,
        tipo: form.tipo,
        id_grupo: form.id_grupo,
        id_iva: form.id_iva,
        unidad_medida: form.unidad_medida,
        precio: form.precio,
        tiene_ice: form.tiene_ice,
        porcentaje_ice: normalizedIce,
        codigo_ice: form.codigo_ice,
        tiene_irbpnr: form.tiene_irbpnr,
        valor_unitario_irbpnr: normalizedIrbpnr,
      });

      toast.success("Producto creado.");
      setForm(initialForm);
      onSuccess?.(result);
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar el producto.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setForm(initialForm);

    const load = async () => {
      setLoadingGrupos(true);
      setLoadingIva(true);
      try {
        const [gruposData, ivaData] = await Promise.all([
          productGroupService.listGrupos("ACTIVO"),
          ivaService.listCodigos(true),
        ]);
        setGrupos(gruposData);
        setCodigosIva(ivaData);
        setForm((prev) => ({
          ...prev,
          id_grupo: gruposData[0]?.id ?? 0,
          id_iva: ivaData[0]?.id ?? 0,
        }));
      } catch (error) {
        toast.error("No se pudieron cargar los catálogos de producto.");
      } finally {
        setLoadingGrupos(false);
        setLoadingIva(false);
      }
    };

    void load();
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(val) => {
      if (!val) {
        setForm(initialForm);
        setGrupoSearch("");
        setUnidadSearch("");
      }
      onOpenChange(val);
    }}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]"
          />
        </Dialog.Overlay>
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Box className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Crear nuevo producto
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Registra un nuevo producto o servicio con sus datos de clasificación y precios.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 outline-none"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={handleSubmit}>
            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Identificación</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Código" htmlFor="codigo">
                  <Input
                    id="codigo"
                    value={form.codigo}
                    onChange={(event) => updateField("codigo", event.target.value)}
                    className="bg-white shadow-none placeholder:text-slate-300"
                    placeholder="Ej: PROD-001"
                    required
                  />
                </Field>

                <Field label="Tipo" htmlFor="tipo">
                  <SelectPrimitive.Root
                    value={form.tipo || undefined}
                    onValueChange={(val) => updateField("tipo", val)}
                  >
                    <SelectPrimitive.Trigger
                      id="tipo"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <SelectPrimitive.Value placeholder="Selecciona un tipo..." />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectPrimitive.Viewport className="p-1">
                          <SelectPrimitive.Item
                            value="PRODUCTO"
                            className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                          >
                            <SelectPrimitive.ItemText>Producto</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                          <SelectPrimitive.Item
                            value="SERVICIO"
                            className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                          >
                            <SelectPrimitive.ItemText>Servicio</SelectPrimitive.ItemText>
                          </SelectPrimitive.Item>
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Descripción" htmlFor="descripcion">
                    <Input
                      id="descripcion"
                      value={form.descripcion}
                      onChange={(event) => updateField("descripcion", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Nombre o descripción del producto/servicio"
                      required
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Clasificación</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Grupo" htmlFor="id_grupo">
                  <SelectPrimitive.Root
                    value={form.id_grupo === 0 ? undefined : form.id_grupo.toString()}
                    onValueChange={(val) => updateField("id_grupo", Number(val))}
                    onOpenChange={(open) => {
                      if (!open) setGrupoSearch("");
                    }}
                    disabled={loadingGrupos}
                  >
                    <SelectPrimitive.Trigger
                      id="id_grupo"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                    >
                      <SelectPrimitive.Value placeholder={loadingGrupos ? "Cargando..." : "Selecciona un grupo..."} />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <div className="p-2">
                          <input
                            type="search"
                            value={grupoSearch}
                            onChange={(event) => setGrupoSearch(event.target.value)}
                            placeholder="Buscar grupo..."
                            className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                            disabled={loadingGrupos}
                          />
                        </div>
                        <SelectPrimitive.Viewport className="max-h-56 overflow-y-auto p-1">
                          {gruposFiltrados.map((grupo) => (
                            <SelectPrimitive.Item
                              key={grupo.id}
                              value={grupo.id.toString()}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{grupo.nombre}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                          {gruposFiltrados.length === 0 && !loadingGrupos && (
                            <div className="px-3 py-2 text-xs text-slate-400">
                              Sin resultados.
                            </div>
                          )}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <Field label="IVA" htmlFor="id_iva">
                  <SelectPrimitive.Root
                    value={form.id_iva === 0 ? undefined : form.id_iva.toString()}
                    onValueChange={(val) => updateField("id_iva", Number(val))}
                    disabled={loadingIva}
                  >
                    <SelectPrimitive.Trigger
                      id="id_iva"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
                    >
                      <SelectPrimitive.Value placeholder={loadingIva ? "Cargando..." : "Selecciona IVA..."} />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <SelectPrimitive.Viewport className="p-1">
                          {codigosIva.map((iva) => (
                            <SelectPrimitive.Item
                              key={iva.id}
                              value={iva.id.toString()}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{iva.nombre} ({iva.porcentaje}%)</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Precio y Unidad</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Unidad de Medida" htmlFor="unidad_medida">
                  <SelectPrimitive.Root
                    value={form.unidad_medida || undefined}
                    onValueChange={(val) => updateField("unidad_medida", val)}
                    onOpenChange={(open) => {
                      if (!open) setUnidadSearch("");
                    }}
                  >
                    <SelectPrimitive.Trigger
                      id="unidad_medida"
                      className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                    >
                      <SelectPrimitive.Value placeholder="Selecciona una unidad..." />
                      <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </SelectPrimitive.Icon>
                    </SelectPrimitive.Trigger>
                    <SelectPrimitive.Portal>
                      <SelectPrimitive.Content
                        className="z-50 min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                        position="popper"
                        sideOffset={4}
                      >
                        <div className="p-2">
                          <input
                            type="search"
                            value={unidadSearch}
                            onChange={(event) => setUnidadSearch(event.target.value)}
                            placeholder="Buscar unidad..."
                            className="h-8 w-full rounded-md border border-slate-200 px-2 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                          />
                        </div>
                        <SelectPrimitive.Viewport className="max-h-56 overflow-y-auto p-1">
                          {unidadesFiltradas.map((unidad) => (
                            <SelectPrimitive.Item
                              key={unidad.value}
                              value={unidad.value}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{unidad.label}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                          {unidadesFiltradas.length === 0 && (
                            <div className="px-3 py-2 text-xs text-slate-400">
                              Sin resultados.
                            </div>
                          )}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <Field label="Precio" htmlFor="precio">
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio}
                    onChange={(event) => updateField("precio", Number(event.target.value))}
                    className="bg-white shadow-none placeholder:text-slate-300"
                    placeholder="0.00"
                    required
                  />
                </Field>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-700">¿Aplica ICE?</span>
                  <span className="text-xs text-slate-500">Impuesto a los Consumos Especiales</span>
                </div>
                <Switch
                  checked={form.tiene_ice}
                  onCheckedChange={(checked) => updateField("tiene_ice", checked)}
                />
              </div>

              {form.tiene_ice && (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Porcentaje ICE" htmlFor="porcentaje_ice">
                      <Input
                        id="porcentaje_ice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.porcentaje_ice ?? ""}
                        onChange={(event) => updateField("porcentaje_ice", Number(event.target.value))}
                        className="bg-white shadow-none placeholder:text-slate-300"
                        placeholder="Ej: 5, 10, 15"
                      />
                    </Field>
                    <Field label="Código SRI ICE" htmlFor="codigo_ice">
                      <SelectPrimitive.Root
                        value={form.codigo_ice || undefined}
                        onValueChange={(val) => {
                          updateField("codigo_ice", val);
                          updateField("porcentaje_ice", iceSRIMap[val] ?? 0);
                        }}
                      >
                        <SelectPrimitive.Trigger
                          id="codigo_ice"
                          className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                        >
                          <SelectPrimitive.Value placeholder="Selecciona un código SRI..." />
                          <SelectPrimitive.Icon>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </SelectPrimitive.Icon>
                        </SelectPrimitive.Trigger>
                        <SelectPrimitive.Portal>
                          <SelectPrimitive.Content
                            className="z-50 min-w-[320px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                            position="popper"
                            sideOffset={4}
                          >
                            <SelectPrimitive.Viewport className="p-1 max-h-52 overflow-y-auto">
                              {iceSRIOptions.map((option) => (
                                <SelectPrimitive.Item
                                  key={option.value}
                                  value={option.value}
                                  className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                >
                                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                              ))}
                            </SelectPrimitive.Viewport>
                          </SelectPrimitive.Content>
                        </SelectPrimitive.Portal>
                      </SelectPrimitive.Root>
                    </Field>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-700">¿Aplica IRBPNR?</span>
                  <span className="text-xs text-slate-500">Impuesto Redimible a las Botellas Plásticas No Retornables</span>
                </div>
                <Switch
                  checked={form.tiene_irbpnr}
                  onCheckedChange={(checked) => updateField("tiene_irbpnr", checked)}
                />
              </div>

              {form.tiene_irbpnr && (
                <Field label="Valor Unitario IRBPNR" htmlFor="valor_unitario_irbpnr">
                  <Input
                    id="valor_unitario_irbpnr"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={form.valor_unitario_irbpnr ?? ""}
                    onChange={(event) => updateField("valor_unitario_irbpnr", Number(event.target.value))}
                    className="bg-white shadow-none placeholder:text-slate-300"
                    placeholder="Ej: 0.02"
                  />
                </Field>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-4"
              >
                {saving ? "Guardando..." : "Crear producto"}
              </Button>
            </div>
            </form>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
