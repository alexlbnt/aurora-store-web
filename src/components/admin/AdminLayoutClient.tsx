"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";

export default function AdminLayoutClient({
  sidebar,
  pageTitle,
  children,
}: {
  sidebar: React.ReactNode;
  pageTitle?: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Fecha a sidebar ao mudar de página (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative w-full">
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar (Drawer no mobile, fixa no desktop) */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex h-full shadow-2xl lg:shadow-none`}>
        {sidebar}
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto w-full lg:w-auto">
        <Header title={pageTitle} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
