"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save, Sparkles, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";
import type { Company, CompanyFormInput } from "@/src/modules/company/types/company.types";
import { toCompanyFormInput } from "@/src/modules/company/utils/company-payload.utils";

const initialForm: CompanyFormInput = {
  ruc: "",
  identificacion: "",
  logo: null,
  razon_social: "",
  nombre_comercial: "",
  direccion_matriz: "",
  telefono: "",
  email: "",
  color_primario: "",
  color_secundario: "",
  color_acento: "",
  fuente_principal: "",
  contribuyente_especial: false,
  nro_contribuyente_esp: "",
  obligado_contabilidad: false,
  agente_retencion: false,
  rimpe: false,
  regimen: "",
  ambiente: 1,
};

interface ToggleProps {
  name: keyof Pick<
    CompanyFormInput,
    | "contribuyente_especial"
    | "obligado_contabilidad"
    | "agente_retencion"
    | "rimpe"
  >;
  label: string;
  checked: boolean;
  onChange: (name: ToggleProps["name"], value: boolean) => void;
}

function ToggleField({ name, label, checked, onChange }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 accent-sky-700"
        checked={checked}
        onChange={(event) => onChange(name, event.target.checked)}
      />
      <span className="font-medium text-slate-700">{label}</span>
    </label>
  );
}

const wizardTotalSteps = 4;
const fontOptions = ["Manrope", "Roboto", "Inter", "Poppins"] as const;
const regimenOptions = [
  "GENERAL",
  "RIMPE_NEGOCIO_POPULAR",
  "RIMPE_EMPRENDEDOR",
] as const;
const ambienteOptions = [
  { value: 1, label: "Pruebas" },
  { value: 2, label: "Producción" },
] as const;

interface CompanySettingsPanelProps {
  showPanel?: boolean;
  initialCompany?: Company | null;
}

const hasCoreCompanyData = (form: CompanyFormInput): boolean => {
  return Boolean(form.ruc.trim() && form.razon_social.trim());
};

const normalizeHex = (value: string, fallback = "#1976D2") => {
  if (!value) return fallback;
  return value.startsWith("#") ? value : fallback;
};

