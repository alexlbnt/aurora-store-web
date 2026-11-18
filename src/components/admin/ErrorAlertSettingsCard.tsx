"use client";

import { useState } from "react";
import { triggerTestServerError } from "@/app/admin/settings/error-alert-actions";
import { reportClientError } from "@/lib/rollbar-client";

const ENABLED = Boolean(process.env.NEXT_PUBLIC_ROLLBAR_CLIENT_TOKEN);

/** Alerta de erros (Rollbar): mostra se está ligado e permite mandar um erro de teste. */
export default function ErrorAlertSettingsCard() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const sendTest = async () => {
    setBusy(true);
    setMessage(null);
    reportClientError(new Error(`Teste do alerta de erros (navegador) — pode ignorar. ${new Date().toISOString()}`));
    try {
      const res = await triggerTestServerError();
      // Só volta resposta quando a sessão expirou; o normal é o servidor "falhar" de propósito.
      if (res && !res.success) {
        setMessage({ tone: "error", text: res.error });
        return;
      }
    } catch {
      /* esperado: é o erro de teste */
    } finally {
      setBusy(false);
    }
    setMessage({
      tone: "ok",
      text: "Dois erros de teste enviados (servidor e navegador). Eles aparecem no Rollbar em até 1 minuto.",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-primary/10 shadow-sm space-y-4 max-w-5xl">
      <div className="pb-3 border-b border-primary/10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary" aria-hidden="true">bug_report</span>
          Alerta de erros
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quando a loja ou o painel falham, o erro vai para o Rollbar (sem dados de clientes) e um e-mail avisa quem
          cuida do sistema.
        </p>
      </div>

      {ENABLED ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Ligado.</span> Use o teste para
            conferir que os avisos estão chegando.
          </p>
          <button
            type="button"
            onClick={sendTest}
            disabled={busy}
            className="min-h-11 px-4 rounded-lg border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-50 cursor-pointer"
          >
            {busy ? "Enviando..." : "Enviar erro de teste"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Desligado neste ambiente (fica ativo só no site publicado).
        </p>
      )}

      {message && (
        <p
          role="status"
          className={`text-sm ${message.tone === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
