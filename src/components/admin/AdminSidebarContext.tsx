"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AdminSidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleCollapsed: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const AdminSidebarContext = createContext<AdminSidebarContextType | undefined>(undefined);

export function AdminSidebarProvider({ children }: { children: React.ReactNode }) {
  // Padrão: barra lateral sempre começa RETRAÍDA ao abrir o site
  const [isCollapsed, setIsCollapsedState] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Mantém a preferência durante a sessão de navegação ativa
  useEffect(() => {
    try {
      // Limpa qualquer chave antiga do localStorage para garantir o novo padrão retraído
      localStorage.removeItem("aurora_admin_sidebar_collapsed");

      const saved = sessionStorage.getItem("aurora_admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsedState(saved === "true");
      } else {
        setIsCollapsedState(true);
      }
    } catch (e) {
      console.warn("Não foi possível acessar storage:", e);
    }
  }, []);

  const setIsCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsCollapsedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        sessionStorage.setItem("aurora_admin_sidebar_collapsed", String(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, [setIsCollapsed]);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <AdminSidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        toggleMobile,
        closeMobile,
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
