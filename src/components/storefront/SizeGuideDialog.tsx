"use client";

import { useRef } from "react";
import SizeGuideTable from "./SizeGuideTable";
import { SIZE_GUIDE_HREF } from "@/lib/size-guide";

// Abre a tabela de medidas sobre a página, sem tirar a cliente da compra.
// É um link de verdade: se a janela não puder abrir, leva à tabela no FAQ.
export default function SizeGuideDialog({ selectedSize }: { selectedSize?: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== "function") return; // segue o link
    e.preventDefault();
    dialog.showModal();
  };

  return (
    <>
      <a
        href={SIZE_GUIDE_HREF}
        onClick={open}
        aria-haspopup="dialog"
        className="text-sm text-accent-blue underline underline-offset-4 hover:text-primary"
      >
        Guia de tamanhos
      </a>

      <dialog
        ref={dialogRef}
        aria-labelledby="size-guide-title"
        // Clique fora da caixa (no fundo escurecido) fecha a janela.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-2xl p-0 bg-background-light dark:bg-background-dark text-primary dark:text-slate-100 shadow-xl backdrop:bg-black/50"
      >
        <div className="p-5 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="size-guide-title" className="text-2xl font-serif">Guia de tamanhos</h2>
              <p className="text-sm text-primary/70 dark:text-slate-400 mt-1">
                Medidas do corpo, em centímetros. Na dúvida, fale com a equipe pelo WhatsApp.
              </p>
            </div>
            <form method="dialog">
              <button
                type="submit"
                aria-label="Fechar guia de tamanhos"
                className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full hover:bg-primary/5"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </form>
          </div>
          <SizeGuideTable highlight={selectedSize} />
        </div>
      </dialog>
    </>
  );
}
