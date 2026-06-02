"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, FileText } from "lucide-react";

import { useState, useRef, useEffect } from "react";

interface TermsModalProps {
  onAccept?: () => void;
}

const sections = [
  {
    title: "Aceptación de los Términos",
    content:
      "Al registrarse y utilizar la plataforma Factory, el usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo con alguno de ellos, no debe utilizar el servicio.",
  },
  {
    title: "Descripción del Servicio",
    content:
      "Factory es un sistema de facturación electrónica SaaS que permite a empresas y profesionales emitir, recibir y gestionar comprobantes electrónicos (facturas, notas de crédito, notas de débito, guías de remisión, retenciones, liquidaciones de compra) autorizados por el Servicio de Rentas Internas (SRI) del Ecuador.",
  },
  {
    title: "Obligaciones del Usuario",
    items: [
      "Proporcionar información veraz, completa y actualizada durante el registro.",
      "Mantener la confidencialidad de sus credenciales de acceso (RUC, cédula y clave).",
      "Usar el sistema cumpliendo con la normativa tributaria vigente emitida por el SRI.",
      "No utilizar la plataforma para fines ilícitos o no autorizados.",
      "Asegurarse de que los datos fiscales y tributarios ingresados sean correctos.",
    ],
  },
  {
    title: "Responsabilidad sobre los Datos",
    content:
      "El usuario es el único responsable de la veracidad, exactitud y legalidad de la información ingresada en el sistema. Factory no se hace responsable por sanciones, multas o penalizaciones derivadas del mal uso de la plataforma o del incumplimiento de obligaciones tributarias por parte del usuario.",
  },
  {
    title: "Privacidad y Protección de Datos",
    content:
      "Factory trata los datos personales conforme a la Ley de Protección de Datos Personales del Ecuador. Los datos proporcionados serán utilizados únicamente para la prestación del servicio de facturación electrónica y no serán compartidos con terceros sin consentimiento del usuario, salvo obligación legal.",
  },
  {
    title: "Propiedad Intelectual",
    content:
      "El software Factory, incluyendo su código, diseño, logotipos y contenidos, es propiedad de sus desarrolladores y está protegido por las leyes de propiedad intelectual. El usuario obtiene una licencia limitada, no exclusiva e intransferible para usar el sistema durante la vigencia de su cuenta.",
  },
  {
    title: "Limitación de Responsabilidad",
    content:
      "Factory no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de uso del servicio, incluyendo pero no limitado a pérdida de datos, interrupción del servicio o errores en la transmisión de comprobantes electrónicos al SRI.",
  },
  {
    title: "Suspensión y Cancelación",
    content:
      "Factory se reserva el derecho de suspender o cancelar el acceso de cualquier usuario que incumpla estos términos, que haga un uso indebido del sistema o que realice actividades que afecten la estabilidad o seguridad de la plataforma.",
  },
  {
    title: "Modificaciones",
    content:
      "Factory se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán notificados a los usuarios a través de la plataforma o por correo electrónico. El uso continuado del servicio después de dichas modificaciones constituye la aceptación de los nuevos términos.",
  },
  {
    title: "Legislación Aplicable",
    content:
      "Estos Términos y Condiciones se rigen por las leyes de la República del Ecuador. Cualquier controversia derivada del uso del servicio será sometida a la jurisdicción de los tribunales competentes de Ecuador.",
  },
];

export function TermsModal({ onAccept }: TermsModalProps) {
  const [open, setOpen] = useState(false);
  const [canAccept, setCanAccept] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setCanAccept(true);
    }
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (contentRef.current) {
          const { scrollHeight, clientHeight } = contentRef.current;
          setCanAccept(scrollHeight <= clientHeight + 10);
        }
      }, 50);
    }
  }, [open]);

  const handleAccept = () => {
    if (!canAccept) return;
    if (onAccept) onAccept();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <span className="terms-trigger cursor-pointer font-semibold text-[#00517C] underline underline-offset-2 hover:text-[#00517C] transition-colors">
          Términos y Condiciones
        </span>
      </Dialog.Trigger>
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
          onPointerDownOutside={(e) => e.preventDefault()}
          className="auth-modal fixed left-1/2 top-1/2 z-50 w-[min(92vw,800px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col max-h-[90vh]"
          >
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 shrink-0">
                <FileText className="h-6 w-6 text-[#00517C]" />
              </div>
              <div className="flex-1 min-w-0">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  Términos y Condiciones
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Factory — Sistema de Facturación Electrónica
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
          </div>

          <div 
            ref={contentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
          >
            {sections.map((section, index) => (
              <section key={index}>
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#00517C] text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1">
                      {section.title}
                    </h3>
                    {"content" in section && section.content && (
                      <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
                    )}
                    {"items" in section && section.items && (
                      <ul className="space-y-1">
                        {section.items.map((item, i) => (
                          <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
            <Dialog.Close asChild>
              <button className="h-9 px-5 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </Dialog.Close>
            <button 
              onClick={handleAccept} 
              disabled={!canAccept}
              className="h-9 px-5 rounded-lg text-sm font-bold bg-[#00517C] hover:bg-[#003959] text-white shadow-sm transition-colors disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed"
            >
              Aceptar términos
            </button>
          </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
