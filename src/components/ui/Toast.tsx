"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export function showToast(message: string, type: ToastType = "success") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("aurora:toast", {
        detail: { message, type, id: Math.random().toString(36).substring(2, 9) },
      })
    );
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (!customEvent.detail) return;

      const newToast = customEvent.detail;
      setToasts((prev) => [...prev, newToast]);

      // Erros ficam mais tempo na tela: a pessoa precisa ler o que corrigir.
      const duration = newToast.type === "error" || newToast.type === "warning" ? 7000 : 3500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    window.addEventListener("aurora:toast", handleToast);
    return () => window.removeEventListener("aurora:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[99999] pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            role={isError || isWarning ? "alert" : "status"}
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-lg shadow-lg border border-primary/10 border-l-4 bg-white text-primary flex items-start gap-3 ${
              isSuccess
                ? "border-l-dew"
                : isError
                ? "border-l-dawn-ink"
                : isWarning
                ? "border-l-amber-500"
                : "border-l-accent-blue"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-primary" />}
              {isError && <AlertCircle className="w-5 h-5 text-dawn-ink" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-amber-600" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-accent-blue" />}
            </div>

            <div className="flex-1 text-sm font-medium leading-relaxed">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="shrink-0 size-8 -mr-1 -mt-1 flex items-center justify-center text-primary/60 hover:text-primary rounded-lg transition-colors cursor-pointer"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
