"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import { AdminSidebarProvider, useAdminSidebar } from "./AdminSidebarContext";

import AdminMobileNav from "./AdminMobileNav";
import RouteProgressBar from "./RouteProgressBar";
import ToastContainer from "@/components/ui/Toast";
import { ConfirmProvider } from "./ui/ConfirmDialog";

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
    <ConfirmProvider>
    <div className="flex h-[100dvh] overflow-hidden bg-background-light text-primary font-display relative w-full">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100000] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Ir para o conteúdo
      </a>
      <RouteProgressBar />
      <ToastContainer />
      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 bg-primary/60 z-40 lg:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar (Drawer no mobile, retrátil dinâmico no desktop) */}
      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex h-full lg:shadow-none shrink-0 ${
          isMobileOpen ? "shadow-2xl" : ""
        }`}
      >
        {sidebar}
      </div>

      {/* Conteúdo Principal */}
      <main id="conteudo" tabIndex={-1} className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full lg:w-auto transition-all duration-300 focus:outline-none">
        <Header title={pageTitle} />
        <div className="flex-1 p-3.5 sm:p-4 lg:p-8 overflow-x-hidden pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Barra de Navegação Inferior Mobile */}
      <AdminMobileNav />
    </div>
    </ConfirmProvider>
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
