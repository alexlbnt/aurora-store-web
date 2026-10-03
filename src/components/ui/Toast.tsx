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

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    };

    window.addEventListener("aurora:toast", handleToast);
    return () => window.removeEventListener("aurora:toast", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-[99999] pointer-events-none flex flex-col gap-2.5"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";
        const isWarning = toast.type === "warning";

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-xl shadow-xl border backdrop-blur-md flex items-start gap-3 transition-all animate-in slide-in-from-top-3 duration-200 ${
              isSuccess
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100 dark:bg-emerald-900/90"
                : isError
                ? "bg-rose-950/90 border-rose-500/30 text-rose-100 dark:bg-rose-900/90"
                : isWarning
                ? "bg-amber-950/90 border-amber-500/30 text-amber-100 dark:bg-amber-900/90"
                : "bg-slate-900/95 border-slate-700 text-white"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {isWarning && <AlertCircle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-sky-400" />}
            </div>

            <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
              {toast.message}
            </div>

            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="shrink-0 p-1 -mr-1 -mt-1 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
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
