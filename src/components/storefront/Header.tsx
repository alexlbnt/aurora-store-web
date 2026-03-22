"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { cartCount } = useCart();

  // Close menu when route changes
  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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
          aria-label={isMenuOpen ? "Fechar Menu" : "Menu"} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-primary dark:text-primary/80 flex size-10 shrink-0 items-center justify-center hover:bg-primary/5 rounded-full transition-colors relative z-50"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMenuOpen ? "close" : "menu"}
          </span>
        </button>
        <h1 className="text-primary dark:text-primary/90 text-xl font-serif font-bold tracking-widest flex-1 text-center relative z-50">
          <Link href="/">AURORA</Link>
        </h1>
        <div className="flex items-center gap-1 shrink-0 relative z-50">
          <Link href="/catalog" aria-label="Search" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors hidden sm:flex">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors hidden sm:flex">
            <span className="material-symbols-outlined text-[24px]">favorite</span>
          </Link>
          <Link href="/account" aria-label="Account" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[24px]">person</span>
          </Link>
          <Link href="/cart" aria-label="Bag" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors relative">
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
        className={`fixed inset-y-0 left-0 w-72 bg-background-light dark:bg-background-dark z-40 shadow-2xl transition-transform duration-300 flex flex-col pt-[72px] ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto">
          <nav className="flex flex-col gap-5 w-full">
            <Link href="/" className="text-2xl font-serif text-primary dark:text-slate-100 hover:text-primary/60 transition-colors">Início</Link>
            <Link href="/catalog" className="text-2xl font-serif text-primary dark:text-slate-100 hover:text-primary/60 transition-colors">Catálogo</Link>
            
            <div className="w-full h-px bg-primary/10 dark:bg-slate-800 my-2" />
            
            <span className="text-sm font-bold uppercase tracking-widest text-primary/40 dark:text-slate-500 mb-2">Categorias</span>
            <Link href="/category/camisolas" className="text-lg font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors">Camisolas</Link>
            <Link href="/category/conjuntos" className="text-lg font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors">Conjuntos</Link>
            <Link href="/category/roupoes" className="text-lg font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors">Roupões</Link>
            <Link href="/category/acessorios" className="text-lg font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors">Acessórios</Link>

            <div className="w-full h-px bg-primary/10 dark:bg-slate-800 my-2" />
            
            <Link href="/account" className="flex items-center gap-2 text-lg font-medium text-primary/80 dark:text-slate-300 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">person</span> Minha Conta
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
}
