"use client";

import { useEffect, useState, type ComponentType } from "react";
import {
  Building2,
  FileCode,
  FileText,
  LayoutGrid,
  MapPinHouse,
  Package,
  PackageSearch,
  Percent,
  ReceiptText,
  Settings,
  ShieldCheck,
  Signature,
  Store,
  Users,
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
  proveedores: Users,
  "grupos-producto": PackageSearch,
  productos: Package,
  facturas: ReceiptText,
  "notas-credito": FileText,
  "notas-debito": FileText,
  "guias-remision": FileText,
  retenciones: FileText,
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
    <aside className="h-full overflow-y-auto border-r border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-20 items-center justify-center px-5">
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

      <nav className="space-y-5 px-3 pb-6">
        {groups.map((group) => (
          <section key={group.title} className="space-y-1.5">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {group.title}
            </p>

            {group.items.map((item) => {
              const Icon = iconByKey[item.key] ?? LayoutGrid;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  className={`group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100 ${
                    activeKey === item.key ? "bg-app-primary/10" : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 rounded-lg p-1.5 ${
                      activeKey === item.key
                        ? "bg-app-primary/20 text-app-primary"
                        : "bg-slate-100 text-slate-600 group-hover:bg-app-primary/20 group-hover:text-app-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span
                      className={`block text-sm font-semibold ${
                        activeKey === item.key ? "text-app-primary" : "text-slate-800"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="block text-xs text-slate-500">{item.hint}</span>
                  </span>
                </button>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}
