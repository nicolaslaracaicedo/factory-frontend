"use client";

import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { ModuleCard } from "@/src/components/dashboard/module-card";
import { SideNav, iconByKey } from "@/src/components/dashboard/side-nav";
import { TopNavbar } from "@/src/components/dashboard/top-navbar";
import { CompanySettingsPanel } from "@/src/components/company/company-settings-panel";
import { ClientsPanel } from "@/src/components/clients/clients-panel";
import { ProvidersPanel } from "@/src/components/providers/providers-panel";
import { ProductGroupsPanel } from "@/src/components/product-groups/product-groups-panel";
import { ProductsPanel } from "@/src/components/products/products-panel";
import { IvaPanel } from "@/src/components/iva/iva-panel";
import { EstablishmentsPanel } from "@/src/components/establishments/establishments-panel";
import { EmissionPointsPanel } from "@/src/components/emission-points/emission-points-panel";
import { AmbientePanel } from "@/src/components/ambiente/ambiente-panel";
import { SignaturePanel } from "@/src/components/signature/signature-panel";
import { SecuencialesPanel } from "@/src/components/secuenciales/secuenciales-panel";
import { InvoicesPanel } from "@/src/components/invoices/invoices-panel";
import { CreditNotesPanel } from "@/src/components/credit-notes/credit-notes-panel";
import { DebitNotesPanel } from "@/src/components/debit-notes/debit-notes-panel";
import { UsersPanel } from "@/src/components/users/users-panel";
import type { AuthUser, UserRole } from "@/src/modules/auth/types/auth.types";
import {
  roleDashboardConfig,
  roleSidebarItems,
} from "@/src/modules/dashboard/config/role-dashboard.config";

interface RoleDashboardTemplateProps {
  role: UserRole;
  user: AuthUser;
  onLogout: () => void | Promise<void>;
}

export function RoleDashboardTemplate({
  role,
  user,
  onLogout,
}: RoleDashboardTemplateProps) {
  const config = roleDashboardConfig[role];
  const sidebarGroups = roleSidebarItems[role];
  const [activeSection, setActiveSection] = useState("dashboard");

  const activeItem = useMemo(() => {
    const allItems = sidebarGroups.flatMap((group) => group.items);
    return allItems.find((item) => item.key === activeSection) ?? allItems[0];
  }, [activeSection, sidebarGroups]);

  const ActiveIcon = iconByKey[activeSection] ?? LayoutGrid;

  return (
    <div className="min-h-screen bg-[linear-gradient(170deg,#edf5ff_0%,#f5f9ff_45%,#f3fbfb_100%)]">
      <div className="grid min-h-screen lg:grid-cols-[300px_minmax(0,1fr)]">
        <SideNav
          groups={sidebarGroups}
          activeKey={activeSection}
          onSelect={setActiveSection}
        />

        <section className="min-w-0">
          <TopNavbar role={role} user={user} onLogout={onLogout} />

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <header className="mb-2">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary">
                  <ActiveIcon className="h-7 w-7" />
                </span>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {activeItem?.label ?? role}
                  </h2>
                  <p className="mt-0.5 max-w-3xl text-sm text-slate-600">
                    {activeSection === "dashboard" ? config.subtitle : activeItem?.hint}
                  </p>
                </div>
              </div>
            </header>

            {activeSection === "dashboard" ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {config.sections.map((section) => (
                  <ModuleCard
                    key={section.title}
                    title={section.title}
                    description={section.description}
                  />
                ))}
              </div>
            ) : null}

            {role === "Administrador" ? (
              <CompanySettingsPanel showPanel={activeSection === "empresa"} />
            ) : null}

            {activeSection === "usuarios" ? (
              <UsersPanel showPanel={true} />
            ) : null}

            {activeSection === "clientes" ? (
              <ClientsPanel showPanel={true} />
            ) : null}

            {activeSection === "proveedores" ? (
              <ProvidersPanel showPanel={true} />
            ) : null}

            {activeSection === "grupos-producto" ? (
              <ProductGroupsPanel showPanel={true} />
            ) : null}

            {activeSection === "productos" ? (
              <ProductsPanel showPanel={true} />
            ) : null}

            {activeSection === "iva" ? <IvaPanel showPanel={true} /> : null}

            {activeSection === "establecimientos" ? (
              <EstablishmentsPanel showPanel={true} />
            ) : null}

            {activeSection === "puntos-emision" ? (
              <EmissionPointsPanel showPanel={true} />
            ) : null}

            {activeSection === "ambiente" ? (
              <AmbientePanel showPanel={true} />
            ) : null}

            {activeSection === "firma-electronica" ? (
              <SignaturePanel showPanel={true} />
            ) : null}

            {activeSection === "secuenciales" ? (
              <SecuencialesPanel showPanel={true} />
            ) : null}

            {activeSection === "facturas" ? (
              <InvoicesPanel showPanel={true} />
            ) : null}

            {activeSection === "notas-credito" ? (
              <CreditNotesPanel showPanel={true} />
            ) : null}

            {activeSection === "notas-debito" ? (
              <DebitNotesPanel showPanel={true} />
            ) : null}

            {activeSection !== "dashboard" &&
            !(role === "Administrador" && activeSection === "empresa") &&
            activeSection !== "usuarios" &&
            activeSection !== "clientes" &&
            activeSection !== "proveedores" &&
            activeSection !== "grupos-producto" &&
            activeSection !== "productos" &&
            activeSection !== "iva" &&
            activeSection !== "establecimientos" &&
            activeSection !== "puntos-emision" &&
            activeSection !== "ambiente" &&
            activeSection !== "firma-electronica" &&
            activeSection !== "secuenciales" &&
            activeSection !== "facturas" &&
            activeSection !== "notas-credito" &&
            activeSection !== "notas-debito" ? (
              <article className="rounded-2xl border border-dashed border-slate-300 bg-white/90 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">
                  {activeItem?.label}
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Este modulo quedo preparado para conectar APIs y tablas. Siguiente
                  paso: servicio + tabla + formulario para {activeItem?.label?.toLowerCase()}.
                </p>
              </article>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
