"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { AdminSidebarProvider, useAdminSidebar } from "./AdminSidebarContext";

function AdminLayoutInner({
  sidebar,
  pageTitle,
  children,
}: {
  sidebar: React.ReactNode;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  const { isMobileOpen, closeMobile } = useAdminSidebar();
  const pathname = usePathname();

  // Fecha o drawer mobile ao navegar
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative w-full">
      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar (Drawer no mobile, retrátil dinâmico no desktop) */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex h-full shadow-2xl lg:shadow-none shrink-0`}
      >
        {sidebar}
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full lg:w-auto transition-all duration-300">
        <Header title={pageTitle} />
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayoutClient({
  sidebar,
  pageTitle,
  children,
}: {
  sidebar: React.ReactNode;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  return (
    <AdminSidebarProvider>
      <AdminLayoutInner sidebar={sidebar} pageTitle={pageTitle}>
        {children}
      </AdminLayoutInner>
    </AdminSidebarProvider>
  );
}
