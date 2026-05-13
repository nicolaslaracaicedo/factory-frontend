"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Building2,
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
  Settings,
  ShieldCheck,
  ShoppingCart,
  Signature,
  Store,
  Truck,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";
import type { SidebarGroup } from "@/src/modules/dashboard/config/role-dashboard.config";
import { companyService } from "@/src/modules/company/services/company.service";
import type { Company } from "@/src/modules/company/types/company.types";

interface SideNavProps {
  groups: SidebarGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
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
  usuarios: Settings,
};

export function SideNav({ groups, activeKey, onSelect }: SideNavProps) {
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const response = await companyService.getCompany();
        setCompany(response);
      } catch {
        setCompany(null);
      }
    };

    void loadCompany();
  }, []);

  return (
    <aside className="sticky top-0 h-screen overflow-y-auto border-r border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-center px-4">
        <div className="w-full flex justify-center">
          {company?.logo ? (
            <img
              src={company.logo}
              alt="Logo de empresa"
              className="max-h-14 w-full object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Logo
            </div>
          )}
        </div>
      </div>

      <nav className="space-y-4 px-3 pb-6">
        {groups.map((group) => (
          <section key={group.title} className="space-y-1.5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              {group.title}
            </p>

            {group.items.map((item) => {
              const Icon = iconByKey[item.key] ?? LayoutGrid;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors hover:bg-slate-100 ${
                    activeKey === item.key ? "bg-app-primary/10 text-app-primary" : "text-slate-800"
                  }`}
                >
                  <span
                    className={`rounded-lg p-1.5 ${
                      activeKey === item.key
                        ? "bg-app-primary/20 text-app-primary"
                        : "bg-slate-100 text-slate-600 group-hover:bg-app-primary/20 group-hover:text-app-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}
