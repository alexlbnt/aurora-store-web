"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import {
  MOBILE_TABS_AFTER_NEW,
  MOBILE_TABS_BEFORE_NEW,
  NEW_ORDER_HREF,
  isMoreActive,
  isNavItemActive,
  mobileMoreItems,
  mobileTabs,
  type AdminNavItem,
} from "@/lib/admin-nav";

// Navegação do painel no celular: 4 atalhos + "Novo pedido" no centro. As demais telas
// ficam em "Mais", uma folha que sobe de baixo. A lista de telas vem de lib/admin-nav.

const tabClass = (active: boolean) =>
  `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all active:scale-95 ${
    active ? "text-primary font-semibold" : "text-primary/70 hover:text-primary font-medium"
  }`;

function TabIcon({ icon, active }: { icon: string; active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined text-[22px] transition-transform ${active ? "scale-110 font-bold" : ""}`}
    >
      {icon}
    </span>
  );
}

export default function AdminMobileNav({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);

  // Limpa o destaque "otimista" quando a rota chega
  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const activePath = pendingHref || pathname;
  const moreItems = mobileMoreItems();
  const moreActive = isMoreActive(activePath);

  const openMore = () => {
    sheetRef.current?.showModal();
    setMoreOpen(true);
  };
  const closeMore = () => sheetRef.current?.close(); // onClose atualiza o estado

  const go = (href: string) => {
    setPendingHref(href);
    closeMore();
  };

  const renderTab = (item: AdminNavItem) => {
    const active = isNavItemActive(activePath, item);
    return (
      <Link
        key={item.id}
        href={item.href}
        prefetch={true}
        onClick={() => go(item.href)}
        aria-current={active ? "page" : undefined}
        className={tabClass(active)}
      >
        <TabIcon icon={item.icon} active={active} />
        <span className="text-xs mt-0.5 truncate">{item.shortLabel ?? item.label}</span>
      </Link>
    );
  };

  const isNewOrderActive = activePath === NEW_ORDER_HREF;
  const userInitial = (user.name || "A").charAt(0).toUpperCase();

  return (
    <>
      <nav
        aria-label="Navegação do painel"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-primary/10 px-2 py-1 flex items-center justify-around select-none"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {mobileTabs(MOBILE_TABS_BEFORE_NEW).map(renderTab)}

        {/* Botão central: novo pedido */}
        <Link
          href={NEW_ORDER_HREF}
          prefetch={true}
          onClick={() => go(NEW_ORDER_HREF)}
          aria-current={isNewOrderActive ? "page" : undefined}
          className="flex flex-col items-center justify-center flex-1 -mt-4 relative group"
          title="Registrar um novo pedido"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
              isNewOrderActive
                ? "bg-primary text-white ring-4 ring-primary/20 scale-105"
                : "bg-primary hover:bg-accent-blue text-white shadow-primary/30"
            }`}
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[26px]">add</span>
          </div>
          <span className={`text-xs mt-1 font-semibold truncate ${isNewOrderActive ? "text-primary" : "text-primary/80"}`}>
            Novo pedido
          </span>
        </Link>

        {mobileTabs(MOBILE_TABS_AFTER_NEW).map(renderTab)}

        {/* Mais: abre a folha com as demais telas */}
        <button
          type="button"
          onClick={openMore}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          className={`${tabClass(moreActive || moreOpen)} cursor-pointer`}
        >
          <TabIcon icon="menu" active={moreActive || moreOpen} />
          <span className="text-xs mt-0.5 truncate">Mais</span>
        </button>
      </nav>

      <dialog
        ref={sheetRef}
        aria-labelledby="admin-more-title"
        onClose={() => setMoreOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeMore(); // toque fora da folha
        }}
        className="lg:hidden m-0 mt-auto w-full max-w-none max-h-[85dvh] rounded-t-2xl bg-white p-0 text-primary shadow-2xl backdrop:bg-primary/50"
      >
        <div className="px-4 pt-3" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
          <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-primary/15" />
          <div className="mb-3 flex items-center justify-between">
            <h2 id="admin-more-title" className="text-base font-semibold">
              Mais opções
            </h2>
            <button
              type="button"
              onClick={closeMore}
              aria-label="Fechar"
              className="flex size-10 items-center justify-center rounded-lg text-primary/70 hover:bg-primary/5 cursor-pointer"
            >
              <span aria-hidden="true" className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2">
            {moreItems.map((item) => {
              const active = isNavItemActive(activePath, item);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    prefetch={true}
                    onClick={() => go(item.href)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-colors ${
                      active
                        ? "border-primary bg-primary text-white font-semibold"
                        : "border-primary/10 bg-background-light font-medium hover:border-primary/30"
                    }`}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMore}
                className="flex min-h-12 items-center gap-3 rounded-xl border border-primary/10 bg-background-light px-3 py-3 text-sm font-medium hover:border-primary/30"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[22px]">storefront</span>
                <span className="truncate">Ver a loja</span>
                <span className="sr-only">(abre em nova aba)</span>
              </a>
            </li>
          </ul>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-primary/10 pt-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-blue text-sm font-semibold text-white"
              >
                {userInitial}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                {user.email && <span className="truncate text-xs text-primary/60">{user.email}</span>}
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex min-h-10 items-center gap-1.5 rounded-lg border border-primary/15 px-3 text-sm font-medium hover:bg-primary/5 cursor-pointer"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-lg">logout</span>
                Sair
              </button>
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}
