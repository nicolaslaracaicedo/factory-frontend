"use client";

import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LayoutGrid, LogOut, UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AuthUser, UserRole } from "@/src/modules/auth/types/auth.types";
import type { SidebarGroup } from "@/src/modules/dashboard/config/role-dashboard.config";
import { iconByKey } from "@/src/components/dashboard/side-nav";
import { readCompanyCache, writeCompanyCache, writeCompanyThemeCache } from "@/src/modules/company/utils/company-cache.utils";
import type { BreadcrumbItem } from "@/src/components/ui/breadcrumbs";
import { Breadcrumbs } from "@/src/components/ui/breadcrumbs";
import { useBreadcrumbs } from "@/src/components/ui/breadcrumbs-context";

interface TopNavbarProps {
  role: UserRole;
  user: AuthUser;
  onLogout: () => void | Promise<void>;
  menuGroups?: SidebarGroup[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  defaultBreadcrumbs?: BreadcrumbItem[];
}

export function TopNavbar({
  role,
  user,
  onLogout,
  menuGroups,
  activeKey,
  onSelect,
  defaultBreadcrumbs,
}: TopNavbarProps) {
  const fullName =
    user.nombre || user.apellido
      ? `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim()
      : "Usuario";
  const { breadcrumbs: overrideBreadcrumbs } = useBreadcrumbs();
  const breadcrumbItems = overrideBreadcrumbs ?? defaultBreadcrumbs ?? [{ label: "Inicio" }];
  const [ambiente, setAmbiente] = useState(() => readCompanyCache()?.ambiente ?? 1);
  const [runIntro, setRunIntro] = useState(false);

  useEffect(() => {
    const cached = readCompanyCache();
    if (cached?.ambiente) {
      setAmbiente(cached.ambiente);
    }

    fetch("/api/empresa")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          if (data.data.ambiente) setAmbiente(data.data.ambiente);
          writeCompanyCache(data.data);
          writeCompanyThemeCache(data.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const key = "factory_first_login_nav_intro_done";
    const alreadyAnimated = sessionStorage.getItem(key);
    if (!alreadyAnimated) {
      setRunIntro(true);
      sessionStorage.setItem(key, "1");
    }
  }, []);

  return (
    <motion.header
      initial={runIntro ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="dashboard-topbar sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur sm:px-6"
    >
      <div>
        <Breadcrumbs items={breadcrumbItems} className="dashboard-breadcrumbs text-[11px]" />
      </div>

      <div className="flex items-center gap-2">
        <span className={`dashboard-env-badge inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
          ambiente === 2
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        }`}>
          {ambiente === 2 ? "Producción" : "Modo Pruebas"}
        </span>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="dashboard-user-trigger inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition-all duration-200 ease-out hover:bg-slate-50 hover:shadow-sm"
            >
              <UserCircle2 className="dashboard-user-icon h-6 w-6 text-app-primary" />
              <div className="flex flex-col items-start gap-0">
                <span className="dashboard-user-name text-sm font-semibold text-slate-800 leading-tight">{fullName}</span>
                <span className="dashboard-user-role text-[10px] font-semibold uppercase tracking-wide text-slate-400 leading-tight">
                  {role}
                </span>
              </div>
              <ChevronDown className="dashboard-user-chevron h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              className="dashboard-user-menu z-50 min-w-[280px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="dashboard-user-menu-head px-2 py-2 space-y-2">
<div className="flex items-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                    Sesión activa
                  </span>
                </div>
                <div className="dashboard-user-meta space-y-0.5">
                  <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                  <p className="text-sm text-slate-500">{user.ruc}</p>
                  <p className="text-sm text-slate-400 capitalize">{role.toLowerCase()}</p>
                </div>
              </div>

              {menuGroups?.map((group) => (
                <div key={group.title}>
                  <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />
                  <div className="px-2 py-1">
                    <p className="dashboard-user-menu-title text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {group.title}
                    </p>
                    <div className="dashboard-user-menu-items mt-1 space-y-1">
                      {group.items.map((item) => {
                        const Icon = iconByKey[item.key] ?? LayoutGrid;

                        return (
                          <DropdownMenu.Item
                            key={item.key}
                            onSelect={(event) => {
                              event.preventDefault();
                              onSelect?.(item.key);
                            }}
                            className={`dashboard-user-menu-item flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-semibold outline-none transition-all duration-200 ease-out hover:bg-slate-100 hover:translate-x-0.5 ${
                              activeKey === item.key
                                ? "bg-app-primary/10 text-app-primary"
                                : "text-slate-700"
                            }`}
                          >
                            <span
                              className={`dashboard-user-menu-icon rounded-md p-[3px] ${
                                activeKey === item.key
                                  ? "bg-app-primary/20 text-app-primary"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span>{item.label}</span>
                          </DropdownMenu.Item>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />

              <DropdownMenu.Item
                className="dashboard-user-menu-item flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-semibold text-rose-600 outline-none transition-all duration-200 ease-out hover:bg-rose-50 hover:translate-x-0.5"
                onSelect={async (event) => {
                  event.preventDefault();
                  await onLogout();
                }}
              >
                <span className="dashboard-user-menu-icon rounded-md p-[3px] bg-rose-100 text-rose-600">
                  <LogOut className="h-4 w-4" />
                </span>
                <span>Cerrar sesión</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </motion.header>
  );
}
