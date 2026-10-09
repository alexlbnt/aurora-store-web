"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

type HeaderCategory = { id: string; name: string; slug: string };

export default function Header({ isAdmin, categories = [] }: { isAdmin?: boolean; categories?: HeaderCategory[] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount } = useCart();

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMenuOpen(false);
  }

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  // Prevent scroll when menu is open
  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 justify-between border-b border-primary/10 transition-colors">
        <button 
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMenuOpen}
          aria-controls="menu-lateral"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-primary dark:text-primary/80 flex size-10 shrink-0 items-center justify-center hover:bg-primary/5 rounded-full transition-colors relative z-50"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMenuOpen ? "close" : "menu"}
          </span>
        </button>
        <div className="text-primary dark:text-primary/90 text-2xl font-serif flex-1 text-center relative z-50">
          <Link href="/" aria-label="Aurora, página inicial">Aurora</Link>
        </div>
        <div className="flex items-center gap-1 shrink-0 relative z-50">
          {isAdmin && (
            <Link href="/admin" aria-label="Painel administrativo" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors hidden sm:flex">
              <span className="material-symbols-outlined text-[24px]">admin_panel_settings</span>
            </Link>
          )}
          <Link href="/catalog" aria-label="Buscar produtos" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </Link>
          <Link href="/wishlist" aria-label="Lista de desejos" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors hidden sm:flex">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
          </Link>
          <Link href="/account" aria-label="Minha conta" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </Link>
          <Link href="/cart" aria-label={cartCount > 0 ? `Sacola, ${cartCount} ${cartCount === 1 ? "item" : "itens"}` : "Sacola"} className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors relative">
            <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
            {cartCount > 0 && (
              <span className="absolute top-2 right-2 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm border border-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Backdrop for Sidebar */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Side Drawer Menu */}
      <div 
        id="menu-lateral"
        inert={!isMenuOpen}
        className={`fixed inset-y-0 left-0 w-72 bg-background-light dark:bg-background-dark z-40 transition-[transform,box-shadow] duration-300 flex flex-col pt-[72px] ${
          isMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full shadow-none"
        }`}
      >
        <div className="flex flex-col h-full gap-4 p-6 overflow-y-auto">
          <nav className="flex flex-col gap-3 w-full">
            <Link href="/" className="text-xl font-serif text-primary dark:text-slate-100 hover:text-primary/60 transition-colors" onClick={() => setIsMenuOpen(false)}>Início</Link>
            <Link href="/catalog" className="text-xl font-serif text-primary dark:text-slate-100 hover:text-primary/60 transition-colors" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
            
            <div className="w-full h-px bg-primary/10 dark:bg-slate-800 my-2" />
            
            <span className="text-sm font-semibold text-primary/60 dark:text-slate-400 mb-1">Categorias</span>
            {categories.length > 0 ? (
              categories.map(cat => (
                <Link key={cat.id} href={`/category/${cat.slug}`} className="text-base font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors capitalize" onClick={() => setIsMenuOpen(false)}>
                  {cat.name}
                </Link>
              ))
            ) : null}

            <div className="w-full h-px bg-primary/10 dark:bg-slate-800 my-2" />
            
            <Link href="/wishlist" className="flex items-center gap-2 text-base font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">favorite</span> Lista de desejos
            </Link>
            <Link href="/account" className="flex items-center gap-2 text-base font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors" onClick={() => setIsMenuOpen(false)}>
              <span className="material-symbols-outlined">person</span> Minha Conta
            </Link>
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 text-base font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors" onClick={() => setIsMenuOpen(false)}>
                <span className="material-symbols-outlined">admin_panel_settings</span> Painel Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </>
  );
}
