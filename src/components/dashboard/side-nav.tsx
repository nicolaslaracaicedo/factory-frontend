"use client";

import { useEffect, useState, type ComponentType } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Building2,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FileCode,
  FileSearch,
  FileText,
  Handshake,
  LayoutGrid,
  MapPinHouse,
  Package,
  PackageSearch,
  Percent,
  ReceiptText,
  Redo2,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Signature,
  Store,
  Truck,
  Undo2,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import type { SidebarGroup } from "@/src/modules/dashboard/config/role-dashboard.config";
import { companyService } from "@/src/modules/company/services/company.service";
import type { Company } from "@/src/modules/company/types/company.types";
import { readCompanyCache, writeCompanyCache, writeCompanyThemeCache } from "@/src/modules/company/utils/company-cache.utils";
import { motion } from "framer-motion";

interface SideNavProps {
  groups: SidebarGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const iconByKey: Record<string, ComponentType<{ className?: string }>> = {
  dashboard: LayoutGrid,
  empresa: Building2,
  "firma-electronica": Signature,
  ambiente: ShieldCheck,
  secuenciales: FileCode,
  establecimientos: Store,
  "puntos-emision": MapPinHouse,
  iva: Percent,
  clientes: Users,
  proveedores: Handshake,
  "grupos-producto": PackageSearch,
  productos: Package,
  facturas: ReceiptText,
  "notas-credito": Undo2,
  "notas-venta": ShoppingCart,
  "notas-debito": Redo2,
  retenciones: Wallet,
  "guias-remision": Truck,
  "liquidaciones-compra": ClipboardList,
  proformas: FileText,
  recurrentes: RefreshCw,
  "sri-logs": FileSearch,
  impuestos: FileCode,
  reportes: FileText,
  usuarios: UserCog,
};

export function SideNav({ groups, activeKey, onSelect, collapsed, onToggle }: SideNavProps) {
  const [company, setCompany] = useState<Company | null>(() => readCompanyCache());
  const [runIntro, setRunIntro] = useState(false);

  useEffect(() => {
    const cached = readCompanyCache();
    if (cached) setCompany(cached);

    const loadCompany = async () => {
      try {
        const response = await companyService.getCompany();
        setCompany(response);
        writeCompanyCache(response);
        writeCompanyThemeCache(response);
      } catch {
        if (!cached) setCompany(null);
      }
    };

    void loadCompany();
  }, []);

  useEffect(() => {
    const key = "factory_first_login_sidebar_intro_done";
    const alreadyAnimated = sessionStorage.getItem(key);
    if (!alreadyAnimated) {
      setRunIntro(true);
      sessionStorage.setItem(key, "1");
    }
  }, []);

  return (
    <Tooltip.Provider delayDuration={200} skipDelayDuration={400}>
      <motion.aside
        initial={runIntro ? { opacity: 0, x: -12 } : false}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="dashboard-sidebar sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white/90 backdrop-blur"
      >
        {/* Toggle + Logo area */}
        <div className="dashboard-sidebar-logo flex h-18 items-center justify-center px-2">
          {collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Expandir sidebar"
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 justify-center">
                {company?.logo ? (
                  <img
                    src={company.logo}
                    alt="Logo de empresa"
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    className="dashboard-sidebar-logo-image max-h-13 w-full object-contain"
                  />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Logo
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={onToggle}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Colapsar sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <nav className={`dashboard-nav pb-5 ${collapsed ? "px-2.5" : "space-y-2 px-2.5"}`}>
          {collapsed ? (
            groups.flatMap((group) => group.items).map((item) => {
              const Icon = iconByKey[item.key] ?? LayoutGrid;
              return (
                <Tooltip.Root key={item.key}>
                  <Tooltip.Trigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelect(item.key)}
                      className={`dashboard-nav-item group flex w-full items-center justify-center rounded-lg p-1.5 text-[13px] font-semibold transition-all duration-200 ease-out hover:bg-slate-100 ${
                        activeKey === item.key ? "bg-app-primary/10 text-app-primary" : "text-slate-700"
                      }`}
                    >
                      <span
                        className={`dashboard-nav-icon rounded-md p-[3px] ${
                          activeKey === item.key
                            ? "bg-app-primary/20 text-app-primary"
                            : "bg-slate-100 text-slate-500 group-hover:bg-app-primary/20 group-hover:text-app-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={8}
                      className="z-50 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm"
                    >
                      {item.label}
                      <Tooltip.Arrow className="fill-slate-900" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            })
          ) : (
            groups.map((group) => (
              <section key={group.title} className="dashboard-nav-section">
                <p className="dashboard-nav-title px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = iconByKey[item.key] ?? LayoutGrid;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => onSelect(item.key)}
                      className={`dashboard-nav-item group flex w-full items-center gap-2.5 rounded-lg py-[7px] text-left text-[13px] font-semibold transition-all duration-200 ease-out px-3 hover:translate-x-0.5 hover:bg-slate-100 ${
                        activeKey === item.key ? "bg-app-primary/10 text-app-primary" : "text-slate-700"
                      }`}
                    >
                      <span
                        className={`dashboard-nav-icon rounded-md p-[3px] ${
                          activeKey === item.key
                            ? "bg-app-primary/20 text-app-primary"
                            : "bg-slate-100 text-slate-500 group-hover:bg-app-primary/20 group-hover:text-app-primary"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </section>
            ))
          )}
        </nav>
      </motion.aside>
    </Tooltip.Provider>
  );
}
