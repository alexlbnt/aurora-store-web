import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background-light dark:bg-background-dark border-t border-primary/10 pt-16 pb-24 px-6 mt-12 transition-colors">
      <div className="max-w-screen-md mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
          {/* Brand & Logo */}
          <div className="flex flex-col gap-4">
            <h2 className="text-primary dark:text-slate-100 font-serif text-2xl font-bold tracking-widest">AURORA</h2>
            <p className="text-primary/70 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
              Ressignificando o seu descanso com elegância e conforto.
            </p>
          </div>
          {/* Navigation */}
          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-base">Institucional</h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Nossa História</Link>
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Sustentabilidade</Link>
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Trabalhe Conosco</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-base">Ajuda</h4>
              <nav className="flex flex-col gap-2">
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Dúvidas Frequentes</Link>
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Trocas e Devoluções</Link>
                <Link href="#" className="text-primary/60 dark:text-slate-400 text-sm hover:text-primary dark:hover:text-white transition-colors">Guia de Tamanhos</Link>
              </nav>
            </div>
          </div>
          {/* Newsletter & Social */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-primary dark:text-slate-100 font-serif font-semibold text-base">Fique por dentro</h4>
              <p className="text-primary/60 dark:text-slate-400 text-xs">Assine nossa newsletter para novidades e ofertas exclusivas.</p>
              <div className="flex gap-2 mt-1">
                <input 
                  type="email" 
                  placeholder="Seu e-mail" 
                  className="flex-1 bg-primary/5 dark:bg-white/5 border-primary/20 dark:border-slate-700 rounded-full px-4 py-2 text-sm focus:ring-primary focus:border-primary placeholder:text-primary/30 dark:placeholder:text-slate-500 outline-none text-primary dark:text-white" 
                />
                <button className="bg-primary hover:bg-primary/90 text-background-light text-xs font-semibold px-5 py-2 rounded-full transition-colors uppercase tracking-wider">OK</button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <p className="text-primary dark:text-slate-100 font-serif font-semibold text-sm">Siga-nos</p>
              <div className="flex gap-5">
                <Link href="#" aria-label="Instagram" className="text-primary/60 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                </Link>
                <Link href="#" aria-label="Pinterest" className="text-primary/60 dark:text-slate-400 hover:text-primary dark:hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-xl">push_pin</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Bottom Footer */}
        <div className="border-t border-primary/10 dark:border-slate-800 pt-8 flex flex-col items-center gap-4">
          <p className="text-primary/40 dark:text-slate-500 text-[10px] tracking-[0.2em] uppercase font-medium text-center">
            © 2024 AURORA SLEEPWEAR. FEITO PARA SONHAR.
          </p>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-t border-primary/5 md:hidden">
        <div className="flex h-16 items-center justify-around px-4">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 text-primary dark:text-slate-100">
            <span className="material-symbols-outlined fill-[1]">home</span>
          </Link>
          <Link href="#" className="flex flex-col items-center justify-center gap-1 text-primary dark:text-slate-100 opacity-50 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined">favorite</span>
          </Link>
          <Link href="/cart" className="flex flex-col items-center justify-center gap-1 text-primary dark:text-slate-100 opacity-50 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined">shopping_bag</span>
          </Link>
          <Link href="#" className="flex flex-col items-center justify-center gap-1 text-primary dark:text-slate-100 opacity-50 hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>
      </nav>
    </footer>
  );
}
