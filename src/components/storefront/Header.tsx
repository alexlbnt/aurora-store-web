import React from "react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md px-4 py-3 justify-between border-b border-primary/10 transition-colors">
      <button aria-label="Menu" className="text-primary dark:text-primary/80 flex size-10 shrink-0 items-center justify-center hover:bg-primary/5 rounded-full transition-colors">
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>
      <h1 className="text-primary dark:text-primary/90 text-xl font-serif font-bold tracking-widest flex-1 text-center">
        <Link href="/">AURORA</Link>
      </h1>
      <div className="flex items-center gap-1 shrink-0">
        <button aria-label="Search" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[24px]">search</span>
        </button>
        <Link href="/cart" aria-label="Bag" className="text-primary dark:text-primary/80 flex size-10 items-center justify-center hover:bg-primary/5 rounded-full transition-colors relative">
          <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
          <span className="absolute top-2 right-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-white">2</span>
        </Link>
      </div>
    </header>
  );
}
