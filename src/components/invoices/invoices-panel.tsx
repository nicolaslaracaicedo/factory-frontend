"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, Eye, PlusCircle, Power, Send, Trash2, Search, ChevronLeft, ChevronRight, Copy, FileCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import type {
  FacturaDetalleDraft,
  FacturaFormState,
  FacturaItem,
} from "@/src/modules/invoices/types/invoice.types";
import {
  toFacturaFormState,
} from "@/src/modules/invoices/utils/invoice-payload.utils";
import { invoiceService } from "@/src/modules/invoices/services/invoice.service";
import { clientService } from "@/src/modules/clients/services/client.service";
import type { Cliente } from "@/src/modules/clients/types/client.types";
import { emissionPointService } from "@/src/modules/emission-points/services/emission-point.service";
import type { PuntoEmision } from "@/src/modules/emission-points/types/emission-point.types";
import { productService } from "@/src/modules/products/services/product.service";
import type { Producto } from "@/src/modules/products/types/product.types";

const initialDetail = (): FacturaDetalleDraft => ({
  mode: "CATALOGO",
  id_producto: 0,
  cantidad: 1,
  descuento: 0,
  codigo: "",
  descripcion: "",
  precio_unitario: 0,
  codigo_iva: "",
  porcentaje_iva: 0,
  unidad_medida: "",
  valor_ice: 0,
  valor_irbpnr: 0,
});

const initialForm: FacturaFormState = {
  id_punto_emision: 0,
  id_cliente: 0,
  use_manual_cliente: false,
  cli_identificacion: "",
  cli_razon_social: "",
  cli_direccion: "",
  cli_telefono: "",
  cli_email: "",
  fecha_emision: "",
  forma_pago: "01",
  tipo_pago: "CONTADO",
  dias_plazo: 0,
  observacion: "",
  detalles: [initialDetail()],
  datos_adicionales: [],
};

const estadoFilters = ["TODOS", "BORRADOR", "AUTORIZADO", "RECHAZADA", "INACTIVO"] as const;
const tipoPagoOptions = ["CONTADO", "CREDITO"] as const;
const formaPagoOptions = [
  { value: "01", label: "01 - Efectivo" },
  { value: "19", label: "19 - Tarjeta" },
  { value: "20", label: "20 - Transferencia" },
];

type EstadoFiltro = (typeof estadoFilters)[number];

type TipoPago = (typeof tipoPagoOptions)[number];

interface InvoicesPanelProps {
  showPanel?: boolean;
}

