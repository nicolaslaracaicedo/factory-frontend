"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as SelectPrimitive from "@radix-ui/react-select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Save, Sparkles, X, Building2, Settings, Palette, FileCheck, ChevronDown, CheckCircle2, FlaskConical, Mail, Send, ShieldCheck, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { companyService } from "@/src/modules/company/services/company.service";
import { applyCompanyTheme } from "@/src/modules/company/utils/company-theme.utils";
import type { Company, CompanyFormInput } from "@/src/modules/company/types/company.types";
import { toCompanyFormInput } from "@/src/modules/company/utils/company-payload.utils";
import { Loader } from "@/src/components/ui/loader";

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
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
  smtp_password: "",
  smtp_from_name: "",
  smtp_secure: false,
};

interface ToggleProps {
  name: keyof Pick<
    CompanyFormInput,
    | "contribuyente_especial"
    | "obligado_contabilidad"
    | "agente_retencion"
    | "rimpe"
    | "smtp_secure"
  >;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (name: ToggleProps["name"], value: boolean) => void;
}

function ToggleField({ name, label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/60 px-4 py-3.5 transition-all hover:bg-slate-50">
      <div className="flex items-center justify-between gap-4 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {description && (
            <span className="text-xs text-slate-500 leading-relaxed">
              {description}
            </span>
          )}
        </div>
        <Switch
          checked={checked}
          onCheckedChange={(value) => onChange(name, value)}
        />
      </div>
    </div>
  );
}

const wizardTotalSteps = 4;
const fontOptions = ["Manrope", "Roboto", "Inter", "Poppins"] as const;
const regimenOptions = [
  { value: "GENERAL", label: "General" },
  { value: "RIMPE_NEGOCIO", label: "RIMPE Negocio Popular" },
  { value: "RIMPE_EMPRENDEDOR", label: "RIMPE Emprendedor" },
] as const;

const regimenLabelMap: Record<string, string> = {
  GENERAL: "General",
  RIMPE_NEGOCIO: "RIMPE Negocio Popular",
  RIMPE_EMPRENDEDOR: "RIMPE Emprendedor",
};
const ambienteOptions = [
  { value: 1, label: "Pruebas" },
  { value: 2, label: "Producción" },
] as const;

interface CompanySettingsPanelProps {
  showPanel?: boolean;
  initialCompany?: Company | null;
  readOnly?: boolean;
}

const hasCoreCompanyData = (form: CompanyFormInput): boolean => {
  return Boolean(form.ruc.trim() && form.razon_social.trim());
};

const normalizeHex = (value: string, fallback = "#1976D2") => {
  if (!value) return fallback;
  return value.startsWith("#") ? value : fallback;
};

