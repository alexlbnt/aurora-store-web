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
      aria-label="Atalhos do painel"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-primary/10 px-2 py-1 flex items-center justify-around select-none"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {/* 1. Início */}
      <Link
        href="/admin"
        prefetch={true}
        onClick={() => setPendingHref("/admin")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isHomeActive
            ? "text-primary font-semibold"
            : "text-primary/70 hover:text-primary font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isHomeActive ? "scale-110 font-bold" : ""
          }`}
        >
          dashboard
        </span>
        <span className="text-xs mt-0.5 truncate">Início</span>
      </Link>

      {/* 2. Vendas */}
      <Link
        href="/admin/sales"
        prefetch={true}
        onClick={() => setPendingHref("/admin/sales")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isSalesActive
            ? "text-primary font-semibold"
            : "text-primary/70 hover:text-primary font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isSalesActive ? "scale-110 font-bold" : ""
          }`}
        >
          shopping_cart
        </span>
        <span className="text-xs mt-0.5 truncate">Vendas</span>
      </Link>

      {/* 3. Botão Central: Nova Venda Rápida */}
      <Link
        href="/admin/sales/new"
        prefetch={true}
        onClick={() => setPendingHref("/admin/sales/new")}
        className="flex flex-col items-center justify-center flex-1 -mt-4 relative group"
        title="Registrar um novo pedido"
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
            isNewSaleActive
              ? "bg-primary text-white ring-4 ring-primary/20 scale-105"
              : "bg-primary hover:bg-accent-blue text-white shadow-primary/30"
          }`}
        >
          <span className="material-symbols-outlined text-[26px]">add</span>
        </div>
        <span
          className={`text-xs mt-1 font-semibold truncate ${
            isNewSaleActive ? "text-primary" : "text-primary/80"
          }`}
        >
          Novo pedido
        </span>
      </Link>

      {/* 4. Produtos */}
      <Link
        href="/admin/products"
        prefetch={true}
        onClick={() => setPendingHref("/admin/products")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isProductsActive
            ? "text-primary font-semibold"
            : "text-primary/70 hover:text-primary font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isProductsActive ? "scale-110 font-bold" : ""
          }`}
        >
          inventory_2
        </span>
        <span className="text-xs mt-0.5 truncate">Produtos</span>
      </Link>

      {/* 5. Clientes */}
      <Link
        href="/admin/customers"
        prefetch={true}
        onClick={() => setPendingHref("/admin/customers")}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
          isCustomersActive
            ? "text-primary font-semibold"
            : "text-primary/70 hover:text-primary font-medium"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[22px] transition-transform ${
            isCustomersActive ? "scale-110 font-bold" : ""
          }`}
        >
          group
        </span>
        <span className="text-xs mt-0.5 truncate">Clientes</span>
      </Link>
    </nav>
  );
}
