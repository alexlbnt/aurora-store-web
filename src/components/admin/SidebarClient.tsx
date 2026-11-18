"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import type { Session } from "next-auth";
import { useAdminSidebar } from "./AdminSidebarContext";
import { isNavItemActive, navItemsByGroup, type AdminNavItem } from "@/lib/admin-nav";

interface SidebarClientProps {
  session: Session | null;
}

export default function SidebarClient({ session }: SidebarClientProps) {
  const pathname = usePathname();
  const { isCollapsed } = useAdminSidebar();

  const navItems = navItemsByGroup("main");
  const footerItems = navItemsByGroup("footer");
  // Na barra lateral "Vendas" continua acesa em "Novo pedido" (não há item próprio para ele aqui).
  const isLinkActive = (item: AdminNavItem) => isNavItemActive(pathname, { ...item, excludes: undefined });

  const userName = session?.user?.name || "Administrador";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside
      className={`relative h-full bg-background-dark text-slate-100 flex flex-col border-r border-white/10 shrink-0 select-none transition-[width] duration-300 ease-in-out ${
        isCollapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Cabeçalho / Logo */}
      <div className={`p-4 flex items-center border-b border-white/10 min-h-[72px] ${isCollapsed ? "justify-center" : "justify-between"}`}>
        <Link
          href="/admin"
          className="flex items-center gap-3 overflow-hidden group"
          title="Aurora Admin"
        >
          <div className="size-10 rounded-lg bg-accent-blue flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-white text-xl">flare</span>
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-200 overflow-hidden whitespace-nowrap">
              <p className="font-serif text-2xl leading-none">Aurora</p>
              <p className="text-xs text-slate-300 mt-1">Painel administrativo</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navegação Principal */}
      <nav aria-label="Seções do painel" className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = isLinkActive(item);

          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                prefetch={true}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent-blue text-white font-semibold"
                    : "text-slate-300 hover:bg-white/10 hover:text-white font-medium"
                } ${isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`material-symbols-outlined text-[20px] shrink-0 ${active ? "text-white" : "text-slate-300 group-hover:text-white"}`}>
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
      <div className="p-3 border-t border-white/10 space-y-1.5">
        {/* Configurações e demais itens do rodapé */}
        {footerItems.map((item) => {
          const active = isLinkActive(item);
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-colors font-medium ${
                  active ? "bg-accent-blue text-white font-semibold" : ""
                } ${isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap truncate">{item.label}</span>}
              </Link>

              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xl whitespace-nowrap pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 border border-slate-800">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Ver Loja */}
        <div className="relative group">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dew hover:bg-white/10 transition-colors font-medium ${
              isCollapsed ? "justify-center px-0 w-11 h-11 mx-auto" : ""
            }`}
            title={isCollapsed ? "Ver a loja" : undefined}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">storefront</span>
            {!isCollapsed && <span className="whitespace-nowrap truncate">Ver a loja</span>}
          </Link>

          {isCollapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-dew text-xs font-semibold rounded-md shadow-xl whitespace-nowrap pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 border border-slate-800">
              Ver a loja (nova aba)
            </div>
          )}
        </div>

        {/* Card do Usuário */}
        <div className={`mt-3 rounded-lg bg-white/5 border border-white/10 ${isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-2.5 flex items-center justify-between"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div
              className="size-8 rounded-full bg-accent-blue flex items-center justify-center shrink-0 font-semibold text-sm text-white"
              title={`${userName} (${userEmail})`}
            >
              {userInitial}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-slate-100 truncate">{userName}</span>
                <span className="text-xs text-slate-300 truncate">{userEmail}</span>
              </div>
            )}
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="size-10 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
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