export function CompanySettingsPanel({ showPanel = true, initialCompany = null, readOnly = false }: CompanySettingsPanelProps) {
  const [form, setForm] = useState<CompanyFormInput>(initialForm);
  const [company, setCompany] = useState<Company | null>(initialCompany);
  const [loading, setLoading] = useState(!initialCompany);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"fiscal" | "branding" | "conexion" | "correo">("fiscal");
  const [showPassword, setShowPassword] = useState(false);

  const openEditModal = () => {
    if (company) {
      const mapped = toCompanyFormInput(company);
      setForm(mapped);
      setLogoPreview(company.logo?.trim() ? company.logo : logoPreview);
    } else {
      setForm(initialForm);
      setLogoPreview(null);
    }
    setActiveTab("fiscal");
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
        nextState.regimen = "RIMPE_NEGOCIO";
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
          : "RIMPE_NEGOCIO"
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-4"
        >
          {loading ? (
            <Loader label="Cargando datos de empresa" className="min-h-[200px]" />
          ) : company ? (
            <motion.section
              initial={{ opacity: 0, y: 10, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                className="flex flex-wrap items-start justify-between gap-3 mb-8"
              >
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Datos de la Empresa</h4>
                  <p className="text-sm text-slate-500 mt-1">Configuración actual, identidad y detalles fiscales.</p>
                </div>
                {!readOnly && (
                  <Button type="button" onClick={openEditModal} className="h-9 bg-app-primary hover:bg-app-primary/90 text-white shadow-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Editar datos
                  </Button>
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-6"
              >
                {/* Fila 1: Logo + Información General */}
                <div className="grid gap-6 md:grid-cols-[300px_1fr] items-stretch">
                  {/* Tarjeta Logo */}
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/80 p-4 min-h-[180px] overflow-hidden">
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt="Logo de empresa"
                        className="max-h-full max-w-full object-contain drop-shadow-sm"
                      />
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Sin logo</span>
                    )}
                  </div>

                  {/* Info General */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 flex flex-col justify-center">
                    <h5 className="mb-5 text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Información General
                    </h5>
                    <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Razón social</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.razon_social || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nombre comercial</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.nombre_comercial || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">RUC</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.ruc || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Identificación</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.identificacion || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Correo</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.email || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Teléfono</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.telefono || "-"}</p>
                      </div>
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dirección matriz</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.direccion_matriz || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fila 2: Estado de Cuenta + Configuración Fiscal */}
                <div className="grid gap-6 md:grid-cols-[300px_1fr] items-stretch">
                  {/* Tarjeta de Estado */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 flex flex-col justify-between min-h-[200px]">
                    <h5 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-slate-400" />
                      Estado de cuenta
                    </h5>

                    <div className="flex items-center justify-between py-1">
                      <span className="text-[11px] font-medium text-slate-500">Estado</span>
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold ${company.estado === "ACTIVO" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                        {company.estado || "-"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 border-t border-slate-200/40 pt-3">
                      <span className="text-[10px] font-medium text-slate-500">Registrado en</span>
                      <span className="text-xs font-semibold text-slate-700">{company.created_at ? new Date(company.created_at).toLocaleDateString("es-EC") : "-"}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-medium text-slate-500">Última actualización</span>
                      <span className="text-xs font-semibold text-slate-700">{company.updated_at ? new Date(company.updated_at).toLocaleDateString("es-EC") : "-"}</span>
                    </div>
                  </div>

                  {/* Info Fiscal */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 flex flex-col justify-center">
                    <h5 className="mb-5 text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-slate-400" />
                      Configuración Fiscal
                    </h5>
                    <div className="grid gap-y-4 gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ambiente SRI</p>
                        <div className="mt-1">
                          {company.ambiente === 2 ? (
                            <span className="inline-flex items-center rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">Producción</span>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Pruebas</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Régimen</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{regimenLabelMap[company.regimen ?? ""] || company.regimen?.replace(/_/g, " ") || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">RIMPE</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.rimpe ? "Sí" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Obligado contabilidad</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.obligado_contabilidad ? "Sí" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Agente retención</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.agente_retencion ? "Sí" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contribuyente especial</p>
                        <p className="text-xs font-medium text-slate-800 mt-1">{company.contribuyente_especial ? `Sí (${company.nro_contribuyente_esp || "Sin Nro"})` : "No"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Servicio de Correo</p>
                        <div className="mt-1">
                          {company.smtp_configurado ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Configurado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              Sin configurar
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.section>
          ) : (
            <section className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
              <p className="text-sm text-slate-600">
                Aún no hay datos de empresa. Configura la información para comenzar.
              </p>
              {!readOnly && (
                <Button className="mt-3" type="button" onClick={openEditModal}>
                  Configurar empresa
                </Button>
              )}
            </section>
          )}
        </motion.div>
      ) : null}

      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,860px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden"
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col max-h-[90vh]"
            >
            {/* Header con icono y título */}
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                  <Building2 className="h-6 w-6 text-app-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-xl font-semibold text-slate-900">
                    Editar datos de empresa
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                    Actualiza la información fiscal, identidad y personalización visual de tu empresa.
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

            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 bg-slate-50/50">
              <div className="flex px-6">
                {[
                  { id: "fiscal", label: "Datos Fiscales", icon: FileCheck },
                  { id: "branding", label: "Branding / Estilo", icon: Palette },
                  { id: "conexion", label: "Conexión", icon: Settings },
                  { id: "correo", label: "Correo / SMTP", icon: Mail },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                      ? "text-sky-600"
                      : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <form className="space-y-5" onSubmit={onSubmit}>
                <AnimatePresence mode="wait">
                  {activeTab === "fiscal" && (
                    <motion.div
                      key="fiscal"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                    {/* Información general e identidad */}
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Información general</h3>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                        {/* Logo */}
                        <div>
                          <label
                            htmlFor="logo"
                            className="flex h-full min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 text-center text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                          >
                            {logoPreview ? (
                              <div className="flex w-full flex-col items-center gap-2">
                                <img
                                  src={logoPreview}
                                  alt="Logo actual"
                                  className="h-28 w-28 rounded-xl object-contain"
                                />
                                <span className="text-xs font-medium text-slate-600">
                                  Cambiar logo
                                </span>
                              </div>
                            ) : (
                              <>
                                <span className="rounded-md bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
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

                        {/* Campos de identidad */}
                        <div className="grid gap-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Razón social *" htmlFor="razon_social">
                              <Input
                                id="razon_social"
                                value={form.razon_social}
                                onChange={(event) =>
                                  updateField("razon_social", event.target.value)
                                }
                                className="bg-white shadow-none"
                              />
                            </Field>

                            <Field label="Nombre comercial" htmlFor="nombre_comercial">
                              <Input
                                id="nombre_comercial"
                                value={form.nombre_comercial}
                                onChange={(event) =>
                                  updateField("nombre_comercial", event.target.value)
                                }
                                className="bg-white shadow-none"
                              />
                            </Field>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="RUC *" htmlFor="ruc">
                              <Input
                                id="ruc"
                                inputMode="numeric"
                                value={form.ruc}
                                onChange={(event) => updateField("ruc", event.target.value)}
                                className="bg-white shadow-none"
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
                                className="bg-white shadow-none"
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
                                className="bg-white shadow-none"
                              />
                            </Field>

                            <Field label="Teléfono" htmlFor="telefono">
                              <Input
                                id="telefono"
                                value={form.telefono}
                                onChange={(event) => updateField("telefono", event.target.value)}
                                className="bg-white shadow-none"
                              />
                            </Field>
                          </div>
                        </div>
                      </div>

                      <Field label="Dirección matriz" htmlFor="direccion_matriz">
                        <Input
                          id="direccion_matriz"
                          value={form.direccion_matriz}
                          onChange={(event) =>
                            updateField("direccion_matriz", event.target.value)
                          }
                          className="bg-white shadow-none"
                        />
                      </Field>
                    </div>

                    {/* Configuración fiscal */}
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Configuración fiscal</h3>
                      </div>

                      <div className="grid gap-4">
                        <Field label="Régimen" htmlFor="">
                          <div className="relative flex flex-nowrap whitespace-nowrap rounded-lg bg-white p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] w-full text-sm">
                            {regimenOptions.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => updateField("regimen", option.value)}
                                className="relative flex-1 text-center rounded-lg border-none py-2"
                              >
                                {form.regimen === option.value && (
                                  <motion.div
                                    layoutId="regimen-bg"
                                    className="absolute inset-0 rounded-lg bg-app-primary"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                  />
                                )}
                                <span className={`relative z-10 cursor-pointer ${form.regimen === option.value ? "text-white font-semibold" : "text-slate-700"}`}>
                                  {option.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </Field>

                      </div>

                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
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
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <ToggleField
                            name="contribuyente_especial"
                            label="Contribuyente especial"
                            checked={form.contribuyente_especial}
                            onChange={updateToggle}
                          />
                        </div>

                        <div
                          className={`grid transition-all duration-300 ease-in-out ${form.contribuyente_especial
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                            }`}
                        >
                          <div className="overflow-hidden">
                            <div className="grid gap-3">
                              <Field label="Nro. contribuyente especial" htmlFor="nro_contribuyente_esp">
                                <Input
                                  id="nro_contribuyente_esp"
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Ej: 12345"
                                  value={form.nro_contribuyente_esp}
                                  onChange={(event) =>
                                    updateField("nro_contribuyente_esp", event.target.value.replace(/\D/g, ""))
                                  }
                                  className="bg-white shadow-none"
                                />
                              </Field>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: Branding / Estilo */}
                {activeTab === "branding" && (
                  <motion.div
                    key="branding"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Personalización visual</h3>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Color primario" htmlFor="color_primario">
                          <Input
                            id="color_primario"
                            type="color"
                            value={normalizeHex(form.color_primario)}
                            onChange={(event) => updateField("color_primario", event.target.value)}
                            className="bg-white shadow-none h-9 p-1"
                          />
                        </Field>

                        <Field label="Color secundario" htmlFor="color_secundario">
                          <Input
                            id="color_secundario"
                            type="color"
                            value={normalizeHex(form.color_secundario, "#0EA5E9")}
                            onChange={(event) => updateField("color_secundario", event.target.value)}
                            className="bg-white shadow-none h-9 p-1"
                          />
                        </Field>

                        <Field label="Color acento" htmlFor="color_acento">
                          <Input
                            id="color_acento"
                            type="color"
                            value={normalizeHex(form.color_acento, "#22C55E")}
                            onChange={(event) => updateField("color_acento", event.target.value)}
                            className="bg-white shadow-none h-9 p-1"
                          />
                        </Field>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Tipografía" htmlFor="fuente_principal">
                          <SelectPrimitive.Root
                            value={form.fuente_principal}
                            onValueChange={(val) => updateField("fuente_principal", val)}
                          >
                            <SelectPrimitive.Trigger
                              id="fuente_principal"
                              className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                            >
                              <SelectPrimitive.Value placeholder="Selecciona una fuente..." />
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
                                  {fontOptions.map((font) => (
                                    <SelectPrimitive.Item
                                      key={font}
                                      value={font}
                                      className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                                    >
                                      <SelectPrimitive.ItemText style={{ fontFamily: font }}>{font}</SelectPrimitive.ItemText>
                                    </SelectPrimitive.Item>
                                  ))}
                                </SelectPrimitive.Viewport>
                              </SelectPrimitive.Content>
                            </SelectPrimitive.Portal>
                          </SelectPrimitive.Root>
                        </Field>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: Conexión */}
                {activeTab === "conexion" && (
                  <motion.div
                    key="conexion"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Alerta de producción */}
                    <div
                      className={`rounded-xl border border-transparent p-4 transition-all duration-300 ${form.ambiente === 2
                        ? "bg-orange-100"
                        : "bg-sky-100"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-md p-1.5 ${form.ambiente === 2 ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"
                            }`}
                        >
                          {form.ambiente === 2 ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h4
                            className={`font-semibold text-sm flex items-center gap-2 ${form.ambiente === 2 ? "text-orange-800" : "text-sky-800"
                              }`}
                          >
                            {form.ambiente === 2
                              ? "Modo Producción activado"
                              : "Modo Pruebas activado"}
                          </h4>
                          <p
                            className={`mt-1 text-sm ${form.ambiente === 2 ? "text-orange-700" : "text-sky-700"
                              }`}
                          >
                            {form.ambiente === 2
                              ? "Las facturas emitidas tendrán validez legal tributaria ante el SRI. Asegúrate de que todos los datos fiscales sean correctos."
                              : "Las facturas emitidas no tienen validez legal. Úsalo para probar el sistema antes de pasar a producción."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-100 rounded-xl p-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <Settings className="h-3.5 w-3.5 text-slate-500" />
                        <h3 className="text-sm font-semibold text-slate-700">Ajustes de conexión</h3>
                      </div>

                      {/* Switch de ambiente prominente */}
                      <div className="rounded-xl border border-slate-300 bg-white p-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${form.ambiente === 2 ? "text-orange-800" : "text-sky-800"}`}>
                                {form.ambiente === 2 ? "Ambiente: Producción" : "Ambiente: Pruebas"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium ${form.ambiente === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-sky-100 text-sky-700"
                                  }`}
                              >
                                {form.ambiente === 2 ? (
                                  <><CheckCircle2 className="h-3 w-3" /> Activo</>
                                ) : (
                                  <><CheckCircle2 className="h-3 w-3" /> Activo</>
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {form.ambiente === 2
                                ? "Emisión real de documentos tributarios"
                                : "Entorno de pruebas sin validez legal"}
                            </p>
                          </div>

                          <div className="relative flex items-center rounded-md border border-slate-200 bg-slate-50 p-1">
                            <button
                              type="button"
                              onClick={() => updateField("ambiente", 1)}
                              className="relative inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold"
                            >
                              {form.ambiente === 1 && (
                                <motion.div
                                  layoutId="ambiente-bg"
                                  className="absolute inset-0 rounded-md bg-sky-600"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className={`relative z-10 inline-flex items-center gap-1 ${form.ambiente === 1 ? "text-white" : "text-slate-600"}`}>
                                <FlaskConical className="h-3 w-3" />
                                Pruebas
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => updateField("ambiente", 2)}
                              className="relative inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold"
                            >
                              {form.ambiente === 2 && (
                                <motion.div
                                  layoutId="ambiente-bg"
                                  className="absolute inset-0 rounded-md bg-orange-600"
                                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                              )}
                              <span className={`relative z-10 inline-flex items-center gap-1 ${form.ambiente === 2 ? "text-white" : "text-slate-600"}`}>
                                <CheckCircle2 className="h-3 w-3" />
                                Produccion
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB: Correo / SMTP */}
                {activeTab === "correo" && (
                  <motion.div
                    key="correo"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Bloque 1: Servidor (Datos técnicos) */}
                    <div className="bg-[#F1F5F9] rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <ShieldCheck className="h-4 w-4 text-slate-500" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Servidor (Datos técnicos)</h4>
                      </div>

                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-8">
                          <Field label="Servidor SMTP" htmlFor="smtp_host">
                            <Input
                              id="smtp_host"
                              placeholder="Ej: smtp.gmail.com"
                              value={form.smtp_host}
                              onChange={(event) => updateField("smtp_host", event.target.value)}
                              className="bg-white shadow-none border-slate-200"
                            />
                          </Field>
                        </div>
                        <div className="col-span-4">
                          <Field label="Puerto" htmlFor="smtp_port">
                            <Input
                              id="smtp_port"
                              type="number"
                              placeholder="587"
                              value={form.smtp_port}
                              onChange={(event) => updateField("smtp_port", Number(event.target.value))}
                              className="bg-white shadow-none border-slate-200"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Bloque 2: Credenciales (Datos de acceso) */}
                    <div className="bg-[#F1F5F9] rounded-xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <KeyRound className="h-4 w-4 text-slate-500" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Credenciales (Datos de acceso)</h4>
                      </div>

                      <div className="grid gap-4">
                        <Field label="Correo / Usuario remitente" htmlFor="smtp_user">
                          <Input
                            id="smtp_user"
                            type="email"
                            placeholder="ejemplo@empresa.com"
                            value={form.smtp_user}
                            onChange={(event) => updateField("smtp_user", event.target.value)}
                            className="bg-white shadow-none border-slate-200"
                          />
                        </Field>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <Field label="Contraseña SMTP" htmlFor="smtp_password">
                            <div className="relative group">
                              <Input
                                id="smtp_password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••••••"
                                value={form.smtp_password}
                                onChange={(event) => updateField("smtp_password", event.target.value)}
                                className="bg-white shadow-none pr-10 border-slate-200"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </Field>

                          <Field label="Nombre del Remitente" htmlFor="smtp_from_name">
                            <Input
                              id="smtp_from_name"
                              placeholder="Ej: Facturación Pilla Pago"
                              value={form.smtp_from_name}
                              onChange={(event) => updateField("smtp_from_name", event.target.value)}
                              className="bg-white shadow-none border-slate-200"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>

                    {/* Switch de Seguridad al final (Estilo Cliente Recurrente) */}
                    <ToggleField
                      name="smtp_secure"
                      label="Usar conexión segura (SSL/TLS)"
                      description="Activa esta opción para encriptar la comunicación con el servidor de correo"
                      checked={form.smtp_secure}
                      onChange={updateToggle}
                    />
                  </motion.div>
                )}

                </AnimatePresence>

                {/* Botones de acción */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} className="h-10 px-4">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving} className="h-10 px-4">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={wizardOpen} onOpenChange={setWizardOpen}>
        <Dialog.Portal>
          <Dialog.Overlay asChild>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[2px]"
            />
          </Dialog.Overlay>
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
            <Dialog.Title className="sr-only">Configuración inicial de empresa</Dialog.Title>
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
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

            <div className="mb-6 h-2 rounded-md bg-slate-100">
              <div
                className="h-full rounded-md bg-sky-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {wizardStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
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
                </motion.div>
              )}

              {wizardStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
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
                </motion.div>
              )}

              {wizardStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                  <Field label="Régimen" htmlFor="">
                    <div className="flex flex-nowrap whitespace-nowrap rounded-lg bg-white p-1 shadow-[0_0_0_1px_rgba(0,0,0,0.06)] w-full text-sm">
                      {regimenOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateField("regimen", option.value)}
                          className={`flex-1 text-center cursor-pointer rounded-lg border-none py-2 transition-all duration-150 ease-in-out ${
                            form.regimen === option.value
                              ? "bg-app-primary text-white font-semibold"
                              : "bg-transparent text-slate-700"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Fuente principal" htmlFor="wizard-fuente-principal">
                    <SelectPrimitive.Root
                      value={form.fuente_principal}
                      onValueChange={(val: string) => updateField("fuente_principal", val)}
                    >
                      <SelectPrimitive.Trigger
                        id="wizard-fuente-principal"
                        className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
                      >
                        <SelectPrimitive.Value placeholder="Selecciona una fuente..." />
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
                            {fontOptions.map((font) => (
                              <SelectPrimitive.Item
                                key={font}
                                value={font}
                                className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-2 text-sm text-slate-700 outline-none data-[highlighted]:bg-slate-100 data-[state=checked]:bg-app-primary data-[state=checked]:text-white"
                              >
                                <SelectPrimitive.ItemText style={{ fontFamily: font }}>{font}</SelectPrimitive.ItemText>
                              </SelectPrimitive.Item>
                            ))}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </Field>

                  {form.contribuyente_especial && (
                    <Field
                      label="Nro. contribuyente especial"
                      htmlFor="wizard-nro-contribuyente"
                    >
                      <Input
                        id="wizard-nro-contribuyente"
                        type="number"
                        min={0}
                        value={form.nro_contribuyente_esp}
                        onChange={(event) =>
                          updateField("nro_contribuyente_esp", event.target.value)
                        }
                        className="bg-white shadow-none"
                      />
                    </Field>
                  )}
                </motion.div>
              )}

              {wizardStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
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
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
