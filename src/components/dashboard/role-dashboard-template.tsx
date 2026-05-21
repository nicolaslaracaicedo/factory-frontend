"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { ModuleCard } from "@/src/components/dashboard/module-card";
import { ResumenDashboard } from "@/src/components/dashboard/resumen-dashboard";
import { DashboardShell } from "@/src/components/dashboard/dashboard-shell";
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
import { SignaturePanel } from "@/src/components/signature/signature-panel";
import { SecuencialesPanel } from "@/src/components/secuenciales/secuenciales-panel";
import { InvoicesPanel } from "@/src/components/invoices/invoices-panel";
import { CreditNotesPanel } from "@/src/components/credit-notes/credit-notes-panel";
import { DebitNotesPanel } from "@/src/components/debit-notes/debit-notes-panel";
import { NotasVentaPanel } from "@/src/components/notas-venta/notas-venta-panel";
import { RetencionesPanel } from "@/src/components/retenciones/retenciones-panel";
import { GuiasRemisionPanel } from "@/src/components/guias-remision/guias-remision-panel";
import { LiquidacionesCompraPanel } from "@/src/components/liquidaciones-compra/liquidaciones-compra-panel";
import { ProformasPanel } from "@/src/components/proformas/proformas-panel";
import { RecurrentesPanel } from "@/src/components/recurrentes/recurrentes-panel";
import { SriLogsPanel } from "@/src/components/sri-logs/sri-logs-panel";
import { UsersPanel } from "@/src/components/users/users-panel";
import { BreadcrumbsProvider, useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";
import { DashboardSectionProvider } from "@/src/components/dashboard/dashboard-section-context";
import type { AuthUser, UserRole } from "@/src/modules/auth/types/auth.types";
import {
  roleDashboardConfig,
  roleNavbarItems,
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
  return (
    <BreadcrumbsProvider>
      <RoleDashboardContent role={role} user={user} onLogout={onLogout} />
    </BreadcrumbsProvider>
  );
}

function RoleDashboardContent({
  role,
  user,
  onLogout,
}: RoleDashboardTemplateProps) {
  const config = roleDashboardConfig[role];
  const sidebarGroups = roleSidebarItems[role];
  const navbarGroups = roleNavbarItems[role];
  const { headerVisible } = useBreadcrumbs();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();

  const allItems = useMemo(() => {
    return [...sidebarGroups, ...navbarGroups].flatMap((group) => group.items);
  }, [navbarGroups, sidebarGroups]);

  const validSections = useMemo(() => {
    return new Set(["dashboard", ...allItems.map((item) => item.key)]);
  }, [allItems]);

  const activeSection = useMemo(() => {
    const sectionParam = new URLSearchParams(searchString).get("section");
    if (sectionParam && validSections.has(sectionParam)) {
      return sectionParam;
    }
    return "dashboard";
  }, [searchString, validSections]);

  const setActiveSection = useCallback((section: string) => {
    const nextSection = validSections.has(section) ? section : "dashboard";
    const currentParam = new URLSearchParams(searchString).get("section");
    if (nextSection === activeSection) {
      if (nextSection === "dashboard" && !currentParam) return;
      if (currentParam === nextSection) return;
    }

    const params = new URLSearchParams(searchString);
    if (nextSection === "dashboard") {
      params.delete("section");
    } else {
      params.set("section", nextSection);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [activeSection, pathname, router, searchString, validSections]);

  useEffect(() => {
    const sectionParam = new URLSearchParams(searchString).get("section");
    if (sectionParam && !validSections.has(sectionParam)) {
      const params = new URLSearchParams(searchString);
      params.delete("section");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchString, validSections]);

  const activeItem = useMemo(() => {
    return allItems.find((item) => item.key === activeSection) ?? allItems[0];
  }, [activeSection, allItems]);

  const ActiveIcon = iconByKey[activeSection] ?? LayoutGrid;
  const breadcrumbs = activeSection === "dashboard"
    ? [{ label: "Inicio", onClick: () => setActiveSection("dashboard") }]
    : [
        { label: "Inicio", onClick: () => setActiveSection("dashboard") },
        { label: activeItem?.label ?? role },
      ];

  return (
    <DashboardSectionProvider activeSection={activeSection} setActiveSection={setActiveSection}>
      <DashboardShell
        sidebar={
          <SideNav
            groups={sidebarGroups}
            activeKey={activeSection}
            onSelect={setActiveSection}
          />
        }
      >
        <TopNavbar
          role={role}
          user={user}
          onLogout={onLogout}
          menuGroups={navbarGroups}
          activeKey={activeSection}
          onSelect={setActiveSection}
          defaultBreadcrumbs={breadcrumbs}
        />

        <div className="space-y-5 px-5 py-5 sm:px-6">
        {headerVisible ? (
          <header className="mb-8">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-app-primary/10 text-app-primary">
                <ActiveIcon className="h-7 w-7" />
              </span>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-slate-900">
                  {activeItem?.label ?? role}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">
                  {activeSection === "dashboard" ? config.subtitle : activeItem?.hint}
                </p>
              </div>
            </div>
          </header>
        ) : null}

        {activeSection === "dashboard" ? (
          <ResumenDashboard />
        ) : null}

        {role === "Administrador" ? (
          <CompanySettingsPanel showPanel={activeSection === "empresa"} />
        ) : null}

        {activeSection === "usuarios" ? <UsersPanel showPanel={true} /> : null}

        {activeSection === "clientes" ? <ClientsPanel showPanel={true} /> : null}

        {activeSection === "proveedores" ? (
          <ProvidersPanel showPanel={true} />
        ) : null}

        {activeSection === "grupos-producto" ? (
          <ProductGroupsPanel showPanel={true} />
        ) : null}

        {activeSection === "productos" ? <ProductsPanel showPanel={true} /> : null}

        {activeSection === "iva" ? <IvaPanel showPanel={true} /> : null}

        {activeSection === "establecimientos" ? (
          <EstablishmentsPanel showPanel={true} />
        ) : null}

        {activeSection === "puntos-emision" ? (
          <EmissionPointsPanel showPanel={true} />
        ) : null}

        {activeSection === "firma-electronica" ? (
          <SignaturePanel showPanel={true} />
        ) : null}

        {activeSection === "secuenciales" ? (
          <SecuencialesPanel showPanel={true} />
        ) : null}

        {activeSection === "facturas" ? <InvoicesPanel showPanel={true} /> : null}

        {activeSection === "notas-credito" ? (
          <CreditNotesPanel showPanel={true} />
        ) : null}

        {activeSection === "notas-venta" ? (
          <NotasVentaPanel showPanel={true} />
        ) : null}

        {activeSection === "notas-debito" ? (
          <DebitNotesPanel showPanel={true} />
        ) : null}

        {activeSection === "retenciones" ? (
          <RetencionesPanel showPanel={true} />
        ) : null}

        {activeSection === "guias-remision" ? (
          <GuiasRemisionPanel showPanel={true} />
        ) : null}

        {activeSection === "liquidaciones-compra" ? (
          <LiquidacionesCompraPanel showPanel={true} />
        ) : null}

        {activeSection === "proformas" ? (
          <ProformasPanel showPanel={true} />
        ) : null}

        {activeSection === "recurrentes" ? (
          <RecurrentesPanel showPanel={true} />
        ) : null}

        {activeSection === "sri-logs" ? ( // Agregar case
          <SriLogsPanel showPanel={true} />
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
          activeSection !== "notas-venta" &&
          activeSection !== "notas-debito" &&
          activeSection !== "retenciones" &&
          activeSection !== "guias-remision" &&
          activeSection !== "liquidaciones-compra" &&
          activeSection !== "proformas" &&
          activeSection !== "recurrentes" &&
          activeSection !== "sri-logs" ? (
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
      </DashboardShell>
    </DashboardSectionProvider>
  );
}
