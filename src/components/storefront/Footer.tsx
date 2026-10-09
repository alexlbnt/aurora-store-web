import React from "react";
import Link from "next/link";
import { whatsappLink, INSTAGRAM_URL } from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-primary/10 pt-16 pb-12 px-6 mt-12 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand & Logo */}
          <div className="flex flex-col gap-4">
            <p className="text-primary dark:text-slate-100 font-serif text-3xl">Aurora</p>
            <p className="text-primary/70 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
              Roupas para dormir melhor.
            </p>
          </div>
          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-primary dark:text-slate-100 font-semibold text-base">A loja</h2>
              <nav className="flex flex-col gap-2">
                <Link href="/about" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Nossa história</Link>
                <Link href="/catalog" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Catálogo</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-primary dark:text-slate-100 font-semibold text-base">Ajuda</h2>
              <nav className="flex flex-col gap-2">
                <Link href="/faq" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Dúvidas frequentes</Link>
                <Link href="/faq#trocas" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Entrega e trocas</Link>
                <Link href="/faq#tamanhos" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Guia de tamanhos</Link>
              </nav>
            </div>
          </div>
          {/* Newsletter & Social */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h2 className="text-primary dark:text-slate-100 font-semibold text-base">Fale com a gente</h2>
              <nav className="flex flex-col gap-2">
                <a href={whatsappLink("Olá! Gostaria de falar com a equipe da Aurora.")} target="_blank" rel="noopener noreferrer" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">WhatsApp</a>
                {INSTAGRAM_URL && (
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-primary/70 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white underline-offset-4 hover:underline">Instagram</a>
                )}
              </nav>
            </div>
          </div>
        </div>
        {/* Bottom Footer */}
        <div className="border-t border-primary/10 dark:border-slate-800 pt-8 flex flex-col items-center gap-4">
          <p className="text-primary/60 dark:text-slate-500 text-sm text-center">
            © 2026 Aurora Sleepwear
          </p>
        </div>
      </div>


    </footer>
  );
}
