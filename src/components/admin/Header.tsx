import React from "react";

export default function Header({ title = "Visão Geral" }: { title?: string }) {
  return (
    <header className="h-16 bg-white dark:bg-background-dark border-b border-primary/10 flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="pl-10 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary w-64 outline-none transition-all placeholder:text-slate-400" 
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="relative size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
          <button className="size-9 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
            <span className="material-symbols-outlined">help_outline</span>
          </button>
        </div>
      </div>
    </header>
  );
}
