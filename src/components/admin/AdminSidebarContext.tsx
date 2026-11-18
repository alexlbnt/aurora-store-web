"use client";

import React, { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from "react";

interface AdminSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
}

// Preferência "barra recolhida" vale durante a visita (sessionStorage); começa recolhida.
const COLLAPSED_KEY = "aurora_admin_sidebar_collapsed";
const collapsedListeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    return sessionStorage.getItem(COLLAPSED_KEY) !== "false";
  } catch {
    return true;
  }
}

function writeCollapsed(next: boolean) {
  try {
    sessionStorage.setItem(COLLAPSED_KEY, String(next));
  } catch {
    /* sem armazenamento: vale só até recarregar */
  }
  collapsedListeners.forEach((l) => l());
}

function subscribeCollapsed(onChange: () => void) {
  collapsedListeners.add(onChange);
  return () => {
    collapsedListeners.delete(onChange);
  };
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  // Padrão: barra lateral sempre começa RETRAÍDA ao abrir o site
  const isCollapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => true);

  // Limpa a chave antiga do localStorage (o padrão agora é começar retraída a cada visita).
  useEffect(() => {
    try {
      localStorage.removeItem(COLLAPSED_KEY);
    } catch {
      /* sem armazenamento */
    }
  }, []);

  const setIsCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof value === "function" ? value(readCollapsed()) : value;
    writeCollapsed(next);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  return (
    <AdminSidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
      }}
    >
      {children}
    </AdminSidebarContext.Provider>
  );
}

export const useAdminSidebar = () => {
  const context = useContext(AdminSidebarContext);
  if (!context) {
    throw new Error("useAdminSidebar deve ser usado dentro de AdminSidebarProvider");
  }
  return context;
};
