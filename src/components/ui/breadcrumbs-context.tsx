"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { BreadcrumbItem } from "@/src/components/ui/breadcrumbs";

type BreadcrumbsContextValue = {
  breadcrumbs: BreadcrumbItem[] | null;
  setBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
  headerVisible: boolean;
  setHeaderVisible: (visible: boolean) => void;
};

const BreadcrumbsContext = createContext<BreadcrumbsContextValue | undefined>(undefined);

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);

  return (
    <BreadcrumbsContext.Provider
      value={{ breadcrumbs, setBreadcrumbs, headerVisible, setHeaderVisible }}
    >
      {children}
    </BreadcrumbsContext.Provider>
  );
}

export function useBreadcrumbs() {
  const context = useContext(BreadcrumbsContext);
  if (!context) {
    throw new Error("useBreadcrumbs must be used within BreadcrumbsProvider");
  }
  return context;
}
