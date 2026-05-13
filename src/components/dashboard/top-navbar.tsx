"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LayoutGrid, LogOut, PanelRightOpen, UserCircle2 } from "lucide-react";
import type { AuthUser, UserRole } from "@/src/modules/auth/types/auth.types";
import type { SidebarGroup } from "@/src/modules/dashboard/config/role-dashboard.config";
import { iconByKey } from "@/src/components/dashboard/side-nav";
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
  const hasMenu = Boolean(menuGroups?.some((group) => group.items.length));
  const { breadcrumbs: overrideBreadcrumbs } = useBreadcrumbs();
  const breadcrumbItems = overrideBreadcrumbs ?? defaultBreadcrumbs ?? [{ label: "Inicio" }];

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur sm:px-6">
      <div>
        <Breadcrumbs items={breadcrumbItems} className="text-[11px]" />
      </div>

      <div className="flex items-center gap-3">
        {hasMenu ? (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <PanelRightOpen className="h-4 w-4 text-app-primary" />
                Accesos
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="z-50 min-w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
              >
                {menuGroups?.map((group) => (
                  <div key={group.title} className="px-2 py-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {group.title}
                    </p>
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const Icon = iconByKey[item.key] ?? LayoutGrid;

                        return (
                          <DropdownMenu.Item
                            key={item.key}
                            onSelect={(event) => {
                              event.preventDefault();
                              onSelect?.(item.key);
                            }}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-slate-50 ${
                              activeKey === item.key
                                ? "bg-app-primary/10 text-app-primary"
                                : "text-slate-700"
                            }`}
                          >
                            <span
                              className={`rounded-lg p-1 ${
                                activeKey === item.key
                                  ? "bg-app-primary/15 text-app-primary"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="font-medium">{item.label}</span>
                          </DropdownMenu.Item>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        ) : null}

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm transition-colors hover:bg-slate-50"
            >
              <UserCircle2 className="h-5 w-5 text-app-primary" />
              <span className="font-semibold text-slate-800">{fullName}</span>
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              className="z-50 min-w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="px-2 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                    Sesión activa
                  </span>
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-800">{fullName}</p>
                  <p className="text-sm text-slate-500">{user.ruc}</p>
                  <p className="text-sm text-slate-400 capitalize">{role.toLowerCase()}</p>
                </div>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />

              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-600 outline-none transition-colors hover:bg-rose-50"
                onSelect={async (event) => {
                  event.preventDefault();
                  await onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
