"use client";

import { createContext, useContext, type ReactNode } from "react";

type DashboardSectionContextValue = {
  activeSection: string;
  setActiveSection: (section: string) => void;
};

const DashboardSectionContext = createContext<DashboardSectionContextValue | undefined>(undefined);

export function DashboardSectionProvider({
  activeSection,
  setActiveSection,
  children,
}: {
  activeSection: string;
  setActiveSection: (section: string) => void;
  children: ReactNode;
}) {
  return (
    <DashboardSectionContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </DashboardSectionContext.Provider>
  );
}

export function useDashboardSection() {
  const context = useContext(DashboardSectionContext);
  if (!context) {
    throw new Error("useDashboardSection must be used within DashboardSectionProvider");
  }
  return context;
}
