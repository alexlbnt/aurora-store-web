"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pinta o botão de confirmar com a cor de alerta (exclusões). */
  tone?: "default" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Substitui window.confirm: `if (!(await confirm({ title: "Excluir pedido?" }))) return;` */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setOptions(opts);
    });
  }, []);

  // <dialog>.showModal() já prende o foco e fecha com Esc.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (options && dialog && !dialog.open) dialog.showModal();
  }, [options]);

  const close = (value: boolean) => {
    dialogRef.current?.close();
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) close(false);
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg bg-white p-0 text-primary shadow-2xl backdrop:bg-primary/50"
      >
        {options && (
          <div className="p-6">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {options.title}
            </h2>
            {options.description && <p className="mt-2 text-sm leading-relaxed text-primary/80">{options.description}</p>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus
                onClick={() => close(false)}
                className="min-h-11 rounded-lg border border-primary/25 px-4 text-sm font-semibold hover:bg-primary/5"
              >
                {options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={`min-h-11 rounded-lg px-4 text-sm font-semibold text-white ${
                  options.tone === "danger" ? "bg-dawn-ink hover:bg-dawn-ink/90" : "bg-primary hover:bg-accent-blue"
                }`}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
