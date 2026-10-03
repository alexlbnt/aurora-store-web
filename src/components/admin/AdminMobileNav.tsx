"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminMobileNav() {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Clear pending state when the route catches up
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const activePath = pendingHref || pathname;

  const isHomeActive = activePath === "/admin";
  const isSalesActive = activePath === "/admin/sales" || (activePath.startsWith("/admin/sales/") && activePath !== "/admin/sales/new");
  const isNewSaleActive = activePath === "/admin/sales/new";
  const isProductsActive = activePath.startsWith("/admin/products");
  const isCustomersActive = activePath.startsWith("/admin/customers");

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around select-none"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {/* 1. Início */}
      <Link
        href="/admin"
        prefetch={true}
        onClick={() => setPendingHref("/admin")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isHomeActive
            ? "text-primary dark:text-primary font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isHomeActive ? "scale-110 font-bold" : ""
          }`}
        >
          dashboard
        </span>
        <span className="text-[10px] mt-0.5 tracking-tight truncate">Início</span>
      </Link>

      {/* 2. Vendas */}
      <Link
        href="/admin/sales"
        prefetch={true}
        onClick={() => setPendingHref("/admin/sales")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isSalesActive
            ? "text-primary dark:text-primary font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isSalesActive ? "scale-110 font-bold" : ""
          }`}
        >
          shopping_cart
        </span>
        <span className="text-[10px] mt-0.5 tracking-tight truncate">Vendas</span>
      </Link>

      {/* 3. Botão Central: Nova Venda Rápida */}
      <Link
        href="/admin/sales/new"
        prefetch={true}
        onClick={() => setPendingHref("/admin/sales/new")}
        className="flex flex-col items-center justify-center flex-1 -mt-4 relative group"
        title="Registrar Nova Venda"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
            isNewSaleActive
              ? "bg-primary text-white ring-4 ring-primary/20 scale-105"
              : "bg-primary hover:bg-primary/90 text-white shadow-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-[26px]">add</span>
        </div>
        <span
          className={`text-[10px] mt-1 font-bold tracking-tight truncate ${
            isNewSaleActive ? "text-primary font-bold" : "text-slate-600 dark:text-slate-300"
          }`}
        >
          + Venda
        </span>
      </Link>

      {/* 4. Produtos */}
      <Link
        href="/admin/products"
        prefetch={true}
        onClick={() => setPendingHref("/admin/products")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isProductsActive
            ? "text-primary dark:text-primary font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isProductsActive ? "scale-110 font-bold" : ""
          }`}
        >
          inventory_2
        </span>
        <span className="text-[10px] mt-0.5 tracking-tight truncate">Produtos</span>
      </Link>

      {/* 5. Clientes */}
      <Link
        href="/admin/customers"
        prefetch={true}
        onClick={() => setPendingHref("/admin/customers")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isCustomersActive
            ? "text-primary dark:text-primary font-bold"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isCustomersActive ? "scale-110 font-bold" : ""
          }`}
        >
          group
        </span>
        <span className="text-[10px] mt-0.5 tracking-tight truncate">Clientes</span>
      </Link>
    </nav>
  );
}