export function InvoicesPanel({ showPanel = true }: InvoicesPanelProps) {
  const [facturas, setFacturas] = useState<FacturaItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [puntos, setPuntos] = useState<PuntoEmision[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EstadoFiltro>("TODOS");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<FacturaItem | null>(null);
  const [detail, setDetail] = useState<FacturaItem | null>(null);
  const [form, setForm] = useState<FacturaFormState>(initialForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [emissionInfoOpen, setEmissionInfoOpen] = useState(false);
  const [emissionData, setEmissionData] = useState<FacturaItem | null>(null);

  const getEstadoColor = (estado?: string) => {
    switch (estado?.toUpperCase()) {
      case "AUTORIZADO": return "bg-emerald-100 text-emerald-700";
      case "RECHAZADA": return "bg-rose-100 text-rose-700";
      case "BORRADOR": return "bg-amber-100 text-amber-700";
      case "INACTIVO": return "bg-rose-100 text-rose-700";
      default: return "bg-sky-100 text-sky-700";
    }
  };

  const filteredFacturas = useMemo(() => {
    let result = facturas;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.numero?.toLowerCase().includes(lower) || 
        f.cliente_nombre?.toLowerCase().includes(lower) ||
        f.cliente_identificacion?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [facturas, searchTerm]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage) || 1;
  const paginatedFacturas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFacturas.slice(start, start + itemsPerPage);
  }, [filteredFacturas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    const loadCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [clientesData, puntosData, productosData] = await Promise.all([
          clientService.listClientes("ACTIVO"),
          emissionPointService.listPuntos("ACTIVO"),
          productService.listProductos("ACTIVO"),
        ]);
        setClientes(clientesData);
        setPuntos(puntosData);
        setProductos(productosData);
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
    const loadFacturas = async () => {
      setLoading(true);
      try {
        const data = await invoiceService.listFacturas();
        const filtered =
          filter === "TODOS"
            ? data
            : data.filter((item) => item.estado?.toUpperCase() === filter);
        setFacturas(filtered);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudieron cargar las facturas.";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    void loadFacturas();
  }, [filter]);

  const refresh = async () => {
    try {
      const data = await invoiceService.listFacturas();
      const filtered =
        filter === "TODOS"
          ? data
          : data.filter((item) => item.estado?.toUpperCase() === filter);
      setFacturas(filtered);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudieron cargar las facturas.";
      toast.error(message);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...initialForm,
      id_punto_emision: puntos[0]?.id ?? 0,
      id_cliente: clientes[0]?.id ?? 0,
      fecha_emision: new Date().toISOString().slice(0, 10),
      detalles: [initialDetail()],
    });
    setModalOpen(true);
  };

  const openEdit = async (factura: FacturaItem) => {
    try {
      const data = await invoiceService.getFactura(factura.id);
      setEditing(data);
      setForm(toFacturaFormState(data));
      setModalOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar la factura.";
      toast.error(message);
    }
  };

  const openDetail = async (factura: FacturaItem) => {
    try {
      const data = await invoiceService.getFactura(factura.id);
      setDetail(data);
      setDetailOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar el detalle.";
      toast.error(message);
    }
  };

  const updateField = (name: keyof FacturaFormState, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateDetail = (index: number, field: keyof FacturaDetalleDraft, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addDetail = () => {
    setForm((prev) => ({
      ...prev,
      detalles: [...prev.detalles, initialDetail()],
    }));
  };

  const removeDetail = (index: number) => {
    setForm((prev) => ({
      ...prev,
      detalles: prev.detalles.filter((_, idx) => idx !== index),
    }));
  };

  const addDatoAdicional = () => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: [...prev.datos_adicionales, { nombre: "", valor: "" }],
    }));
  };

  const updateDatoAdicional = (index: number, field: "nombre" | "valor", value: string) => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: prev.datos_adicionales.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeDatoAdicional = (index: number) => {
    setForm((prev) => ({
      ...prev,
      datos_adicionales: prev.datos_adicionales.filter((_, idx) => idx !== index),
    }));
  };

  const buildPayload = () => {
    const detalles = form.detalles.map((item) =>
      item.mode === "CATALOGO"
        ? {
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            descuento: item.descuento,
          }
        : {
            codigo: item.codigo,
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            descuento: item.descuento,
            codigo_iva: item.codigo_iva,
            porcentaje_iva: item.porcentaje_iva,
            unidad_medida: item.unidad_medida,
            valor_ice: item.valor_ice,
            valor_irbpnr: item.valor_irbpnr,
          }
    );

    const payload = {
      id_punto_emision: form.id_punto_emision,
      id_cliente: form.use_manual_cliente ? undefined : form.id_cliente,
      cli_identificacion: form.use_manual_cliente ? form.cli_identificacion : undefined,
      cli_razon_social: form.use_manual_cliente ? form.cli_razon_social : undefined,
      cli_direccion: form.use_manual_cliente ? form.cli_direccion : undefined,
      cli_telefono: form.use_manual_cliente ? form.cli_telefono : undefined,
      cli_email: form.use_manual_cliente ? form.cli_email : undefined,
      fecha_emision: form.fecha_emision,
      forma_pago: form.forma_pago,
      tipo_pago: form.tipo_pago,
      dias_plazo: form.dias_plazo,
      observacion: form.observacion,
      detalles,
      datos_adicionales: form.datos_adicionales.filter(
        (item) => item.nombre.trim() || item.valor.trim()
      ),
    };

    return payload;
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.id_punto_emision) {
      toast.warning("Selecciona un punto de emisión.");
      return;
    }
    if (!form.use_manual_cliente && !form.id_cliente) {
      toast.warning("Selecciona un cliente.");
      return;
    }
    if (form.detalles.length === 0) {
      toast.warning("Agrega al menos un detalle.");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await invoiceService.updateFactura(editing.id, payload);
        toast.success("Factura actualizada.");
      } else {
        await invoiceService.createFactura(payload);
        toast.success("Factura creada.");
      }
      await refresh();
      setModalOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo guardar la factura.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (factura: FacturaItem) => {
    try {
      await invoiceService.toggleEstado(factura.id);
      await refresh();
      toast.success("Estado actualizado.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar el estado.";
      toast.error(message);
    }
  };

  const emitirFactura = async (factura: FacturaItem) => {
    try {
      const emittedFactura = await invoiceService.emitirFactura(factura.id);
      await refresh();
      toast.success("Factura emitida.");
      setEmissionData(emittedFactura);
      setEmissionInfoOpen(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo emitir la factura.";
      toast.error(message);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado al portapapeles.`);
    } catch {
      toast.error(`No se pudo copiar ${label}.`);
    }
  };

  const deleteFactura = async (factura: FacturaItem) => {
    try {
      await invoiceService.deleteFactura(factura.id);
      await refresh();
      toast.success("Factura eliminada.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo eliminar la factura.";
      toast.error(message);
    }
  };

  const getClienteLabel = (clienteId?: number, fallback?: string) => {
    if (!clienteId) return fallback || "-";
    const cliente = clientes.find((item) => item.id === clienteId);
    return cliente?.razon_social || fallback || "-";
  };

  const getProductoLabel = (productoId?: number, fallback?: string) => {
    if (!productoId) return fallback || "-";
    const producto = productos.find((item) => item.id === productoId);
    return producto?.descripcion || fallback || "-";
  };

  const getPuntoLabel = (puntoId?: number) => {
    const punto = puntos.find((item) => item.id === puntoId);
    return punto ? `${punto.codigo} - ${punto.descripcion}` : "-";
  };

  if (!showPanel) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar factura..."
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
          <Button onClick={openCreate} disabled={loadingCatalogs}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Cargando facturas...</p>
      ) : filteredFacturas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-8 text-center">
          <p className="text-sm text-slate-600">No hay facturas para este filtro.</p>
          <Button className="mt-3" onClick={openCreate} disabled={loadingCatalogs}>
            Crear factura
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Factura</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFacturas.map((factura) => (
                <tr key={factura.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {factura.numero || `Factura #${factura.id}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getPuntoLabel(factura.id_punto_emision)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">
                      {getClienteLabel(factura.id_cliente, factura.cliente_nombre)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {factura.cliente_identificacion || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{factura.fecha_emision || "-"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${getEstadoColor(factura.estado)}`}
                    >
                      {factura.estado || "ACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => openDetail(factura)}>
                        <Eye className="mr-1 h-4 w-4" />
                        Ver
                      </Button>
                      {factura.estado?.toUpperCase() === "BORRADOR" && (
                        <>
                          <Button variant="secondary" onClick={() => openEdit(factura)}>
                            <Edit className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => deleteFactura(factura)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            Eliminar
                          </Button>
                        </>
                      )}
                      {factura.estado?.toUpperCase() !== "AUTORIZADO" && (
                        <Button className="bg-[var(--app-primary)] text-white hover:opacity-90" onClick={() => emitirFactura(factura)}>
                          <Send className="mr-1 h-4 w-4" />
                          Emitir
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <span className="text-sm text-slate-500">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredFacturas.length)} de {filteredFacturas.length}
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
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(95vw,980px)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              {editing ? "Editar factura" : "Nueva factura borrador"}
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Completa el encabezado y los detalles de la factura.
            </Dialog.Description>

            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <section className="grid gap-4 md:grid-cols-3">
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

                <Field label="Fecha de emisión" htmlFor="fecha_emision">
                  <Input
                    id="fecha_emision"
                    type="date"
                    value={form.fecha_emision}
                    onChange={(event) => updateField("fecha_emision", event.target.value)}
                  />
                </Field>

                <Field label="Forma de pago" htmlFor="forma_pago">
                  <Select
                    id="forma_pago"
                    value={form.forma_pago}
                    onChange={(event) => updateField("forma_pago", event.target.value)}
                  >
                    {formaPagoOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Tipo de pago" htmlFor="tipo_pago">
                  <Select
                    id="tipo_pago"
                    value={form.tipo_pago as TipoPago}
                    onChange={(event) => updateField("tipo_pago", event.target.value)}
                  >
                    {tipoPagoOptions.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Días de plazo" htmlFor="dias_plazo">
                  <Input
                    id="dias_plazo"
                    type="number"
                    min={0}
                    value={form.dias_plazo}
                    onChange={(event) => updateField("dias_plazo", Number(event.target.value))}
                  />
                </Field>

                <Field label="Observación" htmlFor="observacion">
                  <Input
                    id="observacion"
                    value={form.observacion}
                    onChange={(event) => updateField("observacion", event.target.value)}
                  />
                </Field>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Cliente</h4>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-sky-700"
                      checked={form.use_manual_cliente}
                      onChange={(event) => updateField("use_manual_cliente", event.target.checked)}
                    />
                    Ingresar cliente manual
                  </label>
                </div>

                {!form.use_manual_cliente ? (
                  <div className="mt-3">
                    <Field label="Cliente" htmlFor="id_cliente">
                      <Select
                        id="id_cliente"
                        value={String(form.id_cliente)}
                        onChange={(event) => updateField("id_cliente", Number(event.target.value))}
                        disabled={loadingCatalogs}
                      >
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.razon_social}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                ) : (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Identificación" htmlFor="cli_identificacion">
                      <Input
                        id="cli_identificacion"
                        value={form.cli_identificacion}
                        onChange={(event) => updateField("cli_identificacion", event.target.value)}
                      />
                    </Field>
                    <Field label="Razón social" htmlFor="cli_razon_social">
                      <Input
                        id="cli_razon_social"
                        value={form.cli_razon_social}
                        onChange={(event) => updateField("cli_razon_social", event.target.value)}
                      />
                    </Field>
                    <Field label="Dirección" htmlFor="cli_direccion">
                      <Input
                        id="cli_direccion"
                        value={form.cli_direccion}
                        onChange={(event) => updateField("cli_direccion", event.target.value)}
                      />
                    </Field>
                    <Field label="Teléfono" htmlFor="cli_telefono">
                      <Input
                        id="cli_telefono"
                        value={form.cli_telefono}
                        onChange={(event) => updateField("cli_telefono", event.target.value)}
                      />
                    </Field>
                    <Field label="Correo" htmlFor="cli_email">
                      <Input
                        id="cli_email"
                        type="email"
                        value={form.cli_email}
                        onChange={(event) => updateField("cli_email", event.target.value)}
                      />
                    </Field>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Detalles</h4>
                  <Button type="button" variant="secondary" onClick={addDetail}>
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Agregar detalle
                  </Button>
                </div>

                <div className="mt-3 space-y-4">
                  {form.detalles.map((detalle, index) => (
                    <div key={`detalle-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Select
                          value={detalle.mode}
                          onChange={(event) =>
                            updateDetail(
                              index,
                              "mode",
                              event.target.value as "CATALOGO" | "MANUAL"
                            )
                          }
                        >
                          <option value="CATALOGO">Con producto</option>
                          <option value="MANUAL">Manual</option>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDetail(index)}
                          disabled={form.detalles.length === 1}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Quitar
                        </Button>
                      </div>

                      {detalle.mode === "CATALOGO" ? (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Field label="Producto" htmlFor={`producto-${index}`}>
                            <Select
                              id={`producto-${index}`}
                              value={String(detalle.id_producto)}
                              onChange={(event) =>
                                updateDetail(index, "id_producto", Number(event.target.value))
                              }
                              disabled={loadingCatalogs}
                            >
                              <option value="0">Selecciona producto</option>
                              {productos.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                  {producto.descripcion}
                                </option>
                              ))}
                            </Select>
                          </Field>
                          <Field label="Cantidad" htmlFor={`cantidad-${index}`}>
                            <Input
                              id={`cantidad-${index}`}
                              type="number"
                              min={1}
                              value={detalle.cantidad}
                              onChange={(event) =>
                                updateDetail(index, "cantidad", Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field label="Descuento" htmlFor={`descuento-cat-${index}`}>
                            <Input
                              id={`descuento-cat-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.descuento}
                              onChange={(event) =>
                                updateDetail(index, "descuento", Number(event.target.value))
                              }
                            />
                          </Field>
                        </div>
                      ) : (
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <Field label="Código" htmlFor={`codigo-${index}`}>
                            <Input
                              id={`codigo-${index}`}
                              value={detalle.codigo}
                              onChange={(event) => updateDetail(index, "codigo", event.target.value)}
                            />
                          </Field>
                          <Field label="Descripción" htmlFor={`descripcion-${index}`}>
                            <Input
                              id={`descripcion-${index}`}
                              value={detalle.descripcion}
                              onChange={(event) =>
                                updateDetail(index, "descripcion", event.target.value)
                              }
                            />
                          </Field>
                          <Field label="Cantidad" htmlFor={`cant-manual-${index}`}>
                            <Input
                              id={`cant-manual-${index}`}
                              type="number"
                              min={1}
                              value={detalle.cantidad}
                              onChange={(event) =>
                                updateDetail(index, "cantidad", Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field label="Precio unitario" htmlFor={`precio-${index}`}>
                            <Input
                              id={`precio-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.precio_unitario}
                              onChange={(event) =>
                                updateDetail(
                                  index,
                                  "precio_unitario",
                                  Number(event.target.value)
                                )
                              }
                            />
                          </Field>
                          <Field label="Descuento" htmlFor={`descuento-man-${index}`}>
                            <Input
                              id={`descuento-man-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.descuento}
                              onChange={(event) =>
                                updateDetail(index, "descuento", Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field label="Código IVA" htmlFor={`codiva-${index}`}>
                            <Input
                              id={`codiva-${index}`}
                              value={detalle.codigo_iva}
                              onChange={(event) =>
                                updateDetail(index, "codigo_iva", event.target.value)
                              }
                            />
                          </Field>
                          <Field label="Porcentaje IVA" htmlFor={`porciva-${index}`}>
                            <Input
                              id={`porciva-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.porcentaje_iva}
                              onChange={(event) =>
                                updateDetail(index, "porcentaje_iva", Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field label="Unidad de medida" htmlFor={`unidad-${index}`}>
                            <Input
                              id={`unidad-${index}`}
                              value={detalle.unidad_medida}
                              onChange={(event) =>
                                updateDetail(index, "unidad_medida", event.target.value)
                              }
                            />
                          </Field>
                          <Field label="Valor ICE" htmlFor={`ice-${index}`}>
                            <Input
                              id={`ice-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.valor_ice}
                              onChange={(event) =>
                                updateDetail(index, "valor_ice", Number(event.target.value))
                              }
                            />
                          </Field>
                          <Field label="Valor IRBPNR" htmlFor={`irbpnr-${index}`}>
                            <Input
                              id={`irbpnr-${index}`}
                              type="number"
                              min={0}
                              step="0.01"
                              value={detalle.valor_irbpnr}
                              onChange={(event) =>
                                updateDetail(index, "valor_irbpnr", Number(event.target.value))
                              }
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800">Datos adicionales</h4>
                  <Button type="button" variant="secondary" onClick={addDatoAdicional}>
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Agregar dato
                  </Button>
                </div>

                {form.datos_adicionales.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">No hay datos adicionales.</p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {form.datos_adicionales.map((item, index) => (
                      <div key={`dato-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                        <Input
                          placeholder="Nombre"
                          value={item.nombre}
                          onChange={(event) =>
                            updateDatoAdicional(index, "nombre", event.target.value)
                          }
                        />
                        <Input
                          placeholder="Valor"
                          value={item.valor}
                          onChange={(event) =>
                            updateDatoAdicional(index, "valor", event.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeDatoAdicional(index)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Quitar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
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

      <Dialog.Root open={detailOpen} onOpenChange={setDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Detalle de factura
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Informaci&oacute;n completa de la factura seleccionada.
            </Dialog.Description>

            {detail ? (
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold">Factura:</span> {detail.numero || detail.id}
                  </div>
                  <div>
                    <span className="font-semibold">Fecha:</span> {detail.fecha_emision || "-"}
                  </div>
                  <div>
                    <span className="font-semibold">Cliente:</span>{" "}
                    {getClienteLabel(detail.id_cliente, detail.cliente_nombre)}
                  </div>
                  <div>
                    <span className="font-semibold">Estado:</span> {detail.estado || "-"}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Detalles</p>
                  {detail.detalles?.length ? (
                    <ul className="mt-2 space-y-1">
                      {detail.detalles.map((item, idx) => (
                        <li key={`detalle-${idx}`}>
                          {getProductoLabel(item.id_producto, item.descripcion)} - Cant: {item.cantidad}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">Sin detalles.</p>
                  )}
                </div>

                <div>
                  <p className="font-semibold text-slate-800">Datos adicionales</p>
                  {detail.datos_adicionales?.length ? (
                    <ul className="mt-2 space-y-1">
                      {detail.datos_adicionales.map((item, idx) => (
                        <li key={`dato-${idx}`}>
                          {item.nombre}: {item.valor}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500">Sin datos adicionales.</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Cargando detalle...</p>
            )}

            <div className="mt-5 flex justify-end">
              <Button variant="secondary" type="button" onClick={() => setDetailOpen(false)}>
                Cerrar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={emissionInfoOpen} onOpenChange={setEmissionInfoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-semibold text-slate-900">
                  Factura Emitida
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-600">
                  La factura ha sido autorizada por el SRI.
                </Dialog.Description>
              </div>
            </div>

            {emissionData && (
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-emerald-800">Clave de acceso:</span>
                    <Button
                      variant="secondary"
                      onClick={() => copyToClipboard(emissionData.clave_acceso || "", "Clave de acceso")}
                      disabled={!emissionData.clave_acceso}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-emerald-700">
                    {emissionData.clave_acceso || "No disponible"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Número de comprobante:</span>
                    <p className="mt-1 font-semibold text-slate-800">{emissionData.numero_comprobante || emissionData.numero || "-"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Número de autorización:</span>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="truncate font-mono text-xs text-slate-700">{emissionData.numero_autorizacion || "-"}</p>
                      {emissionData.numero_autorizacion && (
                        <Button variant="ghost" className="h-auto p-1" onClick={() => copyToClipboard(emissionData.numero_autorizacion || "", "Número de autorización")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado:</span>
                    <p className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                      {emissionData.estado || "AUTORIZADO"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha de autorización:</span>
                    <p className="mt-1 text-sm text-slate-700">{emissionData.fecha_autorizacion ? new Date(emissionData.fecha_autorizacion).toLocaleString() : "-"}</p>
                  </div>
                </div>

                {emissionData.pdf_url && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documento PDF:</span>
                    <div className="mt-2">
                      <a
                        href={emissionData.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
                      >
                        Descargar PDF
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" type="button" onClick={() => setEmissionInfoOpen(false)}>
                Cerrar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
