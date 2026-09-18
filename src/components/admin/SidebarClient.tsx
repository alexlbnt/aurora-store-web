"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import { useAdminSidebar } from "./AdminSidebarContext";

interface SidebarClientProps {
  session: any;
}

export default function SidebarClient({ session }: SidebarClientProps) {
  const pathname = usePathname();
  const { isCollapsed, toggleCollapsed, closeMobile } = useAdminSidebar();

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: "dashboard", exact: true },
    { label: "Vendas", href: "/admin/sales", icon: "shopping_cart" },
    { label: "Produtos", href: "/admin/products", icon: "inventory_2" },
    { label: "Clientes", href: "/admin/customers", icon: "group" },
    { label: "Relatórios", href: "/admin/reports", icon: "bar_chart" },
  ];

  const isLinkActive = (item: { href: string; exact?: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const userName = session?.user?.name || "Administrador";
  const userEmail = session?.user?.email || "admin@aurora.com";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={`relative h-full bg-background-dark text-slate-100 flex flex-col border-r border-primary/20 shrink-0 select-none transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Cabeçalho / Logo */}
      <div className={`p-4 flex items-center border-b border-primary/10 min-h-[72px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <Link
          href="/admin"
          onClick={closeMobile}
          className="flex items-center gap-3 overflow-hidden group"
          title="Aurora Admin"
        >
          <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-xl">flare</span>
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-200 overflow-hidden whitespace-nowrap">
              <h1 className="text-lg font-bold leading-none tracking-tight">Aurora</h1>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                Admin Panel
              </p>
            </div>
          )}
        </Link>

        {/* Botão de Fechar no Mobile */}
        <button
          onClick={closeMobile}
          className="lg:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          aria-label="Fechar menu"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = isLinkActive(item);

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                onClick={closeMobile}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "text-slate-400 hover:bg-primary/20 hover:text-white font-medium"
                } ${isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="whitespace-nowrap truncate">{item.label}</span>
                )}
              </Link>

              {/* Tooltip flutuante quando retraído */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 border border-slate-800">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Rodapé da Sidebar */}
      <div className="p-3 border-t border-primary/10 space-y-1.5">
        {/* Configurações */}
        <div className="relative group">
          <Link
            href="/admin/settings"
            onClick={closeMobile}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-primary/20 hover:text-white transition-all font-medium ${
              pathname === "/admin/settings" ? "bg-primary/20 text-white font-bold" : ""
            } ${isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
            title={isCollapsed ? "Configurações" : undefined}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">settings</span>
            {!isCollapsed && <span className="whitespace-nowrap truncate">Configurações</span>}
          </Link>

          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 border border-slate-800">
              Configurações
            </div>
          )}
        </div>

        {/* Ver Loja */}
        <div className="relative group">
          <Link
            href="/"
            target="_blank"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all font-medium ${
              isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""
            }`}
            title={isCollapsed ? "Ver Loja" : undefined}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">storefront</span>
            {!isCollapsed && <span className="whitespace-nowrap truncate">Ver Loja</span>}
          </Link>

          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-emerald-400 text-xs font-semibold rounded-md shadow-xl whitespace-nowrap pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 border border-slate-800">
              Ver Loja (Abrir em nova aba)
            </div>
          )}
        </div>

        {/* Card do Usuário */}
        <div className={`mt-3 rounded-xl bg-slate-800/60 border border-primary/10 ${isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-2.5 flex items-center justify-between"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="size-8 rounded-full bg-primary/30 border border-primary/40 flex items-center justify-center shrink-0 font-bold text-xs text-primary-light text-white"
              title={`${userName} (${userEmail})`}
            >
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-100 truncate">{userName}</span>
                <span className="text-[10px] text-slate-400 uppercase truncate">{userEmail}</span>
              </div>
            )}
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="p-1.5 hover:bg-slate-700/80 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center justify-center"
              title="Sair do painel"
              aria-label="Sair do painel"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
