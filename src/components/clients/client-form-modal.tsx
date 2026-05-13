"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { toast } from "sonner";
import { Building2, ChevronDown, Loader2, Phone, Search, Shield } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Switch } from "@/src/components/ui/switch";
import type { Cliente, ClienteFormInput, ClienteUpdateInput } from "@/src/modules/clients/types/client.types";
import { toClienteFormInput } from "@/src/modules/clients/utils/client-payload.utils";
import { clientService } from "@/src/modules/clients/services/client.service";

const initialForm: ClienteFormInput = {
  tipo_identificacion: "",
  identificacion: "",
  razon_social: "",
  direccion: "",
  telefono: "",
  email: "",
  es_recurrente: false,
};

const tipoIdentificacionOptions = [
  { value: "05", label: "05 - Cedula" },
  { value: "04", label: "04 - RUC" },
  { value: "06", label: "06 - Pasaporte" },
];

const cleanTipoLabel = (label: string) => label.replace(/^\s*\S+\s*-\s*/, "");

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (client: Cliente) => void;
  client?: Cliente | null;
}

export function ClientFormModal({ open, onOpenChange, onSuccess, client }: ClientFormModalProps) {
  const [form, setForm] = useState<ClienteFormInput>(client ? toClienteFormInput(client) : initialForm);
  const [saving, setSaving] = useState(false);
  const [searchingCi, setSearchingCi] = useState(false);
  const editing = !!client;

  const updateField = (name: keyof ClienteFormInput, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBuscarIdentificacion = async () => {
    if (!form.identificacion) {
      toast.error("Ingrese una identificación para buscar");
      return;
    }
    setSearchingCi(true);
    try {
      const found = await clientService.buscarPorIdentificacion(form.identificacion);
      if (found) {
        setForm((prev) => ({
          ...prev,
          tipo_identificacion: found.tipo_identificacion,
          razon_social: found.razon_social,
          direccion: found.direccion || prev.direccion,
          telefono: found.telefono || prev.telefono,
          email: found.email || prev.email,
          es_recurrente: found.es_recurrente,
        }));
        toast.success("Cliente encontrado");
      } else {
        toast.error("No se encontró el cliente con esa identificación");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al buscar cliente");
    } finally {
      setSearchingCi(false);
    }
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);

    try {
      let result: Cliente;
      if (editing && client) {
        const payload: ClienteUpdateInput = {
          razon_social: form.razon_social,
          direccion: form.direccion,
          telefono: form.telefono,
          email: form.email,
          es_recurrente: form.es_recurrente,
        };
        await clientService.updateCliente(client.id, payload);
        result = { ...client, ...payload };
        toast.success("Cliente actualizado.");
      } else {
        result = await clientService.createCliente(form);
        toast.success("Cliente creado.");
      }

      onSuccess?.(result);
      setForm(initialForm);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar el cliente.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(val) => {
      if (!val) setForm(initialForm);
      onOpenChange(val);
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[4px]" />
        <Dialog.Content 
          className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                <Building2 className="h-6 w-6 text-app-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {editing ? "Editar cliente" : "Crear nuevo cliente"}
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {editing
                    ? "Actualiza los datos comerciales del cliente registrado."
                    : "Registra un nuevo cliente para emitir comprobantes y gestionar sus datos de contacto."}
                </Dialog.Description>
              </div>
            </div>
          </div>

          <form className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]" onSubmit={submitForm}>
            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Información comercial</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de identificación" htmlFor="tipo_identificacion">
                  <SelectPrimitive.Root 
                    value={form.tipo_identificacion || undefined} 
                    onValueChange={(val) => updateField("tipo_identificacion", val)}
                  >
                    <SelectPrimitive.Trigger 
                      id="tipo_identificacion"
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
                          {tipoIdentificacionOptions.map((option) => (
                            <SelectPrimitive.Item 
                              key={option.value}
                              value={option.value}
                              className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                            >
                              <SelectPrimitive.ItemText>{cleanTipoLabel(option.label)}</SelectPrimitive.ItemText>
                            </SelectPrimitive.Item>
                          ))}
                        </SelectPrimitive.Viewport>
                      </SelectPrimitive.Content>
                    </SelectPrimitive.Portal>
                  </SelectPrimitive.Root>
                </Field>

                <Field label="Identificación" htmlFor="identificacion">
                  <div className="flex gap-2 items-center">
                    <Input
                      id="identificacion"
                      inputMode="numeric"
                      value={form.identificacion}
                      onChange={(event) => updateField("identificacion", event.target.value)}
                      disabled={editing}
                      className="flex-1 bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Ej: 1712345678"
                    />
                    {!editing && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleBuscarIdentificacion}
                        disabled={searchingCi || !form.identificacion}
                        className="px-3 shrink-0 h-9"
                      >
                        {searchingCi ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      </Button>
                    )}
                  </div>
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Razón social" htmlFor="razon_social">
                    <Input
                      id="razon_social"
                      value={form.razon_social}
                      onChange={(event) => updateField("razon_social", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Nombre o razón social del cliente"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-700">Información de contacto</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Teléfono" htmlFor="telefono">
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(event) => updateField("telefono", event.target.value)}
                    className="bg-white shadow-none placeholder:text-slate-300"
                    placeholder="0991234567"
                  />
                </Field>

                <Field label="Correo electrónico" htmlFor="email">
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    className="bg-white shadow-none placeholder:text-slate-300"
                    placeholder="cliente@empresa.com"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Dirección" htmlFor="direccion">
                    <Input
                      id="direccion"
                      value={form.direccion}
                      onChange={(event) => updateField("direccion", event.target.value)}
                      className="bg-white shadow-none placeholder:text-slate-300"
                      placeholder="Av. Principal 123, Ciudad"
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-700">Cliente recurrente</span>
                  <span className="text-xs text-slate-500">Activa esta opción para priorizar a este cliente en búsquedas y reportes</span>
                </div>
                <Switch
                  checked={form.es_recurrente}
                  onCheckedChange={(checked) => updateField("es_recurrente", checked)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} className="h-10 px-4">
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="h-10 px-4">
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