export function CompanySettingsPanel({ showPanel = true, initialCompany = null }: CompanySettingsPanelProps) {
  const [form, setForm] = useState<CompanyFormInput>(initialForm);
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [loading, setLoading] = useState(!initialCompany);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const openEditModal = () => {
    if (company) {
      const mapped = toCompanyFormInput(company);
      setForm(mapped);
      setLogoPreview(company.logo?.trim() ? company.logo : logoPreview);
    } else {
      setForm(initialForm);
      setLogoPreview(null);
    }
    setEditOpen(true);
  };

  useEffect(() => {
    if (!initialCompany) return;
    setCompany(initialCompany);
    const mapped = toCompanyFormInput(initialCompany);
    setForm(mapped);
    // Wizard removed from auto-open
    setLogoPreview(initialCompany.logo?.trim() ? initialCompany.logo : null);
    setLoading(false);
  }, [initialCompany]);

  useEffect(() => {
    if (initialCompany) return;

    const loadCompany = async () => {
      setLoading(true);
      try {
        const response = await companyService.getCompany();
        setCompany(response);
        const mapped = toCompanyFormInput(response);
        setForm(mapped);
        // Wizard removed from auto-open
        setLogoPreview(response.logo?.trim() ? response.logo : null);
      } catch {
        setCompany(null);
        setForm(initialForm);
        // Wizard removed - no auto-open on error
      } finally {
        setLoading(false);
      }
    };

    void loadCompany();
  }, [initialCompany]);

  useEffect(() => {
    if (!form.logo) return;

    const nextPreview = URL.createObjectURL(form.logo);
    setLogoPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [form.logo]);

  const updateField = (name: keyof CompanyFormInput, value: string | number | File | null) => {
    setForm((prev) => {
      const nextState: CompanyFormInput = {
        ...prev,
        [name]: value,
      } as CompanyFormInput;

      if (name === "regimen") {
        const regimenValue = String(value || "").toUpperCase();
        nextState.regimen = regimenValue;
        const isRimpe = regimenValue.startsWith("RIMPE");
        nextState.rimpe = isRimpe;
      }

      return nextState;
    });
  };

  const updateToggle = (
    name: ToggleProps["name"],
    value: boolean
  ) => {
    setForm((prev) => {
      const nextState: CompanyFormInput = {
        ...prev,
        [name]: value,
      } as CompanyFormInput;

      if (name === "rimpe" && value) {
        nextState.regimen = "RIMPE_NEGOCIO_POPULAR";
      }

      if (name === "rimpe" && !value) {
        nextState.regimen = "GENERAL";
      }

      if (name === "contribuyente_especial" && !value) {
        nextState.nro_contribuyente_esp = "";
      }

      return nextState;
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveCompany();
  };

  const buildPayload = (): CompanyFormInput => {
    const normalized: CompanyFormInput = {
      ...form,
      color_primario: normalizeHex(form.color_primario),
      color_secundario: normalizeHex(form.color_secundario, "#0EA5E9"),
      color_acento: normalizeHex(form.color_acento, "#22C55E"),
      regimen: form.rimpe
        ? form.regimen.startsWith("RIMPE")
          ? form.regimen
          : "RIMPE_NEGOCIO_POPULAR"
        : "GENERAL",
      nro_contribuyente_esp: form.contribuyente_especial
        ? form.nro_contribuyente_esp
        : "",
    };

    return normalized;
  };

  const saveCompany = async () => {
    setSaving(true);

    try {
      const updated = await companyService.updateCompany(buildPayload());
      const persistedLogo = updated.logo?.trim()
        ? updated.logo
        : company?.logo?.trim()
          ? company.logo
          : logoPreview;
      const mapped = toCompanyFormInput(updated);
      setForm((prev) => ({
        ...prev,
        ...mapped,
        ruc: mapped.ruc || prev.ruc,
        identificacion: mapped.identificacion || prev.identificacion,
        logo: null,
      }));
      setCompany({ ...updated, logo: persistedLogo || "" });
      setLogoPreview(persistedLogo || null);
      applyCompanyTheme(updated);
      toast.success("Datos de empresa actualizados.");
      setEditOpen(false);
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo actualizar la empresa.";
      toast.error(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goNextWizardStep = async () => {
    if (wizardStep === 1) {
      if (!form.razon_social.trim() || !form.nombre_comercial.trim() || !form.direccion_matriz.trim()) {
        toast.warning("Completa razón social, nombre comercial y dirección matriz.");
        return;
      }
    }

    if (wizardStep === 2) {
      if (!form.email.trim()) {
        toast.warning("Ingresa un correo para contacto empresarial.");
        return;
      }
    }

    if (wizardStep < wizardTotalSteps) {
      setWizardStep((prev) => prev + 1);
      return;
    }

    const ok = await saveCompany();
    if (ok) {
      setWizardOpen(false);
    }
  };


  const progress = Math.round((wizardStep / wizardTotalSteps) * 100);

  useEffect(() => {
    applyCompanyTheme({
      color_primario: normalizeHex(form.color_primario),
      color_secundario: normalizeHex(form.color_secundario, "#0EA5E9"),
      color_acento: normalizeHex(form.color_acento, "#22C55E"),
      fuente_principal: form.fuente_principal,
    });
  }, [form.color_primario, form.color_secundario, form.color_acento, form.fuente_principal]);

  return (
    <>
      {showPanel ? (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500">Cargando datos de empresa...</p>
          ) : company ? (
            <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">Datos de empresa</h4>
                  <p className="text-xs text-slate-500">Resumen de la configuracion actual.</p>
                </div>
                <Button type="button" variant="secondary" onClick={openEditModal}>
                  Editar datos
                </Button>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
                <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-3">
                  {company.logo ? (
                    <img
                      src={company.logo}
                      alt="Logo de empresa"
                      className="h-16 w-16 rounded-lg object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Sin logo</span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Razón social</p>
                    <p className="text-sm text-slate-800">{company.razon_social || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Nombre comercial</p>
                    <p className="text-sm text-slate-800">{company.nombre_comercial || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">RUC</p>
                    <p className="text-sm text-slate-800">{company.ruc || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Identificación</p>
                    <p className="text-sm text-slate-800">{company.identificacion || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Correo</p>
                    <p className="text-sm text-slate-800">{company.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Teléfono</p>
                    <p className="text-sm text-slate-800">{company.telefono || "-"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-500">Dirección matriz</p>
                    <p className="text-sm text-slate-800">{company.direccion_matriz || "-"}</p>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
              <p className="text-sm text-slate-600">
                Aún no hay datos de empresa. Configura la información para comenzar.
              </p>
              <Button className="mt-3" type="button" onClick={openEditModal}>
                Configurar empresa
              </Button>
            </section>
          )}
        </div>
      ) : null}

      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,860px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:p-5 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Editar datos de empresa
            </Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-slate-600">
              Actualiza la informacion fiscal, identidad y personalizacion visual.
            </Dialog.Description>

            <div className="mt-4 max-h-[72vh] overflow-y-auto pr-1">
              <form className="space-y-3" onSubmit={onSubmit}>
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  1. Información general e identidad
                </h4>
                <div className="mt-3 grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div>
                    <label
                      htmlFor="logo"
                      className="flex h-full min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 text-center text-xs text-slate-500"
                    >
                      {logoPreview ? (
                        <div className="flex w-full flex-col items-center gap-2">
                          <img
                            src={logoPreview}
                            alt="Logo actual"
                            className="h-20 w-20 rounded-xl object-contain"
                          />
                          <span className="text-xs font-medium text-slate-600">
                            Cambiar logo
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                            Logo
                          </span>
                          <span className="text-sm font-medium text-slate-700">
                            Arrastra o selecciona
                          </span>
                          <span className="text-xs text-slate-500">PNG o JPG</span>
                        </>
                      )}
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          updateField("logo", event.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Razón social" htmlFor="razon_social">
                        <Input
                          id="razon_social"
                          value={form.razon_social}
                          onChange={(event) =>
                            updateField("razon_social", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Nombre comercial" htmlFor="nombre_comercial">
                        <Input
                          id="nombre_comercial"
                          value={form.nombre_comercial}
                          onChange={(event) =>
                            updateField("nombre_comercial", event.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="RUC" htmlFor="ruc">
                        <Input
                          id="ruc"
                          inputMode="numeric"
                          value={form.ruc}
                          onChange={(event) => updateField("ruc", event.target.value)}
                        />
                      </Field>

                      <Field label="Identificación" htmlFor="identificacion">
                        <Input
                          id="identificacion"
                          inputMode="numeric"
                          value={form.identificacion}
                          onChange={(event) =>
                            updateField("identificacion", event.target.value)
                          }
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Correo electrónico" htmlFor="email">
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(event) => updateField("email", event.target.value)}
                        />
                      </Field>

                      <Field label="Teléfono" htmlFor="telefono">
                        <Input
                          id="telefono"
                          value={form.telefono}
                          onChange={(event) => updateField("telefono", event.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <Field label="Dirección matriz" htmlFor="direccion_matriz">
                    <Textarea
                      id="direccion_matriz"
                      value={form.direccion_matriz}
                      onChange={(event) =>
                        updateField("direccion_matriz", event.target.value)
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  2. Configuración fiscal
                </h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <Field label="Régimen" htmlFor="regimen">
                    <Select
                      id="regimen"
                      value={form.regimen}
                      onChange={(event) => updateField("regimen", event.target.value)}
                      disabled={form.rimpe}
                    >
                      <option value="">Selecciona régimen</option>
                      {regimenOptions.map((regimen) => (
                        <option key={regimen} value={regimen}>
                          {regimen.replace(/_/g, " ")}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Ambiente" htmlFor="ambiente">
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      {ambienteOptions.map((option) => (
                        <label key={option.value} className="inline-flex items-center gap-2">
                          <input
                            type="radio"
                            name="ambiente"
                            value={option.value}
                            checked={form.ambiente === option.value}
                            onChange={() => updateField("ambiente", option.value)}
                          />
                          <span className="text-sm text-slate-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <ToggleField
                    name="obligado_contabilidad"
                    label="Obligado a contabilidad"
                    checked={form.obligado_contabilidad}
                    onChange={updateToggle}
                  />
                  <ToggleField
                    name="agente_retencion"
                    label="Agente de retención"
                    checked={form.agente_retencion}
                    onChange={updateToggle}
                  />
                  <ToggleField
                    name="rimpe"
                    label="RIMPE"
                    checked={form.rimpe}
                    onChange={updateToggle}
                  />
                  <ToggleField
                    name="contribuyente_especial"
                    label="Contribuyente especial"
                    checked={form.contribuyente_especial}
                    onChange={updateToggle}
                  />
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Nro. contribuyente especial" htmlFor="nro_contribuyente_esp">
                    <Input
                      id="nro_contribuyente_esp"
                      type="number"
                      min={0}
                      disabled={!form.contribuyente_especial}
                      value={form.nro_contribuyente_esp}
                      onChange={(event) =>
                        updateField("nro_contribuyente_esp", event.target.value)
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  3. Personalización y estilo
                </h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  <Field label="Color primario" htmlFor="color_primario">
                    <Input
                      id="color_primario"
                      type="color"
                      value={normalizeHex(form.color_primario)}
                      onChange={(event) => updateField("color_primario", event.target.value)}
                    />
                  </Field>

                  <Field label="Color secundario" htmlFor="color_secundario">
                    <Input
                      id="color_secundario"
                      type="color"
                      value={normalizeHex(form.color_secundario, "#0EA5E9")}
                      onChange={(event) => updateField("color_secundario", event.target.value)}
                    />
                  </Field>

                  <Field label="Color acento" htmlFor="color_acento">
                    <Input
                      id="color_acento"
                      type="color"
                      value={normalizeHex(form.color_acento, "#22C55E")}
                      onChange={(event) => updateField("color_acento", event.target.value)}
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Tipografía" htmlFor="fuente_principal">
                    <Select
                      id="fuente_principal"
                      value={form.fuente_principal}
                      onChange={(event) =>
                        updateField("fuente_principal", event.target.value)
                      }
                    >
                      <option value="">Selecciona una fuente</option>
                      {fontOptions.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </section>

              <div className="flex justify-end gap-2 pb-1">
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={wizardOpen} onOpenChange={setWizardOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                <Dialog.Title className="sr-only">Configuración inicial de empresa</Dialog.Title>
                <header className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                      <Sparkles className="h-3.5 w-3.5" />
                      Configuración inicial
                    </p>
                    <h4 className="mt-2 text-xl font-bold text-slate-900">
                      Cuéntanos sobre tu empresa
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      Paso {wizardStep} de {wizardTotalSteps}. Te guiamos en menos de 2 minutos.
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </Dialog.Close>
                </header>

                <div className="mb-6 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-sky-600 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="space-y-4">
                  {wizardStep === 1 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Razón social" htmlFor="wizard-razon-social">
                        <Input
                          id="wizard-razon-social"
                          value={form.razon_social}
                          onChange={(event) => updateField("razon_social", event.target.value)}
                        />
                      </Field>

                      <Field label="Nombre comercial" htmlFor="wizard-nombre-comercial">
                        <Input
                          id="wizard-nombre-comercial"
                          value={form.nombre_comercial}
                          onChange={(event) =>
                            updateField("nombre_comercial", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="RUC" htmlFor="wizard-ruc">
                        <Input
                          id="wizard-ruc"
                          inputMode="numeric"
                          value={form.ruc}
                          onChange={(event) => updateField("ruc", event.target.value)}
                        />
                      </Field>

                      <Field label="Identificación" htmlFor="wizard-identificacion">
                        <Input
                          id="wizard-identificacion"
                          inputMode="numeric"
                          value={form.identificacion}
                          onChange={(event) =>
                            updateField("identificacion", event.target.value)
                          }
                        />
                      </Field>

                      <Field label="Dirección matriz" htmlFor="wizard-direccion-matriz">
                        <Textarea
                          id="wizard-direccion-matriz"
                          value={form.direccion_matriz}
                          onChange={(event) =>
                            updateField("direccion_matriz", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  ) : null}

                  {wizardStep === 2 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Teléfono" htmlFor="wizard-telefono">
                        <Input
                          id="wizard-telefono"
                          value={form.telefono}
                          onChange={(event) => updateField("telefono", event.target.value)}
                        />
                      </Field>

                      <Field label="Correo electrónico" htmlFor="wizard-email">
                        <Input
                          id="wizard-email"
                          type="email"
                          value={form.email}
                          onChange={(event) => updateField("email", event.target.value)}
                        />
                      </Field>

                      <Field label="Ambiente" htmlFor="wizard-ambiente">
                        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                          {ambienteOptions.map((option) => (
                            <label
                              key={option.value}
                              className="inline-flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name="wizard-ambiente"
                                value={option.value}
                                checked={form.ambiente === option.value}
                                onChange={() => updateField("ambiente", option.value)}
                              />
                              <span className="text-sm text-slate-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </Field>
                    </div>
                  ) : null}

                  {wizardStep === 3 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Régimen" htmlFor="wizard-regimen">
                        <Select
                          id="wizard-regimen"
                          value={form.regimen}
                          onChange={(event) => updateField("regimen", event.target.value)}
                          disabled={form.rimpe}
                        >
                          <option value="">Selecciona régimen</option>
                          {regimenOptions.map((regimen) => (
                            <option key={regimen} value={regimen}>
                              {regimen.replace(/_/g, " ")}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field label="Fuente principal" htmlFor="wizard-fuente-principal">
                        <Select
                          id="wizard-fuente-principal"
                          value={form.fuente_principal}
                          onChange={(event) =>
                            updateField("fuente_principal", event.target.value)
                          }
                        >
                          <option value="">Selecciona una fuente</option>
                          {fontOptions.map((font) => (
                            <option key={font} value={font}>
                              {font}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <Field
                        label="Nro. contribuyente especial"
                        htmlFor="wizard-nro-contribuyente"
                      >
                        <Input
                          id="wizard-nro-contribuyente"
                          type="number"
                          min={0}
                          disabled={!form.contribuyente_especial}
                          value={form.nro_contribuyente_esp}
                          onChange={(event) =>
                            updateField("nro_contribuyente_esp", event.target.value)
                          }
                        />
                      </Field>
                    </div>
                  ) : null}

                  {wizardStep === 4 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Color primario" htmlFor="wizard-color-primario">
                          <Input
                            id="wizard-color-primario"
                            type="color"
                            value={normalizeHex(form.color_primario)}
                            onChange={(event) =>
                              updateField("color_primario", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Color secundario" htmlFor="wizard-color-secundario">
                          <Input
                            id="wizard-color-secundario"
                            type="color"
                            value={normalizeHex(form.color_secundario, "#0EA5E9")}
                            onChange={(event) =>
                              updateField("color_secundario", event.target.value)
                            }
                          />
                        </Field>
                        <Field label="Color acento" htmlFor="wizard-color-acento">
                          <Input
                            id="wizard-color-acento"
                            type="color"
                            value={normalizeHex(form.color_acento, "#22C55E")}
                            onChange={(event) =>
                              updateField("color_acento", event.target.value)
                            }
                          />
                        </Field>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <ToggleField
                          name="contribuyente_especial"
                          label="Contribuyente especial"
                          checked={form.contribuyente_especial}
                          onChange={updateToggle}
                        />
                        <ToggleField
                          name="obligado_contabilidad"
                          label="Obligado a contabilidad"
                          checked={form.obligado_contabilidad}
                          onChange={updateToggle}
                        />
                        <ToggleField
                          name="agente_retencion"
                          label="Agente de retención"
                          checked={form.agente_retencion}
                          onChange={updateToggle}
                        />
                        <ToggleField
                          name="rimpe"
                          label="RIMPE"
                          checked={form.rimpe}
                          onChange={updateToggle}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700"
                    onClick={() => setWizardOpen(false)}
                  >
                    Omitir y llenar más tarde
                  </button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setWizardStep((prev) => Math.max(1, prev - 1))}
                      disabled={wizardStep === 1 || saving}
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Anterior
                    </Button>
                    <Button type="button" onClick={goNextWizardStep} disabled={saving}>
                      {wizardStep === wizardTotalSteps ? "Finalizar" : "Siguiente"}
                      {wizardStep === wizardTotalSteps ? null : (
                        <ArrowRight className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </footer>
              </Dialog.Content>
            </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
