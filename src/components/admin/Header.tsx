"use client";

import React, { useState } from "react";
import { Search, Bell, HelpCircle } from "lucide-react";

export default function Header({ title = "Visão Geral" }: { title?: string }) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-white dark:bg-background-dark border-b border-primary/10 flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Buscar..."
            aria-label="Campo de busca do painel"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:ring-1 focus:ring-accent-blue focus:border-accent-blue w-64 outline-none transition-all placeholder:text-slate-400" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            aria-label="Abrir Notificações"
            className="relative size-9 flex items-center justify-center rounded-lg hover:bg-accent-blue/10 dark:hover:bg-accent-blue/20 hover:text-accent-blue dark:hover:text-accent-blue text-slate-600 dark:text-slate-400 transition-colors"
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
          <button 
            aria-label="Central de Ajuda"
            className="size-9 flex items-center justify-center rounded-lg hover:bg-accent-blue/10 dark:hover:bg-accent-blue/20 hover:text-accent-blue dark:hover:text-accent-blue text-slate-600 dark:text-slate-400 transition-colors"
          >
            <HelpCircle className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
