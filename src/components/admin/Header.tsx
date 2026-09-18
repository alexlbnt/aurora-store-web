"use client";

import React, { useState } from "react";
import { Search, Bell, HelpCircle, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAdminSidebar } from "./AdminSidebarContext";

export default function Header({
  title = "Visão Geral",
}: {
  title?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { isCollapsed, toggleCollapsed, toggleMobile } = useAdminSidebar();

  return (
    <header className="h-16 bg-white dark:bg-background-dark border-b border-primary/10 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 w-full transition-colors">
      <div className="flex items-center gap-3">
        {/* Botão Mobile para abrir gaveta */}
        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

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

        <h2 className="text-lg lg:text-xl font-bold text-primary truncate max-w-[200px] sm:max-w-md">
          {title}
        </h2>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <div className="relative hidden md:block group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Buscar no painel..."
            aria-label="Campo de busca do painel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary w-56 lg:w-64 outline-none transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Notificações"
            className="relative size-9 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
          <button
            aria-label="Central de Ajuda"
            className="size-9 flex items-center justify-center rounded-lg hover:bg-primary/10 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
            title="Ajuda e Documentação"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
