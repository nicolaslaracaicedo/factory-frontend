"use client";

import { useEffect, useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, UserCircle2 } from "lucide-react";
import type { AuthUser, UserRole } from "@/src/modules/auth/types/auth.types";
import { companyService } from "@/src/modules/company/services/company.service";
import type { Company } from "@/src/modules/company/types/company.types";

interface TopNavbarProps {
  role: UserRole;
  user: AuthUser;
  onLogout: () => void | Promise<void>;
}

export function TopNavbar({ role, user, onLogout }: TopNavbarProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const fullName =
    user.nombre || user.apellido
      ? `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim()
      : "Usuario";

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
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/85 px-5 backdrop-blur sm:px-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
          Panel {role}
        </p>
        <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
          {company?.nombre_comercial || "Empresa"}
        </h1>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left transition-colors hover:bg-slate-50"
          >
          <UserCircle2 className="h-6 w-6 text-app-primary" />
            <div className="text-sm leading-tight">
              <p className="font-semibold text-slate-800">{fullName}</p>
              <p className="text-xs text-slate-500">{user.ruc}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            align="end"
            className="z-50 min-w-[220px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
          >
            <div className="px-2 py-1.5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Sesión activa</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{fullName}</p>
              <p className="text-xs text-slate-500">Rol: {role}</p>
            </div>

            <DropdownMenu.Separator className="my-1 h-px bg-slate-200" />

            <DropdownMenu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-rose-700 outline-none transition-colors hover:bg-rose-50"
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
    </header>
  );
}
