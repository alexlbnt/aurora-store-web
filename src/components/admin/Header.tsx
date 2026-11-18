"use client";

import React, { useState, useMemo, useRef } from "react";
import { Search, PanelLeftClose, PanelLeft, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminSidebar } from "./AdminSidebarContext";
import AdminNotificationsPopover from "./AdminNotificationsPopover";
import { adminSearchTarget, adminSearchUrl } from "@/lib/admin-search";

export default function Header({
  title = "Visão Geral",
}: {
  title?: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed } = useAdminSidebar();

  // Celular: a lupa abre um campo na largura do topo.
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const { placeholder } = adminSearchTarget(pathname);

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    searchButtonRef.current?.focus();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = adminSearchUrl(pathname, searchQuery);
    if (!url) return;
    router.push(url);
    setMobileSearchOpen(false);
  };

  const displayTitle = useMemo(() => {
    if (title && title !== "Visão Geral") return title;
    if (pathname === "/admin") return "Visão Geral";
    if (pathname === "/admin/sales/new") return "Novo pedido";
    if (pathname.startsWith("/admin/sales/") && pathname.endsWith("/edit")) return "Editar pedido";
    if (pathname.startsWith("/admin/sales/")) return "Detalhes do Pedido";
    if (pathname.startsWith("/admin/sales")) return "Vendas";
    if (pathname === "/admin/products/new") return "Novo Produto";
    if (pathname.includes("/edit")) return "Editar Produto";
    if (pathname.startsWith("/admin/products")) return "Produtos";
    if (pathname === "/admin/customers/new") return "Novo Cliente";
    if (pathname.startsWith("/admin/customers/")) return "Editar Cliente";
    if (pathname.startsWith("/admin/customers")) return "Clientes";
    if (pathname.startsWith("/admin/categories")) return "Categorias";
    if (pathname.startsWith("/admin/finance")) return "Financeiro";
    if (pathname.startsWith("/admin/reports")) return "Relatórios";
    if (pathname.startsWith("/admin/settings")) return "Configurações";
    return title || "Visão Geral";
  }, [pathname, title]);

  return (
    <header className="relative h-16 bg-white dark:bg-background-dark border-b border-primary/10 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 w-full transition-colors">
      <div className="flex items-center gap-3">
        {/* Botão Desktop para recolher / expandir barra lateral */}
        <button
          onClick={toggleCollapsed}
          className="hidden lg:flex items-center justify-center p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors cursor-pointer"
          title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
          aria-label={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-5 h-5" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <h1 className="text-lg lg:text-xl font-semibold text-primary truncate max-w-[200px] sm:max-w-md">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <form onSubmit={handleSearch} className="relative hidden md:block group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder={placeholder}
            aria-label={placeholder.replace("…", "")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary w-56 lg:w-64 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
          />
        </form>
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            ref={searchButtonRef}
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            aria-label={placeholder.replace("…", "")}
            aria-expanded={mobileSearchOpen}
            aria-controls="admin-mobile-search"
            className="md:hidden flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>
          <AdminNotificationsPopover />
        </div>
      </div>

      {mobileSearchOpen && (
        <form
          id="admin-mobile-search"
          role="search"
          onSubmit={handleSearch}
          className="md:hidden absolute inset-0 z-20 flex items-center gap-2 bg-white dark:bg-background-dark px-3"
        >
          <Search className="w-5 h-5 shrink-0 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            enterKeyHint="search"
            autoFocus
            placeholder={placeholder}
            aria-label={placeholder.replace("…", "")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") closeMobileSearch();
            }}
            className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2 text-base [&::-webkit-search-cancel-button]:appearance-none text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-white"
          />
          <button
            type="button"
            onClick={closeMobileSearch}
            aria-label="Fechar busca"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      )}
    </header>
  );
}
